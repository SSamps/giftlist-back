import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import jwt from 'jsonwebtoken';
import sendgrid from '@sendgrid/mail';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import { ListGroupBaseModel } from '../../models/listGroups/ListGroupBaseModel';
import {
    giftGroupChildMemberBasePerms,
    giftGroupMemberBasePerms,
    basicListMemberBasePerms,
    giftListMemberBasePerms,
    PERM_GROUP_INVITE,
} from '../../models/listGroups/listGroupPermissions';
import { BasicListModel, BASIC_LIST } from '../../models/listGroups/variants/discriminators/singular/BasicListModel';
import {
    GiftGroupChildModel,
    GIFT_GROUP_CHILD,
} from '../../models/listGroups/variants/discriminators/child/GiftGroupChildModel';
import { GiftGroupModel, GIFT_GROUP } from '../../models/listGroups/variants/discriminators/parent/GiftGroupModel';
import { GiftListModel, GIFT_LIST } from '../../models/listGroups/variants/discriminators/singular/GiftListModel';
import {
    IbasicListMember,
    IgiftGroupChildMember,
    IgiftGroupMember,
    IgiftListMember,
    invalidGroupVariantError,
} from '../../models/listGroups/listGroupInterfaces';

const router: Router = express.Router();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

interface IinviteToken {
    alg: string;
    typ: string;
    senderName: string;
    groupName: string;
    groupId: string;
    iat: number;
    exp: number;
}

// @route POST api/groups/:groupid/invite/send
// @desc Send an invite
// @access Private
router.post(
    '/:groupid/invite/send',
    authMiddleware,
    check('invitedEmails', 'invitedEmails is required').not().isEmpty(),
    check('invitedEmails', 'invitedEmails must be an array').isArray(),
    check('invitedEmails.*', 'invitedEmails must contain only emails').isEmail(),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/:groupid/invite/send hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;

        try {
            const foundGroup = await ListGroupBaseModel.findOne().and([
                { _id: groupIdParams },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_INVITE },
                        { 'members.userId': userIdToken, 'members.permissions': PERM_GROUP_INVITE },
                    ],
                },
            ]);

            if (!foundGroup) {
                return res.status(400).send('Invalid groupId or unauthorized');
            }

            const { groupName, _id } = foundGroup;
            const senderName = req.user.displayName;

            const payload = {
                senderName: senderName,
                groupName: groupName,
                groupId: _id,
            };

            const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

            const inviteBaseLink = 'https://giftlist.sampsy.dev/invite/';
            const inviteLink = inviteBaseLink + token;

            const msg = {
                to: req.body.invitedEmails,
                from: {
                    name: 'GiftList',
                    email: 'invites.giftlist@sampsy.dev',
                },
                templateId: 'd-cc51518222ad4be5b77288e51c7b02a3',
                dynamic_template_data: {
                    groupName: groupName,
                    senderName: senderName,
                    inviteLink: inviteLink,
                },
            };

            await sendgrid.send(msg);
            return res.send(200);
        } catch (err) {
            console.log(err);
            return res.send(500);
        }
    }
);

// @route POST api/groups/invite/verify/:groupToken
// @desc Verify an invite token
// @access Private
router.get('/invite/verify/:groupToken', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET /api/groups/invite/verify/:groupToken hit');

    const groupToken = req.params.groupToken;

    try {
        const decodedGroupToken = jwt.verify(groupToken, process.env.JWT_SECRET) as IinviteToken;

        // TODO check the group also still exists
        const { senderName, groupName } = decodedGroupToken;
        return res.json({ senderName: senderName, groupName: groupName });
    } catch (err) {
        if (err.message) {
            return res.status(400).send(err.message);
        } else {
            return res.send(500);
        }
    }
});

// @route POST api/groups/invite/accept/:groupToken
// @desc Accept an invite
// @access Private
router.post('/invite/accept/:groupToken', authMiddleware, async (req: Request, res: Response) => {
    console.log('POST /api/groups/invite/accept/:groupid hit');

    const tokenUserId = req.user._id;
    const tokenDisplayName = req.user.displayName;
    const groupToken = req.params.groupToken;

    let decodedGroupToken;

    try {
        decodedGroupToken = jwt.verify(groupToken, process.env.JWT_SECRET) as IinviteToken;
    } catch (err) {
        if (err.message) {
            return res.status(400).send(err.message);
        } else {
            return res.send(500);
        }
    }

    const { groupId } = decodedGroupToken;

    try {
        var foundGroup = await ListGroupBaseModel.findOne().and([
            { _id: groupId },
            {
                $nor: [{ 'owner.userId': tokenUserId }, { 'members.userId': tokenUserId }],
            },
        ]);

        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or user already in group');
        }

        const { groupVariant } = foundGroup;

        switch (groupVariant) {
            case BASIC_LIST: {
                let newMember: IbasicListMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: basicListMemberBasePerms,
                };
                await BasicListModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case GIFT_LIST: {
                let newMember: IgiftListMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: giftListMemberBasePerms,
                };
                await GiftListModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case GIFT_GROUP_CHILD: {
                let newMember: IgiftGroupChildMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: giftGroupChildMemberBasePerms,
                };
                await GiftGroupChildModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case GIFT_GROUP: {
                let newParentMember: IgiftGroupMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: giftGroupMemberBasePerms,
                };
                let newChildMember: IgiftGroupChildMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: giftGroupChildMemberBasePerms,
                };
                await GiftGroupModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newParentMember } });
                await ListGroupBaseModel.updateMany({ parentGroupId: groupId }, { $push: { members: newChildMember } });

                break;
            }
            default:
                throw new invalidGroupVariantError(groupVariant);
        }

        return res.sendStatus(200).json({ _id: groupId });
    } catch (err) {
        console.log(err);
        return res.status(500).send('Server error');
    }
});

module.exports = router;

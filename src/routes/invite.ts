import express, { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import jwt from 'jsonwebtoken';
import sendgrid from '@sendgrid/mail';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import ListGroupBase, { IgroupMemberBase, invalidGroupVariantError } from '../models/listGroups/ListGroup';
import {
    listGroupChildBaseMemberPerms,
    listGroupParentBaseMemberPerms,
    listGroupSingleBaseMemberPerms,
    PERM_GROUP_INVITE,
} from '../models/listGroups/permissions/ListGroupPermissions';
import ListGroupSingle, { BASIC_LIST, GIFT_LIST, IgroupMemberSingle } from '../models/listGroups/ListGroupSingle';
import ListGroupChild, { CHILD_GIFT_LIST, IgroupMemberChild } from '../models/listGroups/ListGroupChild';
import ListGroupParent, { IgroupMemberParent, PARENT_GIFT_GROUP } from '../models/listGroups/ListGroupParent';

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

// @route POST api/invite/test
// @desc Send a test email
// @access Public
router.post('/test', async (req: Request, res: Response) => {
    try {
        const msg = {
            to: 'simonjsampson@gmail.com',
            from: {
                name: 'GiftList',
                email: 'invites.giftlist@sampsy.dev',
            },
            templateId: 'd-cc51518222ad4be5b77288e51c7b02a3',
            dynamic_template_data: {
                groupName: 'testGroup',
                senderName: 'Simon',
                inviteLink: 'www.testlink.com',
            },
        };

        await sendgrid.send(msg);

        return res.send(200);
    } catch (error) {
        return res.send(500);
    }
});

// @route POST api/invite/send/:groupid
// @desc Send an invite
// @access Private
router.post(
    '/send/:groupid',
    auth,
    check('invitedEmail', 'invitedEmail is required').not().isEmpty(),
    check('invitedEmail', 'invitedEmail must be an email').isEmail(),
    async (req: Request, res: Response) => {
        console.log('POST /api/invite/send/:groupid hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;

        try {
            // TODO check whether this works for members as well as the owner.
            var foundGroup = await ListGroupBase.findOne().and([
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
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }

        const { groupName, _id } = foundGroup;
        const senderName = req.user.displayName;

        const payload = {
            senderName: senderName,
            groupName: groupName,
            groupId: _id,
        };

        try {
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' }, async (err, token) => {
                if (err) throw err;

                const inviteBaseLink = 'https://giftlist.sampsy.dev/invite/';
                const inviteLink = inviteBaseLink + token;

                const msg = {
                    to: req.body.invitedEmail,
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
            });
        } catch (err) {
            console.log(err);
            return res.send(500);
        }
    }
);

// @route POST api/invite/verify/:groupToken
// @desc Verify an invite token
// @access Private
router.get('/verify/:groupToken', auth, async (req: Request, res: Response) => {
    console.log('GET /api/invite/verify/:groupToken hit');

    const groupTokenParams = req.params.groupToken;

    try {
        const decodedGroupTokenParams = jwt.verify(groupTokenParams, process.env.JWT_SECRET) as IinviteToken;

        const { senderName, groupName } = decodedGroupTokenParams;
        return res.json({ senderName: senderName, groupName: groupName });
    } catch (err) {
        if (err.message) {
            return res.status(400).send(err.message);
        } else {
            return res.send(500);
        }
    }
});

// @route POST api/invite/accept/:groupToken
// @desc Accept an invite
// @access Private
router.post('/accept/:groupToken', auth, async (req: Request, res: Response) => {
    console.log('POST /api/invite/accept/:groupid hit');

    const userIdToken = req.user._id;
    const groupTokenParams = req.params.groupToken;

    let decodedGroupTokenParams;

    try {
        decodedGroupTokenParams = jwt.verify(groupTokenParams, process.env.JWT_SECRET) as IinviteToken;
    } catch (err) {
        if (err.message) {
            return res.status(400).send(err.message);
        } else {
            return res.send(500);
        }
    }

    const { groupId } = decodedGroupTokenParams;

    try {
        var foundGroup = await ListGroupBase.findOne().and([
            { _id: groupId },
            {
                $nor: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
            },
        ]);

        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or user already in group');
        }

        const { groupVariant } = foundGroup;

        switch (groupVariant) {
            case BASIC_LIST:
            case GIFT_LIST: {
                let newMember: IgroupMemberSingle = {
                    userId: userIdToken,
                    permissions: listGroupSingleBaseMemberPerms,
                };
                await ListGroupSingle.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case CHILD_GIFT_LIST: {
                let newMember: IgroupMemberChild = { userId: userIdToken, permissions: listGroupChildBaseMemberPerms };
                await ListGroupChild.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case PARENT_GIFT_GROUP: {
                let newMember: IgroupMemberParent = {
                    userId: userIdToken,
                    permissions: listGroupParentBaseMemberPerms,
                };
                await ListGroupParent.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            default:
                throw new invalidGroupVariantError(groupVariant);
        }

        return res.send(200);
    } catch (err) {
        console.log(err.message);
        console.log(err);
        return res.status(500).send('Server error');
    }
});

module.exports = router;
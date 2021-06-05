import express, { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import {
    IgroupMemberBase,
    invalidGroupVariantError,
    invalidParentVariantError,
    listGroupBaseModel,
    TlistGroupAny,
} from '../models/listGroups/ListGroupBase';
import {
    giftGroupChildOwnerBasePerms,
    basicListOwnerBasePerms,
    giftListOwnerBasePerms,
    PERM_CHILD_GROUP_CREATE,
    PERM_GROUP_DELETE,
} from '../models/listGroups/permissions/ListGroupPermissions';
import GiftGroupChildModel, {
    GIFT_GROUP_CHILD,
    IgiftGroupChildMember,
    TgiftGroupChildFields,
} from '../models/listGroups/child/GiftGroupChild';
import GiftGroupModel, { GIFT_GROUP, TgiftGroupFields } from '../models/listGroups/parent/GiftGroup';
import {
    BASIC_LIST,
    IbasicListMember,
    BasicListModel,
    TbasicListFields,
} from '../models/listGroups/singular/BasicList';
import {
    LIST_GROUP_CHILD_VARIANTS,
    LIST_GROUP_PARENT_VARIANTS,
    LIST_GROUP_SINGLE_VARIANTS,
} from '../models/listGroups/variants/ListGroupVariants';
import { GiftListModel, GIFT_LIST, IgiftListMember, TgiftListFields } from '../models/listGroups/singular/GiftList';

const router: Router = express.Router();

// @route GET api/groups/user/:userid
// @desc Get a user's own groups
// @access Private
router.get('/user/:userid', auth, async (req: Request, res: Response) => {
    console.log('GET /api/groups/:userid hit');

    const userIdParams = req.params.userid;
    const userIdToken = req.user._id;

    if (userIdParams !== userIdToken.toString()) {
        return res.status(401).json({ msg: 'User not authorized' });
    }

    try {
        let foundMemberGroups = await listGroupBaseModel.find({
            $or: [{ 'owner.userId': userIdParams }, { 'members.userId': userIdParams }],
        });
        let foundOwnedGroups: TlistGroupAny[] = [];

        for (var i = foundMemberGroups.length - 1; i >= 0; i--) {
            let document = foundMemberGroups[i];
            if (document.owner.userId.toString() === userIdParams) {
                foundOwnedGroups.push(document);
                foundMemberGroups.splice(i, 1);
            }
        }

        if (foundOwnedGroups.length == 0 && foundMemberGroups.length == 0) {
            return res.status(404).json({ msg: 'No groups found' });
        }

        return res.status(200).json({ ownedGroups: foundOwnedGroups, memberGroups: foundMemberGroups });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route POST api/groups/single
// @desc Add a new single group
// @access Private
router.post(
    '/single',
    auth,
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is not a valid single group type').isIn(LIST_GROUP_SINGLE_VARIANTS),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/single hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupVariant, groupName } = req.body;

        try {
            switch (groupVariant) {
                case BASIC_LIST: {
                    const owner: IbasicListMember = {
                        userId: userIdToken,
                        permissions: basicListOwnerBasePerms,
                    };
                    const newListGroupData: TbasicListFields = { owner, groupName };
                    const newListGroup = new BasicListModel(newListGroupData);
                    await newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                case GIFT_LIST: {
                    const owner: IgiftListMember = {
                        userId: userIdToken,
                        permissions: giftListOwnerBasePerms,
                    };
                    const newListGroupData: TgiftListFields = { owner, groupName };
                    const newListGroup = new GiftListModel(newListGroupData);
                    await newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                default:
                    throw new invalidGroupVariantError(groupVariant);
            }
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route POST api/groups/child
// @desc Add a new child group
// @access Private
router.post(
    '/child',
    auth,
    check('groupVariant', 'groupVariant is not a valid child group type').isIn(LIST_GROUP_CHILD_VARIANTS),
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is required').not().isEmpty(),
    check('parentGroupId', 'parentGroupId is required for child groups').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/child hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupVariant, groupName, parentGroupId } = req.body;

        // Validation
        try {
            const foundParentGroup = await listGroupBaseModel.findOne().and([
                { _id: parentGroupId },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': PERM_CHILD_GROUP_CREATE },
                        { 'members.userId': userIdToken, 'owner.permissions': PERM_CHILD_GROUP_CREATE },
                    ],
                },
            ]);

            if (!foundParentGroup) {
                return res.status(400).send('Invalid parentGroupId or unauthorized');
            }

            const parentVariant = foundParentGroup.groupVariant;

            switch (groupVariant) {
                case GIFT_GROUP_CHILD: {
                    if (parentVariant !== GIFT_GROUP) {
                        throw new invalidParentVariantError(groupVariant, parentVariant);
                    }
                    const owner: IgiftGroupChildMember = {
                        userId: userIdToken,
                        permissions: giftGroupChildOwnerBasePerms,
                    };
                    const newListGroupData: TgiftGroupChildFields = { owner, groupName, parentGroupId };
                    const newListGroup = new GiftGroupChildModel(newListGroupData);
                    await newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                default:
                    throw new invalidGroupVariantError(groupVariant);
            }
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route POST api/groups/parent
// @desc Add a new parent group
// @access Private
router.post(
    '/parent',
    auth,
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is not a valid parent group type').isIn(LIST_GROUP_PARENT_VARIANTS),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/parent hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupVariant, groupName } = req.body;

        try {
            switch (groupVariant) {
                case GIFT_GROUP: {
                    const owner: IgiftGroupChildMember = {
                        userId: userIdToken,
                        permissions: giftGroupChildOwnerBasePerms,
                    };
                    const newGroupData: TgiftGroupFields = { owner, groupName };
                    const newGroup = new GiftGroupModel(newGroupData);
                    await newGroup.save();
                    return res.status(200).json(newGroup);
                }
                default:
                    throw new invalidGroupVariantError(groupVariant);
            }
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// TODO potentially remove this route after no longer needed for testing.
// @route PUT api/groups/join/groupid
// @desc Join a group
// @access Private
router.put('/join/:groupid', auth, async (req: Request, res: Response) => {
    console.log('PUT /api/groups/leave hit');

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    // Validation group must exist and must not already be a member or owner
    try {
        const foundGroup = await listGroupBaseModel.findOne().and([
            { _id: groupIdParams },
            {
                $nor: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
            },
        ]);

        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or already a member');
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }

    // TODO permission users to join a group. Add an invited array?

    const newMember: IgroupMemberBase = { userId: userIdToken, permissions: [] };

    try {
        const updatedGroup = await listGroupBaseModel.findOneAndUpdate(
            { _id: groupIdParams },
            { $push: { members: newMember } },
            { new: true }
        );
        return res.status(200).json(updatedGroup);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route PUT api/groups/leave/groupid
// @desc Leave a group if a member
// @access Private
router.put('/leave/:groupid', auth, async (req: Request, res: Response) => {
    console.log('PUT /api/groups/leave hit');

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    try {
        const foundGroup = await listGroupBaseModel
            .findOne()
            .and([{ _id: groupIdParams }, { 'members.userId': userIdToken }]);

        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or not a member');
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }

    try {
        const updatedGroup = await listGroupBaseModel.findOneAndUpdate(
            { _id: groupIdParams },
            { $pull: { members: { userId: userIdToken } } },
            { new: true }
        );
        return res.status(200).json(updatedGroup);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route DELETE api/groups/delete/groupid
// @desc Delete a group and all child groups if any
// @access Private

router.delete('/delete/:groupid', auth, async (req: Request, res: Response) => {
    console.log('DELETE /api/groups/delete hit');

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    // Group must exist and user must have delete permissions
    try {
        var foundGroup = await listGroupBaseModel.findOne().and([
            { _id: groupIdParams },
            {
                $or: [
                    { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_DELETE },
                    { 'members.userId': userIdToken, 'owner.permissions': PERM_GROUP_DELETE },
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

    // TODO Delete all associated list items and messages
    try {
        if (!LIST_GROUP_PARENT_VARIANTS.includes(foundGroup.groupVariant)) {
            await listGroupBaseModel.deleteOne({ _id: groupIdParams });
            return res.status(200).json({ msg: 'Group deleted' });
        } else {
            await GiftGroupChildModel.deleteMany({ parentGroupId: groupIdParams });
            await GiftGroupModel.deleteOne({ _id: groupIdParams });
            return res.status(200).json({ msg: 'Parent group and all child groups deleted' });
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// TODO Routes to grant / revoke permissions?

module.exports = router;

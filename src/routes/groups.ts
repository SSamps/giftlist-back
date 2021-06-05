import express, { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import ListGroupBase, {
    IgroupMemberBase,
    invalidGroupVariantError,
    TlistGroupAny,
} from '../models/listGroups/ListGroup';
import {
    listGroupChildBaseOwnerPerms,
    listGroupSingleBasicListOwnerPerms,
    listGroupSingleGiftListOwnerPerms,
    PERM_CHILD_GROUP_CREATE,
    PERM_GROUP_DELETE,
} from '../models/listGroups/permissions/ListGroupPermissions';
import ListGroupChild, {
    LIST_GROUP_CHILD_VARIANTS,
    IgroupMemberChild,
    TlistGroupChildBase,
} from '../models/listGroups/ListGroupChild';
import ListGroupParent, {
    IgroupMemberParent,
    LIST_GROUP_PARENT_VARIANTS,
    TlistGroupParentBase,
} from '../models/listGroups/ListGroupParent';
import {
    BASIC_LIST,
    GIFT_LIST,
    IgroupMemberBasicList,
    IgroupMemberGiftList,
    basicListModel,
    giftListModel,
    LIST_GROUP_SINGLE_VARIANTS,
    TbasicListFields,
    TgiftListFields,
} from '../models/listGroups/ListGroupSingle';

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
        let foundMemberGroups = await ListGroupBase.find({
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
                    const owner: IgroupMemberBasicList = {
                        userId: userIdToken,
                        permissions: listGroupSingleBasicListOwnerPerms,
                    };
                    const newListGroupData: TbasicListFields = { owner, groupName };
                    const newListGroup = new basicListModel(newListGroupData);
                    await newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                case GIFT_LIST: {
                    const owner: IgroupMemberGiftList = {
                        userId: userIdToken,
                        permissions: listGroupSingleGiftListOwnerPerms,
                    };
                    const newListGroupData: TgiftListFields = { owner, groupName };
                    const newListGroup = new giftListModel(newListGroupData);
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
            const foundParentGroup = await ListGroupParent.findOne().and([
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
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }

        // TODO The user hasn't exceeded max number of allowable children

        const owner: IgroupMemberChild = {
            userId: userIdToken,
            permissions: listGroupChildBaseOwnerPerms,
        };
        const newListGroupData: TlistGroupChildBase = { owner, groupVariant, groupName, parentGroupId };

        try {
            const newListGroup = new ListGroupChild(newListGroupData);
            await newListGroup.save();
            return res.status(200).json(newListGroup);
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
        const owner: IgroupMemberParent = {
            userId: userIdToken,
            permissions: listGroupChildBaseOwnerPerms,
        };

        const newListGroupData: TlistGroupParentBase = { owner, groupVariant, groupName };

        try {
            const newListGroup = new ListGroupParent(newListGroupData);
            await newListGroup.save();
            return res.status(200).json(newListGroup);
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
        const foundGroup = await ListGroupBase.findOne().and([
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
        const updatedGroup = await ListGroupBase.findOneAndUpdate(
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
        const foundGroup = await ListGroupBase.findOne().and([
            { _id: groupIdParams },
            { 'members.userId': userIdToken },
        ]);

        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or not a member');
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }

    try {
        const updatedGroup = await ListGroupBase.findOneAndUpdate(
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
        var foundGroup = await ListGroupBase.findOne().and([
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
            await ListGroupBase.deleteOne({ _id: groupIdParams });
            return res.status(200).json({ msg: 'Group deleted' });
        } else {
            await ListGroupChild.deleteMany({ parentGroupId: groupIdParams });
            await ListGroupParent.deleteOne({ _id: groupIdParams });
            return res.status(200).json({ msg: 'Parent group and all child groups deleted' });
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// TODO Routes to grant / revoke permissions?

module.exports = router;

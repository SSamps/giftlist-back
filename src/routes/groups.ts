import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import { listGroupBaseModel } from '../models/listGroups/ListGroupBase';
import {
    giftGroupChildOwnerBasePerms,
    basicListOwnerBasePerms,
    giftListOwnerBasePerms,
    PERM_CHILD_GROUP_CREATE,
    giftGroupOwnerBasePerms,
    PERM_GROUP_ADMIN,
    PERM_MODIFIERS_ALL,
    PERM_MUTABLE_ALL,
    PERM_MODIFIER_ADD,
    PERM_MODIFIER_REMOVE,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
} from '../models/listGroups/permissions/listGroupPermissions';
import { GiftGroupChildModel, GIFT_GROUP_CHILD } from '../models/listGroups/discriminators/child/GiftGroupChild';
import { GiftGroupModel, GIFT_GROUP } from '../models/listGroups/discriminators/parent/GiftGroup';
import { BASIC_LIST, BasicListModel } from '../models/listGroups/discriminators/singular/BasicList';
import {
    LIST_GROUP_CHILD_VARIANTS,
    LIST_GROUP_PARENT_VARIANTS,
    LIST_GROUP_SINGLE_VARIANTS,
} from '../models/listGroups/discriminators/variants/listGroupVariants';
import { GiftListModel, GIFT_LIST } from '../models/listGroups/discriminators/singular/GiftList';
import { deleteGroupAndAnyChildGroups } from './helperFunctions';
import {
    IbasicListMember,
    IgiftGroupChildMember,
    IgiftGroupMember,
    IgiftListMember,
    IgroupMemberBase,
    invalidGroupVariantError,
    invalidParentVariantError,
    TlistGroupAny,
    TnewBasicListFields,
    TnewGiftGroupChildFields,
    TnewGiftGroupFields,
    TnewGiftListFields,
} from '../models/listGroups/discriminators/interfaces';
import { TgiftListItem } from '../models/listGroups/listItems';
import mongoose from 'mongoose';

const router: Router = express.Router();

// @route GET api/groups/user
// @desc Get groups a user owns or is a member of
// @access Private
router.get('/user', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET /api/groups/user hit');

    const userIdToken = req.user._id;

    try {
        let foundMemberGroups = await listGroupBaseModel.find({
            $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
        });
        let foundOwnedGroups: TlistGroupAny[] = [];

        for (var i = foundMemberGroups.length - 1; i >= 0; i--) {
            let document = foundMemberGroups[i];
            if (document.owner.userId.toString() === userIdToken.toString()) {
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
// @desc Add a new singular group
// @access Private
router.post(
    '/single',
    authMiddleware,
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
                    const newListGroupData: TnewBasicListFields = { owner, groupName };
                    const newListGroup = new BasicListModel(newListGroupData);
                    await newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                case GIFT_LIST: {
                    const owner: IgiftListMember = {
                        userId: userIdToken,
                        permissions: giftListOwnerBasePerms,
                    };
                    const newListGroupData: TnewGiftListFields = { owner, groupName };
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
    authMiddleware,
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
                console.log(foundParentGroup);
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
                    const newListGroupData: TnewGiftGroupChildFields = { owner, groupName, parentGroupId };
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
    authMiddleware,
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
                    const owner: IgiftGroupMember = {
                        userId: userIdToken,
                        permissions: giftGroupOwnerBasePerms,
                    };
                    const newGroupData: TnewGiftGroupFields = { owner, groupName };
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
router.put('/join/:groupid', authMiddleware, async (req: Request, res: Response) => {
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
router.put('/leave/:groupid', authMiddleware, async (req: Request, res: Response) => {
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
router.delete('/delete/:groupid', authMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE /api/groups/delete:groupid hit');

    const userId = req.user._id;
    const groupId = req.params.groupid;

    try {
        const result = await deleteGroupAndAnyChildGroups(userId, groupId);

        return res.status(result.status).json(result.msg);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route PUT api/groups/permission/groupid
// @desc Modify the permissions for users in a group
// @access Private
router.put(
    '/permission/:groupid',
    authMiddleware,
    check('targetUserId', 'targetUserId is required').not().isEmpty(),
    check('targetPermission', 'targetPermission is required').not().isEmpty(),
    check('targetPermission', 'targetPermission cannot be modified').isIn(PERM_MUTABLE_ALL),
    check('modification', 'modification is required').not().isEmpty(),
    check('modification', 'Invalid permission modifier').isIn(PERM_MODIFIERS_ALL),
    async (req: Request, res: Response) => {
        console.log('put /api/groups/permission:groupid hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { targetUserId, targetPermission, modification } = req.body;

        try {
            var foundGroup = await listGroupBaseModel.findOne({
                $and: [
                    { _id: groupIdParams },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                            { 'members.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                        ],
                    },
                    { 'members.userId': targetUserId },
                ],
            });
            if (!foundGroup) {
                return res
                    .status(400)
                    .send(
                        'Invalid groupId, target user not in the group or requesting user is not authorised to manage permissions on this group'
                    );
            } else if (LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
                return res.status(400).send('Invalid permission: users cannot be invited directly to child groups');
            }

            if (modification === PERM_MODIFIER_ADD) {
                await foundGroup.update(
                    { $addToSet: { 'members.$[member].permissions': targetPermission } },
                    { arrayFilters: [{ 'member.userId': targetUserId }] }
                );
            } else if (modification === PERM_MODIFIER_REMOVE) {
                await foundGroup.update(
                    { $pull: { 'members.$[member].permissions': targetPermission } },
                    { arrayFilters: [{ 'member.userId': targetUserId }] }
                );
            }

            return res.status(200).json({ msg: 'Permissions updated' });
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route PUT api/groups/kick/groupid
// @desc Kick a user from a group
// @access Private
router.put(
    '/kick/:groupid',
    authMiddleware,
    check('targetUserId', 'targetUserId is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('put /api/groups/kick:groupid hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { targetUserId } = req.body;

        try {
            var foundGroup = await listGroupBaseModel.findOne({
                $and: [
                    { _id: groupIdParams },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                            { 'members.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                        ],
                    },
                    { 'members.userId': targetUserId },
                ],
            });
            if (!foundGroup) {
                return res
                    .status(400)
                    .send(
                        'Invalid groupId, target user not in the group or requesting user is not authorised to kick users from this group'
                    );
            } else if (LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
                return res.status(400).send('Invalid permission: users cannot be kicked from child groups');
            }

            await foundGroup.update({ $pull: { members: { userId: targetUserId } } });
            return res.status(200).json({ msg: 'User kicked' });
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route POST api/groups/giftlist/:groupid/items
// @desc Add an item to a giftlist
// @access Private
router.post(
    '/giftlist/:groupid/items',
    authMiddleware,
    check('body', 'A list item body is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('POST api/groups/giftlist/:groupid/items');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const { body, link } = req.body;

        // TODO might be able to put some of this in a helper function.
        try {
            const foundGroup = await GiftListModel.findOne({
                $and: [
                    { _id: groupId, groupVariant: GIFT_LIST },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_RW_LIST_ITEMS },
                            { 'members.userId': userIdToken, 'members.permissions': PERM_GROUP_RW_SECRET_LIST_ITEMS },
                        ],
                    },
                ],
            });

            if (!foundGroup) {
                return res.status(404).send();
            }

            const newListItem: TgiftListItem = {
                authorId: userIdToken,
                body: body,
                link: link,
            };

            if (foundGroup.owner.userId.toString() === userIdToken.toString()) {
                if (foundGroup.listItems.length + 1 > foundGroup.maxListItems) {
                    return res.status(400).send('You have reached the maximum number of list items');
                }
                await foundGroup.update({ $push: { listItems: newListItem } });
                return res.status(200).send();
            } else {
                let ownedItems = 0;
                foundGroup.secretListItems.forEach((item) => {
                    if (item.authorId.toString() === userIdToken.toString()) {
                        ownedItems += 1;
                        console.log('ownedItems now: ' + ownedItems);
                    }
                });

                if (ownedItems + 1 > foundGroup.maxSecretListItemsEach) {
                    return res.status(400).send('You have reached the maximum number of secret list items');
                }
                await foundGroup.update({ $push: { secretListItems: newListItem } });
                return res.status(200).send();
            }
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

// @route POST api/groups/giftlist/:groupid/items/:itemid
// @desc Delete an item from a giftlist
// @access Private
router.delete('/giftlist/:groupid/items/:itemid', authMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE api/groups/giftlist/:groupid/items');

    const userIdToken = req.user._id;
    const groupId = req.params.groupid;
    const itemId = req.params.itemid;

    // TODO might be able to put some of this in a helper function.
    try {
        const foundGroup = await GiftListModel.findOne({
            $and: [
                { _id: groupId, groupVariant: GIFT_LIST },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_RW_LIST_ITEMS },
                        { 'members.userId': userIdToken, 'members.permissions': PERM_GROUP_RW_SECRET_LIST_ITEMS },
                    ],
                },
            ],
        });

        if (!foundGroup) {
            return res.status(404).send();
        }

        if (foundGroup.owner.userId.toString() === userIdToken.toString()) {
            let result = await foundGroup.update({ $pull: { listItems: { _id: itemId } } });
            if (result.nModified === 1) {
                return res.status(200).send();
            }
            return res.status(404).send();
        } else {
            let result = await foundGroup.update({ $pull: { secretListItems: { _id: itemId } } });
            if (result.nModified === 1) {
                return res.status(200).send();
            }
            return res.status(404).send();
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
});

// @route PUT api/groups/giftlist/:groupid/items/:itemid
// @desc Modify an item in a giftlist
// @access Private
router.put(
    '/giftlist/:groupid/items/:itemid',
    authMiddleware,
    check('body', 'A list item body is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('PUT api/groups/giftlist/:groupid/items');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const itemId = req.params.itemid;
        const { body, link } = req.body;

        // TODO might be able to put some of this in a helper function.
        try {
            const foundGroup = await GiftListModel.findOne({
                $and: [
                    { _id: groupId, groupVariant: GIFT_LIST },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_RW_LIST_ITEMS },
                            { 'members.userId': userIdToken, 'members.permissions': PERM_GROUP_RW_SECRET_LIST_ITEMS },
                        ],
                    },
                ],
            });

            if (!foundGroup) {
                return res.status(404).send();
            }

            if (foundGroup.owner.userId.toString() === userIdToken.toString()) {
                let result = await foundGroup.update(
                    { $set: { 'listItems.$[item].body': body, 'listItems.$[item].link': link } },
                    { arrayFilters: [{ 'item._id': itemId }] }
                );
                if (result.nModified === 1) {
                    return res.status(200).send();
                }
                return res.status(404).send();
            } else {
                let result = await foundGroup.update({ $pull: { secretListItems: { _id: itemId } } });
                if (result.nModified === 1) {
                    return res.status(200).send();
                }
                return res.status(404).send();
            }
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

module.exports = router;

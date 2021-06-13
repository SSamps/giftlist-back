import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { check, Result, ValidationError, validationResult, oneOf } from 'express-validator';
import { ListGroupBaseModel } from '../models/listGroups/ListGroupBase';
import {
    PERM_GROUP_ADMIN,
    PERM_MODIFIERS_ALL,
    PERM_MUTABLE_ALL,
    PERM_MODIFIER_ADD,
    PERM_MODIFIER_REMOVE,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
} from '../models/listGroups/permissions/listGroupPermissions';
import {
    LIST_GROUP_ALL_VARIANTS,
    LIST_GROUP_CHILD_VARIANTS,
} from '../models/listGroups/discriminators/variants/listGroupVariants';
import { GiftListModel, GIFT_LIST } from '../models/listGroups/discriminators/singular/GiftList';
import {
    addGroup,
    deleteGroupAndAnyChildGroups,
    findItemInGroup,
    handleNewListItemRequest,
    handleNewSecretListItemRequest,
} from './helperFunctions';
import { TlistGroupAny } from '../models/listGroups/discriminators/interfaces';
import mongoose from 'mongoose';
import { TListItem } from '../models/listGroups/listItems';

const router: Router = express.Router();

// TODO will have to update this later to censor the results depending on the user's permissions
// @route GET api/groups
// @desc Get groups a user owns or is a member of
// @access Private
router.get('/user', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET /api/groups hit');

    const userIdToken = req.user._id;

    try {
        let foundMemberGroups = await ListGroupBaseModel.find({
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

// @route POST api/groups/
// @desc Add a new group
// @access Private
router.post(
    '/',
    authMiddleware,
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is not a valid group type').isIn(LIST_GROUP_ALL_VARIANTS),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupVariant, groupName, parentGroupId } = req.body;

        let result;
        try {
            result = await addGroup(userIdToken, groupVariant, groupName, res, parentGroupId);
            return result;
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route PUT api/groups/:groupid/leave
// @desc Leave a group if a member
// @access Private
router.put('/:groupid/leave', authMiddleware, async (req: Request, res: Response) => {
    console.log('PUT /api/groups/:groupid/leave hit');

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    try {
        const foundGroup = await ListGroupBaseModel.findOne().and([
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
        const updatedGroup = await ListGroupBaseModel.findOneAndUpdate(
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

// @route DELETE api/groups/:groupid/delete
// @desc Delete a group and all child groups if any
// @access Private
router.delete('/:groupid/delete', authMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE /api/groups/:groupid/delete hit');

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

// @route PUT api/groups/:groupid/permission
// @desc Modify the permissions for users in a group
// @access Private
router.put(
    '/:groupid/permission',
    authMiddleware,
    check('targetUserId', 'targetUserId is required').not().isEmpty(),
    check('targetPermission', 'targetPermission is required').not().isEmpty(),
    check('targetPermission', 'targetPermission cannot be modified').isIn(PERM_MUTABLE_ALL),
    check('modification', 'modification is required').not().isEmpty(),
    check('modification', 'Invalid permission modifier').isIn(PERM_MODIFIERS_ALL),
    async (req: Request, res: Response) => {
        console.log('put /api/groups/:groupid/permission hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { targetUserId, targetPermission, modification } = req.body;

        try {
            var foundGroup = await ListGroupBaseModel.findOne({
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

// @route PUT api/groups/:groupid/kick
// @desc Kick a user from a group
// @access Private
router.put(
    '/:groupid/kick',
    authMiddleware,
    check('targetUserId', 'targetUserId is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('put /api/groups/:groupid/kick hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { targetUserId } = req.body;

        try {
            var foundGroup = await ListGroupBaseModel.findOne({
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

// @route POST api/groups/:groupid/items
// @desc Add an item to a giftlist
// @access Private
router.post(
    '/:groupid/items',
    authMiddleware,
    oneOf([
        check('listItem', 'A list item or secret list item object is required').not().isEmpty(),
        check('secretListItem', 'A list item or secret list item object is required').not().isEmpty(),
    ]),
    async (req: Request, res: Response) => {
        console.log('POST api/groups/giftlist/:groupid/items');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const { listItem, secretListItem } = req.body;

        if (listItem && secretListItem) {
            return res.status(400).send('You cannot specify a new list item and secret list item in the same request');
        }

        let result;
        try {
            if (listItem) {
                result = await handleNewListItemRequest(userIdToken, groupId, listItem, res);
            } else if (secretListItem) {
                result = await handleNewSecretListItemRequest(userIdToken, groupId, secretListItem, res);
            }
            return result;
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

// @route DELETE api/groups/:groupid/items/:itemid
// @desc Delete an item from a giftlist
// @access Private
router.delete('/:groupid/items/:itemid', authMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE api/groups/:groupid/items/:itemid');

    const userIdToken = req.user._id;
    const groupId = req.params.groupid;
    const itemId = req.params.itemid;

    try {
        const foundGroup = await ListGroupBaseModel.findOne({
            $and: [
                { _id: groupId },
                {
                    $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
                },
            ],
        });

        if (!foundGroup) {
            return res.status(404).send();
        }

        const [itemType, foundItem] = findItemInGroup(foundGroup, itemId);
        if (!foundItem) {
            return res.status(404).send('Item not found');
        }

        if (foundItem.authorId.toString() !== userIdToken.toString()) {
            return res.status(401).send('You can only delete your own items');
        }

        if (itemType === 'listItem') {
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
    '/:groupid/items/:itemid',
    authMiddleware,
    check('body', 'A list item body is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('PUT api/groups/:groupid/items');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const itemId = req.params.itemid;
        const { body, link } = req.body;

        try {
            const foundGroup = await ListGroupBaseModel.findOne({
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

            const [itemType, foundItem] = findItemInGroup(foundGroup, itemId);
            if (!foundItem) {
                return res.status(404).send('Item not found');
            }

            if (foundItem.authorId.toString() !== userIdToken.toString()) {
                return res.status(401).send('You can only modify your own items');
            }

            if (itemType === 'listItem') {
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

// @route PUT api/groups/giftlist/:groupid/items/:itemid/select
// @desc Select an item in a giftlist
// @access Private
router.put('/:groupid/items/:itemid/select', authMiddleware, async (req: Request, res: Response) => {
    console.log('PUT api/groups/:groupid/items/:itemid/select');

    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userIdToken = req.user._id;
    const groupId = req.params.groupid;
    const itemId = req.params.itemid;
    const { body, link } = req.body;

    try {
        const foundGroup = await ListGroupBaseModel.findOne({
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

        const [itemType, foundItem] = findItemInGroup(foundGroup, itemId);
        if (!foundItem) {
            return res.status(404).send('Item not found');
        }

        // need to verify you have

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
});

module.exports = router;

import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { check, Result, ValidationError, validationResult, oneOf } from 'express-validator';
import { ListGroupBaseModel } from '../models/listGroups/ListGroupBase';
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
    LIST_GROUP_ALL_VARIANTS,
    LIST_GROUP_CHILD_VARIANTS,
} from '../models/listGroups/discriminators/variants/listGroupVariants';
import { GiftListModel, GIFT_LIST } from '../models/listGroups/discriminators/singular/GiftList';
import { deleteGroupAndAnyChildGroups } from './helperFunctions';
import {
    IbasicListMember,
    IgiftGroupChildMember,
    IgiftGroupMember,
    IgiftListMember,
    invalidGroupVariantError,
    invalidParentError,
    invalidParentVariantError,
    TlistGroupAny,
    TnewBasicListFields,
    TnewGiftGroupChildFields,
    TnewGiftGroupFields,
    TnewGiftListFields,
} from '../models/listGroups/discriminators/interfaces';
import mongoose from 'mongoose';
import { TnewListItemFields } from '../models/listGroups/listItems';

const router: Router = express.Router();

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

async function validateParentGroup(
    parentGroupId: mongoose.Schema.Types.ObjectId,
    userIdToken: mongoose.Schema.Types.ObjectId,
    childGroupVariant: string
) {
    const foundParentGroup = await ListGroupBaseModel.findOne().and([
        { _id: parentGroupId },
        {
            $or: [
                { 'owner.userId': userIdToken, 'owner.permissions': PERM_CHILD_GROUP_CREATE },
                { 'members.userId': userIdToken, 'owner.permissions': PERM_CHILD_GROUP_CREATE },
            ],
        },
    ]);

    if (!foundParentGroup) {
        throw new invalidParentError(parentGroupId.toString());
    }

    const parentVariant = foundParentGroup.groupVariant;

    switch (childGroupVariant) {
        case GIFT_GROUP_CHILD: {
            if (parentVariant !== GIFT_GROUP) {
                throw new invalidParentVariantError(childGroupVariant, parentVariant);
            }
            break;
        }
        default:
            throw new invalidGroupVariantError(childGroupVariant);
    }
}

async function addGroup(
    userIdToken: mongoose.Schema.Types.ObjectId,
    groupVariant: string,
    groupName: string,
    res: Response,
    parentGroupId: mongoose.Schema.Types.ObjectId
) {
    console.log(parentGroupId);
    if (LIST_GROUP_CHILD_VARIANTS.includes(groupVariant)) {
        if (parentGroupId === undefined) {
            return res.status(400).json({ msg: 'Error: Child groups require a parent group' });
        }
    }
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
            case GIFT_GROUP_CHILD: {
                await validateParentGroup(parentGroupId, userIdToken, groupVariant);
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

async function checkPermissions(
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    permission: string,
    validGroupVariants: string[]
) {
    const foundGroup = await ListGroupBaseModel.findOne({
        $and: [
            { _id: groupId, groupVariant: { $in: validGroupVariants } },
            {
                $or: [
                    { 'owner.userId': userIdToken, 'owner.permissions': permission },
                    { 'members.userId': userIdToken, 'members.permissions': permission },
                ],
            },
        ],
    });

    return foundGroup;
}

function hitMaxListItems(foundValidGroup: TlistGroupAny) {
    return foundValidGroup.listItems.length + 1 > foundValidGroup.maxListItems;
}

function hitMaxSecretListItems(foundValidGroup: TlistGroupAny, userId: mongoose.Schema.Types.ObjectId | string) {
    let ownedItems = 0;
    foundValidGroup.secretListItems.forEach((item) => {
        if (item.authorId.toString() === userId.toString()) {
            ownedItems += 1;
        }
    });

    return ownedItems + 1 > foundValidGroup.maxSecretListItemsEach;
}

async function addListItem(
    group: TlistGroupAny,
    userId: mongoose.Schema.Types.ObjectId | string,
    listItemReq: TnewListItemFields,
    res: Response
) {
    const newListItem: TnewListItemFields = {
        authorId: userId,
        body: listItemReq.body,
        link: listItemReq.link,
    };

    await group.update({ $push: { listItems: newListItem } });
    return res.status(200).send();
}

async function addSecretListItem(
    group: TlistGroupAny,
    userId: mongoose.Schema.Types.ObjectId | string,
    listItemReq: TnewListItemFields,
    res: Response
) {
    const newSecretListItem: TnewListItemFields = {
        authorId: userId,
        body: listItemReq.body,
        link: listItemReq.link,
    };

    await group.update({ $push: { secretListItems: newSecretListItem } });
    return res.status(200).send();
}

async function handleNewListItemRequest(
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    listItemReq: TnewListItemFields,
    res: Response
) {
    if (listItemReq.body === undefined) {
        return res.status(400).send('You must include an item body');
    }

    let permission = PERM_GROUP_RW_LIST_ITEMS;
    let validGroupVariants = [BASIC_LIST, GIFT_LIST, GIFT_GROUP_CHILD];

    let foundValidGroup = await checkPermissions(userIdToken, groupId, permission, validGroupVariants);
    if (!foundValidGroup) {
        return res
            .status(400)
            .send('User is not an owner or member of the supplied group with the correct permissions');
    }

    if (hitMaxListItems(foundValidGroup)) {
        return res.status(400).send('You have reached the maximum number of list items');
    }

    const result = await addListItem(foundValidGroup, userIdToken, listItemReq, res);
    return result;
}

async function handleNewSecretListItemRequest(
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    secretListItemReq: TnewListItemFields,
    res: Response
) {
    if (secretListItemReq.body === undefined) {
        return res.status(400).send('You must include an item body');
    }

    let permission = PERM_GROUP_RW_SECRET_LIST_ITEMS;
    let validGroupVariants = [GIFT_LIST, GIFT_GROUP_CHILD];

    let foundValidGroup = await checkPermissions(userIdToken, groupId, permission, validGroupVariants);
    if (!foundValidGroup) {
        return res.status(400).send('');
    }

    if (hitMaxSecretListItems(foundValidGroup, userIdToken)) {
        res.status(400).send('You have reached the maximum number of secret list items');
    }

    let result = await addSecretListItem(foundValidGroup, userIdToken, secretListItemReq, res);
    return result;
}

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

// @route DELETE api/groups/giftlist/:groupid/items/:itemid
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

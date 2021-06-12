import mongoose, { Schema } from 'mongoose';
import { GiftGroupChildModel, GIFT_GROUP_CHILD } from '../models/listGroups/discriminators/child/GiftGroupChild';
import { ListGroupBaseModel } from '../models/listGroups/ListGroupBase';
import { GiftGroupModel, GIFT_GROUP } from '../models/listGroups/discriminators/parent/GiftGroup';
import {
    basicListOwnerBasePerms,
    giftGroupChildOwnerBasePerms,
    giftGroupOwnerBasePerms,
    giftListOwnerBasePerms,
    PERM_CHILD_GROUP_CREATE,
    PERM_GROUP_DELETE,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
} from '../models/listGroups/permissions/listGroupPermissions';
import {
    LIST_GROUP_CHILD_VARIANTS,
    LIST_GROUP_PARENT_VARIANTS,
} from '../models/listGroups/discriminators/variants/listGroupVariants';
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
import { TnewListItemFields } from '../models/listGroups/listItems';
import { BasicListModel, BASIC_LIST } from '../models/listGroups/discriminators/singular/BasicList';
import { GiftListModel, GIFT_LIST } from '../models/listGroups/discriminators/singular/GiftList';
import { Response } from 'express';

export interface IgroupDeletionResult {
    status: number;
    msg: string;
}

export async function deleteGroupAndAnyChildGroups(
    userId: Schema.Types.ObjectId,
    groupId: string
): Promise<IgroupDeletionResult> {
    var foundGroup = await ListGroupBaseModel.findOne().and([
        { _id: groupId },
        {
            $or: [
                { 'owner.userId': userId, 'owner.permissions': PERM_GROUP_DELETE },
                { 'members.userId': userId, 'members.permissions': PERM_GROUP_DELETE },
            ],
        },
    ]);

    if (!foundGroup) {
        return { status: 400, msg: 'Invalid groupId or unauthorized' };
    }

    // TODO Delete all associated list items and messages

    if (!LIST_GROUP_PARENT_VARIANTS.includes(foundGroup.groupVariant)) {
        await ListGroupBaseModel.deleteOne({ _id: groupId });
        return { status: 200, msg: 'Group deleted' };
    } else {
        await GiftGroupModel.deleteOne({ _id: groupId });
        await GiftGroupChildModel.deleteMany({ parentGroupId: groupId });
        return { status: 200, msg: 'Parent group and all child groups deleted' };
    }
}

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

export async function handleNewListItemRequest(
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

export async function handleNewSecretListItemRequest(
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

export async function addGroup(
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

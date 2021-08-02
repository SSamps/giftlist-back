import mongoose, { LeanDocument, Schema } from 'mongoose';
import {
    GiftGroupChildModel,
    GIFT_GROUP_CHILD,
} from '../models/listGroups/variants/discriminators/child/GiftGroupChildModel';
import { ListGroupBaseModel } from '../models/listGroups/ListGroupBaseModel';
import { GiftGroupModel, GIFT_GROUP } from '../models/listGroups/variants/discriminators/parent/GiftGroupModel';
import {
    basicListOwnerBasePerms,
    giftGroupChildOwnerBasePerms,
    giftGroupOwnerBasePerms,
    giftListOwnerBasePerms,
    PERM_CHILD_GROUP_CREATE,
    PERM_GROUP_DELETE,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_LIST_ITEMS,
    TYPE_PERM_ALL_LIST_GROUP,
} from '../models/listGroups/listGroupPermissions';
import {
    LIST_GROUP_ALL_CENSORABLE,
    LIST_GROUP_ALL_NON_CENSORABLE,
    LIST_GROUP_ALL_WITH_SECRET_ITEMS,
    LIST_GROUP_CHILD_VARIANTS,
    LIST_GROUP_PARENT_VARIANTS,
} from '../models/listGroups/variants/listGroupVariants';
import {
    IbasicListMember,
    IgiftGroupChildMember,
    IgiftGroupMember,
    IgiftListMember,
    invalidGroupVariantError,
    invalidParentError,
    invalidParentVariantError,
    TgroupMemberAny,
    TgroupMemberTypes,
    TlistGroupAny,
    TlistGroupAnyCensoredSingular,
    TlistGroupAnyCensoredWithChildren,
    TlistGroupAnyWithChildren,
    TnewBasicListFields,
    TnewGiftGroupChildFields,
    TnewGiftGroupFields,
    TnewGiftListFields,
} from '../models/listGroups/listGroupInterfaces';
import { TitemTypes, TgiftListItem, TnewListItemFields } from '../models/listGroups/listItemInterfaces';
import { BasicListModel, BASIC_LIST } from '../models/listGroups/variants/discriminators/singular/BasicListModel';
import { GiftListModel, GIFT_LIST } from '../models/listGroups/variants/discriminators/singular/GiftListModel';
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
    itemType: 'listItems' | 'secretListItems',
    listItemReq: TnewListItemFields,
    res: Response
) {
    if (listItemReq.body === undefined) {
        return res.status(400).send('You must include an item body');
    }
    if (listItemReq.links === undefined) {
        return res.status(400).send('You must include an item links array');
    }

    const newListItem: TnewListItemFields = {
        authorId: userId,
        body: listItemReq.body,
        links: listItemReq.links,
    };

    const result = await findOneAndUpdateUsingDiscriminator(
        group.groupVariant,
        { _id: group._id },
        { $push: { [itemType]: newListItem } },
        { new: true }
    );

    return res.status(200).json(result);
}

export async function handleNewListItemRequest(
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    listItemReq: TnewListItemFields,
    res: Response
) {
    let permission = PERM_GROUP_RW_LIST_ITEMS;
    let validGroupVariants = [BASIC_LIST, GIFT_LIST, GIFT_GROUP_CHILD];

    let links = listItemReq.links;
    let body = listItemReq.body;

    if (body.length <= 0) {
        return res.status(400).send('You cannot supply an empty item body');
    }

    for (let i = 0; i < links.length; i++) {
        if (links[i].length <= 0) {
            return res.status(400).send('You cannot supply empty links');
        }
    }

    let foundGroup = await ListGroupBaseModel.findOne({
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

    if (!foundGroup) {
        return res
            .status(400)
            .send('User is not an owner or member of the supplied group with the correct permissions');
    }

    if (hitMaxListItems(foundGroup)) {
        return res.status(400).send('You have reached the maximum number of list items');
    }

    const result = await addListItem(foundGroup, userIdToken, 'listItems', listItemReq, res);
    return result;
}

export async function handleNewSecretListItemRequest(
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    secretListItemReq: TnewListItemFields,
    res: Response
) {
    let permission = PERM_GROUP_RW_SECRET_LIST_ITEMS;
    let validGroupVariants = [GIFT_LIST, GIFT_GROUP_CHILD];

    let body = secretListItemReq.body;

    if (body.length <= 0) {
        return res.status(400).send('You cannot supply an empty item body');
    }

    let links = secretListItemReq.links;
    for (let i = 0; i < links.length; i++) {
        if (links[i].length <= 0) {
            return res.status(400).send('You cannot supply empty links');
        }
    }

    let foundValidGroup = await ListGroupBaseModel.findOne({
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

    if (!foundValidGroup) {
        return res.status(400).send('');
    }

    if (hitMaxSecretListItems(foundValidGroup, userIdToken)) {
        return res.status(400).send('You have reached the maximum number of secret list items');
    }

    let result = await addListItem(foundValidGroup, userIdToken, 'secretListItems', secretListItemReq, res);
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

export function findItemInGroup(
    group:
        | TlistGroupAny
        | TlistGroupAnyWithChildren
        | LeanDocument<TlistGroupAny>
        | LeanDocument<TlistGroupAnyWithChildren>,
    itemId: Schema.Types.ObjectId | string
): [TitemTypes | 'error', TgiftListItem | null] {
    for (let item of group.listItems) {
        if (item._id.toString() === itemId.toString()) {
            return ['listItem', item];
        }
    }
    if (LIST_GROUP_ALL_WITH_SECRET_ITEMS.includes(group.groupVariant)) {
        for (let secretItem of group.secretListItems) {
            if (secretItem._id.toString() === itemId.toString()) {
                return ['secretListItem', secretItem];
            }
        }
    }

    return ['error', null];
}

// TODO change this to throw exceptions
export function findUserInGroup(
    group:
        | TlistGroupAny
        | TlistGroupAnyWithChildren
        | LeanDocument<TlistGroupAny>
        | LeanDocument<TlistGroupAnyWithChildren>,
    userId: Schema.Types.ObjectId | string
): [TgroupMemberTypes | 'error', TgroupMemberAny | null] {
    console.log(userId);
    console.log(group);
    if (group.owner.userId.toString() === userId.toString()) {
        return ['owner', group.owner];
    }

    for (let member of group.members) {
        if (member.userId.toString() === userId.toString()) {
            return ['member', member];
        }
    }

    return ['error', null];
}

export function findUserPermissionsInGroup(
    userId: string,
    group:
        | LeanDocument<TlistGroupAny>
        | LeanDocument<TlistGroupAnyWithChildren>
        | TlistGroupAny
        | TlistGroupAnyWithChildren
): TYPE_PERM_ALL_LIST_GROUP[] {
    let [_, user] = findUserInGroup(group, userId);

    if (!user) {
        throw new Error('User not found in group when checking permissions');
    }
    return user.permissions;
}

export async function findAndCensorChildGroups(
    userId: string,
    group: LeanDocument<TlistGroupAny>
): Promise<LeanDocument<TlistGroupAnyCensoredWithChildren>> {
    let foundChildren = await ListGroupBaseModel.find({ parentGroupId: group._id }).lean();

    let censoredChildren: LeanDocument<TlistGroupAnyCensoredSingular>[] = [];
    for (let i = 0; i < foundChildren.length; i++) {
        censoredChildren.push(censorSingularGroup(userId, foundChildren[i]));
    }
    return { ...group, children: censoredChildren };
}

export function censorSingularGroup(
    userId: string,
    group: LeanDocument<TlistGroupAny> | LeanDocument<TlistGroupAnyWithChildren>
): LeanDocument<TlistGroupAnyCensoredSingular> {
    if (LIST_GROUP_ALL_CENSORABLE.includes(group.groupVariant)) {
        let censoredGroup: LeanDocument<TlistGroupAnyCensoredSingular> = group;
        let permissions = findUserPermissionsInGroup(userId, group);

        if (!permissions.includes(PERM_GROUP_SELECT_LIST_ITEMS)) {
            censoredGroup.listItems = censoredGroup.listItems.map((item) => {
                item.selectedBy = undefined;
                return item;
            });
        }

        if (!permissions.includes(PERM_GROUP_RW_SECRET_LIST_ITEMS)) {
            censoredGroup.secretListItems = undefined;
        }
        return censoredGroup;
    } else if (LIST_GROUP_ALL_NON_CENSORABLE.includes(group.groupVariant)) {
        return group;
    } else {
        console.error('Invalid group variant passed to censorSingularGroup: ', { ...group });
        throw new Error('Server Error');
    }
}

export async function findOneAndUpdateUsingDiscriminator(
    variant: string,
    query: Object,
    update: Object,
    options?: Object
) {
    switch (variant) {
        case BASIC_LIST: {
            return await BasicListModel.findOneAndUpdate(query, update, options);
        }
        case GIFT_LIST: {
            return await GiftListModel.findOneAndUpdate(query, update, options);
        }
        case GIFT_GROUP: {
            return await GiftGroupModel.findOneAndUpdate(query, update, options);
        }
        case GIFT_GROUP_CHILD: {
            return await GiftGroupChildModel.findOneAndUpdate(query, update, options);
        }
        default: {
            console.error('Invalid group variant of ', variant, ' passed to findOneAndUpdateUsingDiscriminator');
            throw new Error('Server Error');
        }
    }
}

import mongoose, { LeanDocument, Schema } from 'mongoose';
import {
    GiftGroupChildModel,
    GIFT_GROUP_CHILD,
} from '../models/listGroups/variants/discriminators/child/GiftGroupChildModel';
import { ListGroupBaseModel } from '../models/listGroups/ListGroupBaseModel';
import { GiftGroupModel, GIFT_GROUP } from '../models/listGroups/variants/discriminators/parent/GiftGroupModel';
import {
    basicListOwnerBasePerms,
    giftGroupChildMemberBasePerms,
    giftGroupChildOwnerBasePerms,
    giftGroupChildParentOwnerBasePerms,
    giftGroupOwnerBasePerms,
    giftListOwnerBasePerms,
    PERM_CHILD_GROUP_CREATE,
    PERM_GROUP_DELETE,
    PERM_GROUP_OWNER,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_LIST_ITEMS,
    TYPE_PERM_ALL_LIST_GROUP,
} from '../models/listGroups/listGroupPermissions';
import {
    LIST_GROUP_ALL_CENSORABLE,
    LIST_GROUP_ALL_NON_CENSORABLE,
    LIST_GROUP_ALL_WITH_MESSAGES,
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
import { MessageBaseModel } from '../models/messages/MessageBaseModel';

export interface IgroupDeletionResult {
    status: number;
    msg: string;
}

export const findAndDeleteGroupAndAnyChildGroupsIfAllowed = async (
    userId: Schema.Types.ObjectId,
    groupId: string
): Promise<IgroupDeletionResult> => {
    const foundGroup = await ListGroupBaseModel.findOne({ _id: groupId });

    if (!foundGroup) {
        return { status: 404, msg: 'Group not found' };
    }

    const foundUser = findUserInGroup(foundGroup, userId);
    if (!foundUser || !foundUser.permissions.includes(PERM_GROUP_DELETE)) {
        return { status: 401, msg: 'Unauthorized' };
    }

    if (LIST_GROUP_ALL_WITH_MESSAGES.includes(foundGroup.groupVariant)) {
        await MessageBaseModel.deleteMany({ groupId: groupId });
    }

    if (!LIST_GROUP_PARENT_VARIANTS.includes(foundGroup.groupVariant)) {
        await ListGroupBaseModel.deleteOne({ _id: groupId });
        return { status: 200, msg: '' };
    } else {
        await GiftGroupModel.deleteOne({ _id: groupId });
        await GiftGroupChildModel.deleteMany({ parentGroupId: groupId });
        return { status: 200, msg: '' };
    }
};

export const deleteGroupAndAnyChildGroups = async (
    group: TlistGroupAny,
    res: Response
): Promise<IgroupDeletionResult> => {
    if (LIST_GROUP_ALL_WITH_MESSAGES.includes(group.groupVariant)) {
        await MessageBaseModel.deleteMany({ groupId: group._id });
    }

    if (!LIST_GROUP_PARENT_VARIANTS.includes(group.groupVariant)) {
        await ListGroupBaseModel.deleteOne({ _id: group._id });
        return { status: 200, msg: '' };
    } else {
        await GiftGroupModel.deleteOne({ _id: group._id });
        await GiftGroupChildModel.deleteMany({ parentGroupId: group._id });
        return { status: 200, msg: '' };
    }
};

const hitMaxListItems = (foundValidGroup: TlistGroupAny) => {
    return foundValidGroup.listItems.length + 1 > foundValidGroup.maxListItems;
};

const hitMaxSecretListItems = (foundValidGroup: TlistGroupAny, userId: mongoose.Schema.Types.ObjectId | string) => {
    let ownedItems = 0;
    foundValidGroup.secretListItems.forEach((item) => {
        if (item.authorId.toString() === userId.toString()) {
            ownedItems += 1;
        }
    });

    return ownedItems + 1 > foundValidGroup.maxSecretListItemsEach;
};

const addListItem = async (
    group: TlistGroupAny,
    userId: mongoose.Schema.Types.ObjectId | string,
    itemType: 'listItems' | 'secretListItems',
    listItemReq: TnewListItemFields,
    res: Response
) => {
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
};

export const handleNewListItemRequest = async (
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    listItemReq: TnewListItemFields,
    res: Response
) => {
    const validGroupVariants = [BASIC_LIST, GIFT_LIST, GIFT_GROUP_CHILD];

    const links = listItemReq.links;
    const body = listItemReq.body;

    if (body.length <= 0) {
        return res.status(400).send('You cannot supply an empty item body');
    }

    for (let i = 0; i < links.length; i++) {
        if (links[i].length <= 0) {
            return res.status(400).send('You cannot supply empty links');
        }
    }

    // TODO figure out why I have to define the key this way. Using groupVariant as the key directly results in a TS error.
    const foundGroup = await ListGroupBaseModel.findOne({ _id: groupId });

    if (!foundGroup) {
        return res.status(404).send('Group not found');
    }

    if (!validGroupVariants.includes(foundGroup.groupVariant)) {
        return res.status(400).send('Invalid group type');
    }

    const foundUser = findUserInGroup(foundGroup, userIdToken);
    if (!foundUser || !foundUser.permissions.includes(PERM_GROUP_RW_LIST_ITEMS)) {
        return res.status(401).send('Unauthorized');
    }

    if (hitMaxListItems(foundGroup)) {
        return res.status(400).send('You have reached the maximum number of list items');
    }

    const result = await addListItem(foundGroup, userIdToken, 'listItems', listItemReq, res);
    return result;
};

export const handleNewSecretListItemRequest = async (
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    secretListItemReq: TnewListItemFields,
    res: Response
) => {
    const validGroupVariants = [GIFT_LIST, GIFT_GROUP_CHILD];

    const body = secretListItemReq.body;

    if (body.length <= 0) {
        return res.status(400).send('You cannot supply an empty item body');
    }

    let links = secretListItemReq.links;
    for (let i = 0; i < links.length; i++) {
        if (links[i].length <= 0) {
            return res.status(400).send('You cannot supply empty links');
        }
    }

    const foundGroup = await ListGroupBaseModel.findOne({ _id: groupId });

    if (!foundGroup) {
        return res.status(404).send('Group not found');
    }

    if (!validGroupVariants.includes(foundGroup.groupVariant)) {
        return res.status(400).send('Invalid group type');
    }

    const foundUser = findUserInGroup(foundGroup, userIdToken);
    if (!foundUser || !foundUser.permissions.includes(PERM_GROUP_RW_SECRET_LIST_ITEMS)) {
        return res.status(401).send('Unauthorized');
    }

    if (hitMaxSecretListItems(foundGroup, userIdToken)) {
        return res.status(400).send('You have reached the maximum number of secret list items');
    }

    let result = await addListItem(foundGroup, userIdToken, 'secretListItems', secretListItemReq, res);
    return result;
};

const getParentAndValidateCanCreateChildren = async (
    parentGroupId: mongoose.Schema.Types.ObjectId,
    userIdToken: mongoose.Schema.Types.ObjectId,
    childGroupVariant: string
) => {
    const foundParentGroup = await ListGroupBaseModel.findOne({
        _id: parentGroupId,
        'members.userId': userIdToken,
        'members.permissions': PERM_CHILD_GROUP_CREATE,
    });

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

    return foundParentGroup;
};

export const addGroup = async (
    tokenUserId: mongoose.Schema.Types.ObjectId,
    tokenDisplayName: string,
    groupVariant: string,
    groupName: string,
    res: Response,
    parentGroupId: mongoose.Schema.Types.ObjectId
) => {
    if (LIST_GROUP_CHILD_VARIANTS.includes(groupVariant)) {
        if (parentGroupId === undefined) {
            return res.status(400).json({ msg: 'Error: Child groups require a parent group' });
        }
    }
    try {
        switch (groupVariant) {
            case BASIC_LIST: {
                const owner: IbasicListMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: basicListOwnerBasePerms,
                };
                const newListGroupData: TnewBasicListFields = { members: [owner], groupName };
                const newListGroup = new BasicListModel(newListGroupData);
                await newListGroup.save();
                return res.status(200).json(newListGroup);
            }
            case GIFT_LIST: {
                const owner: IgiftListMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: giftListOwnerBasePerms,
                };
                const newListGroupData: TnewGiftListFields = { members: [owner], groupName };
                const newListGroup = new GiftListModel(newListGroupData);
                await newListGroup.save();
                return res.status(200).json(newListGroup);
            }
            case GIFT_GROUP: {
                const owner: IgiftGroupMember = {
                    userId: tokenUserId,
                    displayName: tokenDisplayName,
                    permissions: giftGroupOwnerBasePerms,
                };
                const newGroupData: TnewGiftGroupFields = { members: [owner], groupName };
                const newGroup = new GiftGroupModel(newGroupData);
                await newGroup.save();
                return res.status(200).json(newGroup);
            }
            case GIFT_GROUP_CHILD: {
                let foundParentGroup = await getParentAndValidateCanCreateChildren(
                    parentGroupId,
                    tokenUserId,
                    groupVariant
                );

                if (!foundParentGroup) {
                    return res.status(404).send('Parent group not found');
                }

                let members: IgiftGroupChildMember[] = foundParentGroup.members.map((parentMember) => {
                    let childMember: IgiftGroupChildMember = {
                        userId: parentMember.userId,
                        displayName: parentMember.displayName,
                        permissions: [],
                        oldestReadMessage: undefined,
                    };
                    if (parentMember.userId === tokenUserId) {
                        childMember.permissions = giftGroupChildOwnerBasePerms;
                    } else if (parentMember.permissions.includes(PERM_GROUP_OWNER)) {
                        childMember.permissions = giftGroupChildParentOwnerBasePerms;
                    } else {
                        childMember.permissions = giftGroupChildMemberBasePerms;
                    }
                    return { ...childMember };
                });

                const newListGroupData: TnewGiftGroupChildFields = { members: members, groupName, parentGroupId };
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
};

export const findItemsInGroup = (group: TlistGroupAny, itemIdArray: Schema.Types.ObjectId[] | string[]): any[] => {
    let foundItems = [];
    for (let itemId of itemIdArray) {
        let found = false;
        for (let item of group.listItems) {
            if (item._id.toString() === itemId.toString()) {
                foundItems.push(item);
                found = true;
                break;
            }
        }

        if (LIST_GROUP_ALL_WITH_SECRET_ITEMS.includes(group.groupVariant) && !found) {
            for (let secretItem of group.secretListItems) {
                if (secretItem._id.toString() === itemId.toString()) {
                    foundItems.push(secretItem);
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            return [];
        }
    }

    return [foundItems];
};

export const findItemInGroup = (
    group: TlistGroupAny,
    itemId: Schema.Types.ObjectId | string
): [TitemTypes | 'error', TgiftListItem | null] => {
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
};

// TODO change this to throw exceptions
export const findUserInGroup = (
    group:
        | TlistGroupAny
        | TlistGroupAnyWithChildren
        | LeanDocument<TlistGroupAny>
        | LeanDocument<TlistGroupAnyWithChildren>,
    userId: Schema.Types.ObjectId | string
): TgroupMemberAny | null => {
    for (let member of group.members) {
        if (member.userId.toString() === userId.toString()) {
            return member;
        }
    }

    return null;
};

export const findUserPermissionsInGroup = (
    userId: string,
    group:
        | LeanDocument<TlistGroupAny>
        | LeanDocument<TlistGroupAnyWithChildren>
        | TlistGroupAny
        | TlistGroupAnyWithChildren
): TYPE_PERM_ALL_LIST_GROUP[] => {
    let user = findUserInGroup(group, userId);

    if (!user) {
        throw new Error('User not found in group when checking permissions');
    }
    return user.permissions;
};

export const findAndCensorChildGroups = async (
    userId: string,
    group: LeanDocument<TlistGroupAny>
): Promise<LeanDocument<TlistGroupAnyCensoredWithChildren>> => {
    let foundChildren = await ListGroupBaseModel.find({ parentGroupId: group._id }).lean();

    let censoredChildren: LeanDocument<TlistGroupAnyCensoredSingular>[] = [];
    for (let i = 0; i < foundChildren.length; i++) {
        censoredChildren.push(censorSingularGroup(userId, foundChildren[i]));
    }
    return { ...group, children: censoredChildren };
};

export const censorSingularGroup = (
    userId: string,
    group: LeanDocument<TlistGroupAny> | LeanDocument<TlistGroupAnyWithChildren>
): LeanDocument<TlistGroupAnyCensoredSingular> => {
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
};

export const findOneAndUpdateUsingDiscriminator = async (
    variant: typeof BASIC_LIST | typeof GIFT_LIST | typeof GIFT_GROUP | typeof GIFT_GROUP_CHILD,
    query: Object,
    update: Object,
    options?: Object
) => {
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
};

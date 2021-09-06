import mongoose, { Schema } from 'mongoose';
import { GiftGroupChildModel } from '../models/listGroups/variants/discriminators/child/GiftGroupChildModel';
import { ListGroupBaseModel } from '../models/listGroups/ListGroupBaseModel';
import { GiftGroupModel } from '../models/listGroups/variants/discriminators/parent/GiftGroupModel';
import {
    basicListOwnerBasePerms,
    giftGroupChildMemberBasePerms,
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
    BASIC_LIST,
    GIFT_GROUP,
    GIFT_GROUP_CHILD,
    GIFT_LIST,
    LIST_GROUP_ALL_NON_CENSORABLE,
    LIST_GROUP_ALL_WITH_MESSAGES,
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
    TlistGroupAnyDocument,
    TnewBasicListFields,
    TnewGiftGroupChildFields,
    TnewGiftGroupFields,
    TnewGiftListFields,
    TlistGroupAnyWithRegularItemsFields,
    TlistGroupAnyWithSecretItemsFields,
    groupVariantHasSecretItems,
    TlistGroupAnyNonParentFields,
    groupVariantNeedsCensoring,
    TlistGroupAnyFieldsCensored,
    TlistGroupAnyParentFields,
    groupVariantIsAParent,
    TgiftGroupWithChildrenFields,
    TlistGroupAnyFields,
    groupVariantHasRegularItems,
} from '../models/listGroups/listGroupInterfaces';
import { TitemTypes, IgiftListItem, InewListItemFields } from '../models/listGroups/listItemInterfaces';
import { BasicListModel } from '../models/listGroups/variants/discriminators/singular/BasicListModel';
import { GiftListModel } from '../models/listGroups/variants/discriminators/singular/GiftListModel';
import { Response } from 'express';
import { MessageBaseModel } from '../models/messages/MessageBaseModel';
import { SystemMessageModel } from '../models/messages/variants/discriminators/SystemMessageModel';
import { TnewSystemMessageFields } from '../models/messages/messageInterfaces';
import { ValidationError } from 'express-validator';

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
    group: TlistGroupAnyDocument,
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

const hitMaxListItems = (foundValidGroup: TlistGroupAnyWithRegularItemsFields) => {
    return foundValidGroup.listItems.length + 1 > foundValidGroup.maxListItems;
};

const hitMaxSecretListItems = (
    foundValidGroup: TlistGroupAnyWithSecretItemsFields,
    userId: mongoose.Schema.Types.ObjectId | string
) => {
    let ownedItems = 0;
    foundValidGroup.secretListItems.forEach((item) => {
        if (item.authorId.toString() === userId.toString()) {
            ownedItems += 1;
        }
    });

    return ownedItems + 1 > foundValidGroup.maxSecretListItemsEach;
};

const addListItem = async (
    group: TlistGroupAnyDocument,
    userId: mongoose.Schema.Types.ObjectId | string,
    itemType: 'listItems' | 'secretListItems',
    body: string,
    links: string[],
    res: Response
) => {
    const newListItem: InewListItemFields = {
        authorId: userId,
        body: body,
        links: links,
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
    body: string,
    links: string[],
    res: Response
) => {
    const foundGroup = await ListGroupBaseModel.findOne({ _id: groupId });

    if (!foundGroup) {
        return res.status(404).send('Error: Group not found');
    }

    if (!groupVariantHasRegularItems(foundGroup)) {
        return res.status(400).send('Error: Invalid group type');
    }

    const foundUser = findUserInGroup(foundGroup, userIdToken);
    if (!foundUser || !foundUser.permissions.includes(PERM_GROUP_RW_LIST_ITEMS)) {
        return res.status(401).send('Error: Unauthorized');
    }

    if (hitMaxListItems(foundGroup)) {
        return res.status(400).send('Error: You have reached the maximum number of list items');
    }

    const result = await addListItem(foundGroup, userIdToken, 'listItems', body, links, res);
    return result;
};

export const handleNewSecretListItemRequest = async (
    userIdToken: mongoose.Schema.Types.ObjectId | string,
    groupId: mongoose.Schema.Types.ObjectId | string,
    body: string,
    links: string[],
    res: Response
) => {
    const foundGroup = await ListGroupBaseModel.findOne({ _id: groupId });

    if (!foundGroup) {
        return res.status(404).send('Error: Group not found');
    }

    if (!groupVariantHasSecretItems(foundGroup)) {
        return res.status(400).send('Error: Invalid group type');
    }

    const foundUser = findUserInGroup(foundGroup, userIdToken);
    if (!foundUser || !foundUser.permissions.includes(PERM_GROUP_RW_SECRET_LIST_ITEMS)) {
        return res.status(401).send('Error: Unauthorized');
    }

    if (hitMaxSecretListItems(foundGroup, userIdToken)) {
        return res.status(400).send('Error: You have reached the maximum number of secret list items');
    }

    let result = await addListItem(foundGroup, userIdToken, 'secretListItems', body, links, res);
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
            return res.status(400).send('Error: Child groups require a parent group');
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

                const newMessageFields: TnewSystemMessageFields = {
                    groupId: newListGroup._id,
                    body: `${tokenDisplayName} created the list`,
                };
                const newMessage = new SystemMessageModel(newMessageFields);
                await newMessage.save();

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
                    return res.status(404).send('Error: Parent group not found');
                }

                let members: IgiftGroupChildMember[] = foundParentGroup.members.map((parentMember) => {
                    let childMember: IgiftGroupChildMember = {
                        userId: parentMember.userId,
                        displayName: parentMember.displayName,
                        permissions: [],
                        oldestReadMessage: undefined,
                    };
                    if (parentMember.userId.toString() === tokenUserId.toString()) {
                        childMember.permissions = giftGroupChildOwnerBasePerms;
                    } else {
                        childMember.permissions = giftGroupChildMemberBasePerms;
                    }
                    return { ...childMember };
                });

                const newListGroupData: TnewGiftGroupChildFields = { members: members, groupName, parentGroupId };
                const newListGroup = new GiftGroupChildModel(newListGroupData);
                await newListGroup.save();

                const newMessageFields: TnewSystemMessageFields = {
                    groupId: newListGroup._id,
                    body: `${tokenDisplayName} created the list`,
                };

                const newMessage = new SystemMessageModel(newMessageFields);
                await newMessage.save();

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

export const findItemsInGroup = (
    group: TlistGroupAnyWithRegularItemsFields | TlistGroupAnyWithSecretItemsFields,
    itemIdArray: Schema.Types.ObjectId[] | string[]
): any[] => {
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

        if (groupVariantHasSecretItems(group) && !found) {
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

    return foundItems;
};

export const findItemInGroup = (
    group: TlistGroupAnyWithRegularItemsFields | TlistGroupAnyWithSecretItemsFields,
    itemId: Schema.Types.ObjectId | string
): [TitemTypes | 'error', IgiftListItem | null] => {
    for (let item of group.listItems) {
        if (item._id.toString() === itemId.toString()) {
            return ['listItem', item];
        }
    }
    if (groupVariantHasSecretItems(group)) {
        for (let secretItem of group.secretListItems) {
            if (secretItem._id.toString() === itemId.toString()) {
                return ['secretListItem', secretItem];
            }
        }
    }

    return ['error', null];
};

export const findUserInGroup = (
    group: TlistGroupAnyFields,
    userId: Schema.Types.ObjectId | string
): TgroupMemberAny | null => {
    for (let member of group.members) {
        if (member.userId.toString() === userId.toString()) {
            return member;
        }
    }

    return null;
};

export const findUserPermissionsInGroup = (userId: string, group: TlistGroupAnyFields): TYPE_PERM_ALL_LIST_GROUP[] => {
    let user = findUserInGroup(group, userId);

    if (!user) {
        throw new Error('User not found in group when checking permissions');
    }
    return user.permissions;
};

export const findAndAddCensoredChildGroups = async (
    userId: string,
    group: TlistGroupAnyParentFields
): Promise<TgiftGroupWithChildrenFields> => {
    let foundChildren = await ListGroupBaseModel.find({ parentGroupId: group._id }).lean();
    let censoredChildren: TlistGroupAnyFieldsCensored[] = [];

    for (let i = 0; i < foundChildren.length; i++) {
        const group = foundChildren[i];
        if (!groupVariantIsAParent(group)) {
            censoredChildren.push(censorSingularGroup(userId, group));
        }
    }

    return { ...group, children: censoredChildren };
};

export const censorSingularGroup = (
    userId: string,
    group: TlistGroupAnyNonParentFields
): TlistGroupAnyFieldsCensored => {
    if (groupVariantNeedsCensoring(group)) {
        let censoredGroup: TlistGroupAnyFieldsCensored = { ...group };
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
): Promise<TlistGroupAnyFields> => {
    switch (variant) {
        case BASIC_LIST: {
            return await BasicListModel.findOneAndUpdate(query, update, options).lean();
        }
        case GIFT_LIST: {
            return await GiftListModel.findOneAndUpdate(query, update, options).lean();
        }
        case GIFT_GROUP: {
            return await GiftGroupModel.findOneAndUpdate(query, update, options).lean();
        }
        case GIFT_GROUP_CHILD: {
            return await GiftGroupChildModel.findOneAndUpdate(query, update, options).lean();
        }
        default: {
            console.error('Invalid group variant of ', variant, ' passed to findOneAndUpdateUsingDiscriminator');
            throw new Error('Server Error');
        }
    }
};

export const formatValidatorErrArrayAsMsgString = (errorArray: ValidationError[]) => {
    let errString: string = '';

    for (let i = 0; i < errorArray.length; i++) {
        errString = errString + ' ' + errorArray[i].msg;
    }

    return errString;
};

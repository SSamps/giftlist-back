"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserInGroup = exports.findItemInGroup = exports.addGroup = exports.handleNewSecretListItemRequest = exports.handleNewListItemRequest = exports.deleteGroupAndAnyChildGroups = void 0;
const GiftGroupChildModel_1 = require("../models/listGroups/variants/discriminators/child/GiftGroupChildModel");
const ListGroupBaseModel_1 = require("../models/listGroups/ListGroupBaseModel");
const GiftGroupModel_1 = require("../models/listGroups/variants/discriminators/parent/GiftGroupModel");
const listGroupPermissions_1 = require("../models/listGroups/listGroupPermissions");
const listGroupVariants_1 = require("../models/listGroups/variants/listGroupVariants");
const listGroupInterfaces_1 = require("../models/listGroups/listGroupInterfaces");
const BasicListModel_1 = require("../models/listGroups/variants/discriminators/singular/BasicListModel");
const GiftListModel_1 = require("../models/listGroups/variants/discriminators/singular/GiftListModel");
function deleteGroupAndAnyChildGroups(userId, groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        var foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne().and([
            { _id: groupId },
            {
                $or: [
                    { 'owner.userId': userId, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_DELETE },
                    { 'members.userId': userId, 'members.permissions': listGroupPermissions_1.PERM_GROUP_DELETE },
                ],
            },
        ]);
        if (!foundGroup) {
            return { status: 400, msg: 'Invalid groupId or unauthorized' };
        }
        // TODO Delete all associated list items and messages
        if (!listGroupVariants_1.LIST_GROUP_PARENT_VARIANTS.includes(foundGroup.groupVariant)) {
            yield ListGroupBaseModel_1.ListGroupBaseModel.deleteOne({ _id: groupId });
            return { status: 200, msg: 'Group deleted' };
        }
        else {
            yield GiftGroupModel_1.GiftGroupModel.deleteOne({ _id: groupId });
            yield GiftGroupChildModel_1.GiftGroupChildModel.deleteMany({ parentGroupId: groupId });
            return { status: 200, msg: 'Parent group and all child groups deleted' };
        }
    });
}
exports.deleteGroupAndAnyChildGroups = deleteGroupAndAnyChildGroups;
function hitMaxListItems(foundValidGroup) {
    return foundValidGroup.listItems.length + 1 > foundValidGroup.maxListItems;
}
function hitMaxSecretListItems(foundValidGroup, userId) {
    let ownedItems = 0;
    foundValidGroup.secretListItems.forEach((item) => {
        if (item.authorId.toString() === userId.toString()) {
            ownedItems += 1;
        }
    });
    return ownedItems + 1 > foundValidGroup.maxSecretListItemsEach;
}
function addListItem(group, userId, listItemReq, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newListItem = {
            authorId: userId,
            body: listItemReq.body,
            link: listItemReq.link,
        };
        yield group.update({ $push: { listItems: newListItem } });
        return res.status(200).send();
    });
}
function addSecretListItem(group, userId, listItemReq, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newSecretListItem = {
            authorId: userId,
            body: listItemReq.body,
            link: listItemReq.link,
        };
        yield group.update({ $push: { secretListItems: newSecretListItem } });
        return res.status(200).send();
    });
}
function handleNewListItemRequest(userIdToken, groupId, listItemReq, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (listItemReq.body === undefined) {
            return res.status(400).send('You must include an item body');
        }
        let permission = listGroupPermissions_1.PERM_GROUP_RW_LIST_ITEMS;
        let validGroupVariants = [BasicListModel_1.BASIC_LIST, GiftListModel_1.GIFT_LIST, GiftGroupChildModel_1.GIFT_GROUP_CHILD];
        let foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
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
        const result = yield addListItem(foundGroup, userIdToken, listItemReq, res);
        return result;
    });
}
exports.handleNewListItemRequest = handleNewListItemRequest;
function handleNewSecretListItemRequest(userIdToken, groupId, secretListItemReq, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (secretListItemReq.body === undefined) {
            return res.status(400).send('You must include an item body');
        }
        let permission = listGroupPermissions_1.PERM_GROUP_RW_SECRET_LIST_ITEMS;
        let validGroupVariants = [GiftListModel_1.GIFT_LIST, GiftGroupChildModel_1.GIFT_GROUP_CHILD];
        let foundValidGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
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
            res.status(400).send('You have reached the maximum number of secret list items');
        }
        let result = yield addSecretListItem(foundValidGroup, userIdToken, secretListItemReq, res);
        return result;
    });
}
exports.handleNewSecretListItemRequest = handleNewSecretListItemRequest;
function validateParentGroup(parentGroupId, userIdToken, childGroupVariant) {
    return __awaiter(this, void 0, void 0, function* () {
        const foundParentGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne().and([
            { _id: parentGroupId },
            {
                $or: [
                    { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_CHILD_GROUP_CREATE },
                    { 'members.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_CHILD_GROUP_CREATE },
                ],
            },
        ]);
        if (!foundParentGroup) {
            throw new listGroupInterfaces_1.invalidParentError(parentGroupId.toString());
        }
        const parentVariant = foundParentGroup.groupVariant;
        switch (childGroupVariant) {
            case GiftGroupChildModel_1.GIFT_GROUP_CHILD: {
                if (parentVariant !== GiftGroupModel_1.GIFT_GROUP) {
                    throw new listGroupInterfaces_1.invalidParentVariantError(childGroupVariant, parentVariant);
                }
                break;
            }
            default:
                throw new listGroupInterfaces_1.invalidGroupVariantError(childGroupVariant);
        }
    });
}
function addGroup(userIdToken, groupVariant, groupName, res, parentGroupId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(parentGroupId);
        if (listGroupVariants_1.LIST_GROUP_CHILD_VARIANTS.includes(groupVariant)) {
            if (parentGroupId === undefined) {
                return res.status(400).json({ msg: 'Error: Child groups require a parent group' });
            }
        }
        try {
            switch (groupVariant) {
                case BasicListModel_1.BASIC_LIST: {
                    const owner = {
                        userId: userIdToken,
                        permissions: listGroupPermissions_1.basicListOwnerBasePerms,
                    };
                    const newListGroupData = { owner, groupName };
                    const newListGroup = new BasicListModel_1.BasicListModel(newListGroupData);
                    yield newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                case GiftListModel_1.GIFT_LIST: {
                    const owner = {
                        userId: userIdToken,
                        permissions: listGroupPermissions_1.giftListOwnerBasePerms,
                    };
                    const newListGroupData = { owner, groupName };
                    const newListGroup = new GiftListModel_1.GiftListModel(newListGroupData);
                    yield newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                case GiftGroupModel_1.GIFT_GROUP: {
                    const owner = {
                        userId: userIdToken,
                        permissions: listGroupPermissions_1.giftGroupOwnerBasePerms,
                    };
                    const newGroupData = { owner, groupName };
                    const newGroup = new GiftGroupModel_1.GiftGroupModel(newGroupData);
                    yield newGroup.save();
                    return res.status(200).json(newGroup);
                }
                case GiftGroupChildModel_1.GIFT_GROUP_CHILD: {
                    yield validateParentGroup(parentGroupId, userIdToken, groupVariant);
                    const owner = {
                        userId: userIdToken,
                        permissions: listGroupPermissions_1.giftGroupChildOwnerBasePerms,
                    };
                    const newListGroupData = { owner, groupName, parentGroupId };
                    const newListGroup = new GiftGroupChildModel_1.GiftGroupChildModel(newListGroupData);
                    yield newListGroup.save();
                    return res.status(200).json(newListGroup);
                }
                default:
                    throw new listGroupInterfaces_1.invalidGroupVariantError(groupVariant);
            }
        }
        catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    });
}
exports.addGroup = addGroup;
function findItemInGroup(group, itemId) {
    for (let item of group.listItems) {
        if (item._id.toString() === itemId.toString()) {
            return ['listItem', item];
        }
    }
    for (let secretItem of group.secretListItems) {
        if (secretItem._id.toString() === itemId.toString()) {
            return ['secretListItem', secretItem];
        }
    }
    return ['error', null];
}
exports.findItemInGroup = findItemInGroup;
function findUserInGroup(group, userId) {
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
exports.findUserInGroup = findUserInGroup;

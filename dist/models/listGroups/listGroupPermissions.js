"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.giftListOwnerBasePerms = exports.giftListMemberBasePerms = exports.PERM_GIFT_LIST_ALL = exports.basicListOwnerBasePerms = exports.basicListMemberBasePerms = exports.PERM_BASIC_LIST_ALL = exports.giftGroupOwnerBasePerms = exports.giftGroupMemberBasePerms = exports.PERM_GIFT_GROUP_ALL = exports.giftGroupChildOwnerBasePerms = exports.giftGroupChildMemberBasePerms = exports.PERM_GIFT_GROUP_CHILD_ALL = exports.PERM_ALL_LIST_GROUP = exports.PERM_MUTABLE_ALL = exports.PERM_MODIFIERS_ALL = exports.PERM_MODIFIER_REMOVE = exports.PERM_MODIFIER_ADD = exports.PERM_GROUP_RW_MESSAGES = exports.PERM_GROUP_SELECT_SECRET_LIST_ITEMS = exports.PERM_GROUP_RW_SECRET_LIST_ITEMS = exports.PERM_GROUP_SELECT_LIST_ITEMS = exports.PERM_GROUP_R_LIST_ITEMS = exports.PERM_GROUP_RW_LIST_ITEMS = exports.PERM_GROUP_ADMIN = exports.PERM_GROUP_INVITE = exports.PERM_GROUP_DELETE = exports.PERM_CHILD_GROUP_CREATE = void 0;
// Groups
exports.PERM_CHILD_GROUP_CREATE = 'CHILD_GROUP_CREATE'; // Allowed to create child groups in this parent group
exports.PERM_GROUP_DELETE = 'GROUP_DELETE'; // Allowed to delete the group
exports.PERM_GROUP_INVITE = 'GROUP_INVITE'; // Allowed to invite others to the group
exports.PERM_GROUP_ADMIN = 'GROUP_ADMIN'; // Allowed to kick members from the group and manage permissions (just invite for now) of other users in the group
// List Items
exports.PERM_GROUP_RW_LIST_ITEMS = 'GROUP_RW_LIST_ITEMS'; // Allowed to see, add and remove regular list items
exports.PERM_GROUP_R_LIST_ITEMS = 'GROUP_R_LIST_ITEMS'; // Allowed to see regular list items
exports.PERM_GROUP_SELECT_LIST_ITEMS = 'GROUP_SELECT_LIST_ITEMS'; // Allowed to select and unselect list items and see when others do so.
// Secret List Items
exports.PERM_GROUP_RW_SECRET_LIST_ITEMS = 'GROUP_RW_SECRET_LIST_ITEMS'; // Allowed to see, add and remove secret list items
exports.PERM_GROUP_SELECT_SECRET_LIST_ITEMS = 'GROUP_SELECT_SECRET_LIST_ITEMS'; // Allowed to select and unselect list items and see when others do so.
// Messages
exports.PERM_GROUP_RW_MESSAGES = 'GROUP_RW_MESSAGES'; // Allowed to read an write messages in the group
// Permission Modifiers
exports.PERM_MODIFIER_ADD = 'PERM_MODIFIER_ADD';
exports.PERM_MODIFIER_REMOVE = 'PERM_MODIFIER_REMOVE';
exports.PERM_MODIFIERS_ALL = [exports.PERM_MODIFIER_ADD, exports.PERM_MODIFIER_REMOVE];
// Permissions that can be modified by users
exports.PERM_MUTABLE_ALL = [exports.PERM_GROUP_INVITE];
// All group permissions
exports.PERM_ALL_LIST_GROUP = [
    exports.PERM_CHILD_GROUP_CREATE,
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_INVITE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_RW_MESSAGES,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_RW_LIST_ITEMS,
    exports.PERM_GROUP_R_LIST_ITEMS,
    exports.PERM_GROUP_RW_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
];
// Child group permissions
// GIFT_GROUP_CHILD
exports.PERM_GIFT_GROUP_CHILD_ALL = [
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_INVITE,
    exports.PERM_GROUP_RW_LIST_ITEMS,
    exports.PERM_GROUP_RW_MESSAGES,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_R_LIST_ITEMS,
    exports.PERM_GROUP_RW_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
];
exports.giftGroupChildMemberBasePerms = [
    exports.PERM_GROUP_R_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_RW_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_RW_MESSAGES,
];
exports.giftGroupChildOwnerBasePerms = [
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_RW_LIST_ITEMS,
];
// Parent group permissions
// GIFT_GROUP
exports.PERM_GIFT_GROUP_ALL = [exports.PERM_CHILD_GROUP_CREATE, exports.PERM_GROUP_DELETE, exports.PERM_GROUP_INVITE, exports.PERM_GROUP_ADMIN];
exports.giftGroupMemberBasePerms = [exports.PERM_CHILD_GROUP_CREATE];
exports.giftGroupOwnerBasePerms = [
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_INVITE,
    exports.PERM_CHILD_GROUP_CREATE,
];
// Single group permissions
// BASIC_LIST
exports.PERM_BASIC_LIST_ALL = [
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_INVITE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_RW_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_RW_MESSAGES,
];
exports.basicListMemberBasePerms = [
    exports.PERM_GROUP_RW_MESSAGES,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_RW_LIST_ITEMS,
];
exports.basicListOwnerBasePerms = [
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_INVITE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_RW_MESSAGES,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_RW_LIST_ITEMS,
];
// GIFT_LIST
exports.PERM_GIFT_LIST_ALL = [
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_INVITE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_RW_LIST_ITEMS,
    exports.PERM_GROUP_R_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_RW_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_RW_MESSAGES,
];
exports.giftListMemberBasePerms = [
    exports.PERM_GROUP_R_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_LIST_ITEMS,
    exports.PERM_GROUP_RW_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
    exports.PERM_GROUP_RW_MESSAGES,
];
exports.giftListOwnerBasePerms = [
    exports.PERM_GROUP_DELETE,
    exports.PERM_GROUP_ADMIN,
    exports.PERM_GROUP_INVITE,
    exports.PERM_GROUP_RW_LIST_ITEMS,
];

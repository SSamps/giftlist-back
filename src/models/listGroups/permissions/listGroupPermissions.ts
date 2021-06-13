// Groups
export const PERM_CHILD_GROUP_CREATE = 'CHILD_GROUP_CREATE'; // Allowed to create child groups in this parent group
export const PERM_GROUP_DELETE = 'GROUP_DELETE'; // Allowed to delete the group
export const PERM_GROUP_INVITE = 'GROUP_INVITE'; // Allowed to invite others to the group
export const PERM_GROUP_ADMIN = 'GROUP_ADMIN'; // Allowed to kick members from the group and manage permissions (just invite for now) of other users in the group

// List Items
export const PERM_GROUP_RW_LIST_ITEMS = 'GROUP_RW_LIST_ITEMS'; // Allowed to see, add and remove regular list items
export const PERM_GROUP_R_LIST_ITEMS = 'GROUP_R_LIST_ITEMS'; // Allowed to see regular list items
export const PERM_GROUP_SELECT_LIST_ITEMS = 'GROUP_SELECT_LIST_ITEMS'; // Allowed to select and unselect list items and see when others do so.

// Secret List Items
export const PERM_GROUP_RW_SECRET_LIST_ITEMS = 'GROUP_RW_SECRET_LIST_ITEMS'; // Allowed to see, add and remove secret list items
export const PERM_GROUP_SELECT_SECRET_LIST_ITEMS = 'GROUP_SELECT_SECRET_LIST_ITEMS'; // Allowed to select and unselect list items and see when others do so.

// Messages
export const PERM_GROUP_RW_MESSAGES = 'GROUP_RW_MESSAGES'; // Allowed to read an write messages in the group

// Permission Modifiers
export const PERM_MODIFIER_ADD = 'PERM_MODIFIER_ADD';
export const PERM_MODIFIER_REMOVE = 'PERM_MODIFIER_REMOVE';
export const PERM_MODIFIERS_ALL = [PERM_MODIFIER_ADD, PERM_MODIFIER_REMOVE];

// Permissions that can be modified by users
export const PERM_MUTABLE_ALL = [PERM_GROUP_INVITE];

// All group permissions

export const PERM_ALL_LIST_GROUP = [
    PERM_CHILD_GROUP_CREATE,
    PERM_GROUP_DELETE,
    PERM_GROUP_INVITE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_RW_MESSAGES,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_R_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
];

export type TYPE_PERM_ALL_LIST_GROUP =
    | typeof PERM_CHILD_GROUP_CREATE
    | typeof PERM_GROUP_DELETE
    | typeof PERM_GROUP_INVITE
    | typeof PERM_GROUP_ADMIN
    | typeof PERM_GROUP_RW_MESSAGES
    | typeof PERM_GROUP_SELECT_LIST_ITEMS
    | typeof PERM_GROUP_RW_LIST_ITEMS
    | typeof PERM_GROUP_R_LIST_ITEMS
    | typeof PERM_GROUP_RW_SECRET_LIST_ITEMS
    | typeof PERM_GROUP_SELECT_SECRET_LIST_ITEMS;

// Child group permissions

// GIFT_GROUP_CHILD

export const PERM_GIFT_GROUP_CHILD_ALL = [
    PERM_GROUP_DELETE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_INVITE,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_RW_MESSAGES,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_R_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
];
export type TYPE_PERM_GIFT_GROUP_CHILD_ALL =
    | typeof PERM_GROUP_DELETE
    | typeof PERM_GROUP_ADMIN
    | typeof PERM_GROUP_RW_MESSAGES
    | typeof PERM_GROUP_SELECT_LIST_ITEMS
    | typeof PERM_GROUP_RW_LIST_ITEMS
    | typeof PERM_GROUP_R_LIST_ITEMS
    | typeof PERM_GROUP_RW_SECRET_LIST_ITEMS
    | typeof PERM_GROUP_SELECT_SECRET_LIST_ITEMS;

export const giftGroupChildMemberBasePerms: TYPE_PERM_GIFT_GROUP_CHILD_ALL[] = [
    PERM_GROUP_R_LIST_ITEMS,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
    PERM_GROUP_RW_MESSAGES,
];

export const giftGroupChildOwnerBasePerms: TYPE_PERM_GIFT_GROUP_CHILD_ALL[] = [
    PERM_GROUP_DELETE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_RW_LIST_ITEMS,
];

// Parent group permissions

// GIFT_GROUP

export const PERM_GIFT_GROUP_ALL = [PERM_CHILD_GROUP_CREATE, PERM_GROUP_DELETE, PERM_GROUP_INVITE, PERM_GROUP_ADMIN];
export type TYPE_PERM_GIFT_GROUP_ALL =
    | typeof PERM_CHILD_GROUP_CREATE
    | typeof PERM_GROUP_DELETE
    | typeof PERM_GROUP_INVITE
    | typeof PERM_GROUP_ADMIN;

export const giftGroupMemberBasePerms: TYPE_PERM_GIFT_GROUP_ALL[] = [PERM_CHILD_GROUP_CREATE];

export const giftGroupOwnerBasePerms: TYPE_PERM_GIFT_GROUP_ALL[] = [
    PERM_GROUP_DELETE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_INVITE,
    PERM_CHILD_GROUP_CREATE,
];

// Single group permissions

// BASIC_LIST

export const PERM_BASIC_LIST_ALL = [
    PERM_GROUP_DELETE,
    PERM_GROUP_INVITE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_RW_MESSAGES,
];
export type TYPE_PERM_BASIC_LIST_ALL =
    | typeof PERM_GROUP_DELETE
    | typeof PERM_GROUP_INVITE
    | typeof PERM_GROUP_ADMIN
    | typeof PERM_GROUP_RW_MESSAGES
    | typeof PERM_GROUP_SELECT_LIST_ITEMS
    | typeof PERM_GROUP_RW_LIST_ITEMS;

export const basicListMemberBasePerms: TYPE_PERM_BASIC_LIST_ALL[] = [
    PERM_GROUP_RW_MESSAGES,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_RW_LIST_ITEMS,
];

export const basicListOwnerBasePerms: TYPE_PERM_BASIC_LIST_ALL[] = [
    PERM_GROUP_DELETE,
    PERM_GROUP_INVITE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_RW_MESSAGES,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_RW_LIST_ITEMS,
];

// GIFT_LIST

export const PERM_GIFT_LIST_ALL = [
    PERM_GROUP_DELETE,
    PERM_GROUP_INVITE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_R_LIST_ITEMS,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
    PERM_GROUP_RW_MESSAGES,
];
export type TYPE_PERM_GIFT_LIST_ALL =
    | typeof PERM_GROUP_DELETE
    | typeof PERM_GROUP_INVITE
    | typeof PERM_GROUP_ADMIN
    | typeof PERM_GROUP_RW_LIST_ITEMS
    | typeof PERM_GROUP_R_LIST_ITEMS
    | typeof PERM_GROUP_SELECT_LIST_ITEMS
    | typeof PERM_GROUP_RW_SECRET_LIST_ITEMS
    | typeof PERM_GROUP_SELECT_SECRET_LIST_ITEMS
    | typeof PERM_GROUP_RW_MESSAGES;

export const giftListMemberBasePerms: TYPE_PERM_GIFT_LIST_ALL[] = [
    PERM_GROUP_R_LIST_ITEMS,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
    PERM_GROUP_RW_MESSAGES,
];

export const giftListOwnerBasePerms: TYPE_PERM_GIFT_LIST_ALL[] = [
    PERM_GROUP_DELETE,
    PERM_GROUP_ADMIN,
    PERM_GROUP_INVITE,
    PERM_GROUP_RW_LIST_ITEMS,
];

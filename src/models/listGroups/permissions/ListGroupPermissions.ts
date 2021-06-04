export const PERM_CHILD_GROUP_CREATE = 'CHILD_GROUP_CREATE'; // Allowed to create child groups in this parent group
export const PERM_GROUP_DELETE = 'GROUP_DELETE'; // Allowed to delete the group
export const PERM_GROUP_INVITE = 'GROUP_INVITE'; // Allowed to invite others to the group
export const PERM_GROUP_ADMIN = 'GROUP_ADMIN'; // Allowed to kick members from the group
export const PERM_GROUP_RW_MESSAGES = 'GROUP_ADMIN'; // Allowed to read an write messages in the group
export const PERM_GROUP_RW_LIST_EVENTS = 'GROUP_ADMIN'; // Allowed to select and unselect list items and see when others do so.
export const PERM_GROUP_MANAGE_LIST_ITEMS = 'GROUP_ADMIN'; // Allowed to add and remove regular list items
export const PERM_GROUP_SEE_LIST_ITEMS = 'GROUP_ADMIN'; // Allowed to see regular list items
export const PERM_GROUP_RW_SECRET_LIST_ITEMS = 'GROUP_ADMIN'; // Allowed to see, add and remove secret list items

// All Group Permissions

export const PERM_ALL_LIST_GROUP = [PERM_CHILD_GROUP_CREATE, PERM_GROUP_DELETE, PERM_GROUP_INVITE, PERM_GROUP_ADMIN];

export type TYPE_PERM_ALL_LIST_GROUP =
    | typeof PERM_CHILD_GROUP_CREATE
    | typeof PERM_GROUP_DELETE
    | typeof PERM_GROUP_INVITE
    | typeof PERM_GROUP_ADMIN;

// Child Group permissions

export const PERM_LIST_GROUP_CHILD = [PERM_GROUP_DELETE, PERM_GROUP_INVITE, PERM_GROUP_ADMIN];
export type TYPE_PERM_LIST_GROUP_CHILD = typeof PERM_GROUP_DELETE | typeof PERM_GROUP_INVITE | typeof PERM_GROUP_ADMIN;

// Parent Group permissions

export const PERM_LIST_GROUP_PARENT = [PERM_CHILD_GROUP_CREATE, PERM_GROUP_DELETE, PERM_GROUP_INVITE, PERM_GROUP_ADMIN];
export type TYPE_PERM_LIST_GROUP_PARENT =
    | typeof PERM_GROUP_DELETE
    | typeof PERM_GROUP_INVITE
    | typeof PERM_GROUP_ADMIN
    | typeof PERM_CHILD_GROUP_CREATE;

// Single Group permissions

export const PERM_LIST_GROUP_SINGLE = [PERM_GROUP_DELETE, PERM_GROUP_INVITE, PERM_GROUP_ADMIN];
export type TYPE_PERM_LIST_GROUP_SINGLE = typeof PERM_GROUP_DELETE | typeof PERM_GROUP_INVITE | typeof PERM_GROUP_ADMIN;

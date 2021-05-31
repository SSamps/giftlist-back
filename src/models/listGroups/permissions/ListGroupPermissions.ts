export const PERM_CHILD_GROUP_CREATE = 'CHILD_GROUP_CREATE';
export const PERM_GROUP_DELETE = 'GROUP_DELETE';
export const PERM_GROUP_INVITE = 'GROUP_INVITE';
export const PERM_GROUP_ADMIN = 'GROUP_ADMIN';

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
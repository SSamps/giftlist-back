import { Document, Schema } from 'mongoose';
import { TgiftListItem } from '../listItems';
import {
    TYPE_PERM_ALL_LIST_GROUP,
    TYPE_PERM_BASIC_LIST_ALL,
    TYPE_PERM_GIFT_GROUP_ALL,
    TYPE_PERM_GIFT_GROUP_CHILD_ALL,
    TYPE_PERM_GIFT_LIST_ALL,
} from '../permissions/listGroupPermissions';

// Base
export class invalidGroupVariantError extends Error {
    constructor(variant: string) {
        super(variant + ' is an invalid groupVariant');
        this.name = 'invalidGroupVariantError';
    }
}

export class invalidParentVariantError extends Error {
    constructor(childVariant: string, parentVariant: string) {
        super(childVariant + ' is an invalid child for the provided parent variant' + parentVariant);
        this.name = 'invalidParentVariantError';
    }
}

export interface IgroupMemberBase {
    userId: Schema.Types.ObjectId | string;
    oldestReadMessage?: Date | undefined;
    permissions: TYPE_PERM_ALL_LIST_GROUP[];
}

export type TlistGroupBaseFields = {
    groupName: string;
    creationDate?: Date;
};

type TlistGroupDiscriminatorKey = {
    groupVariant: string;
};

// Singular groups
// Basic Lists

export interface IbasicListMember extends IgroupMemberBase {
    permissions: TYPE_PERM_BASIC_LIST_ALL[];
}

type TbasicListExtraFields = {
    owner: IbasicListMember;
    members?: [IbasicListMember];
    maxListItems?: Number;
};

export type TbasicListFields = TlistGroupBaseFields & TbasicListExtraFields;

// Gift Lists

export interface IgiftListMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_LIST_ALL[];
    listItems?: TgiftListItem[];
}

type TgiftListExtraFields = {
    owner: IgiftListMember;
    members?: [IgiftListMember];
    maxListItems?: Number;
    maxSecretListItemsEach?: Number;
};

export type TgiftListFields = TlistGroupBaseFields & TgiftListExtraFields;

// Parent groups
// Gift Groups

export interface IgiftGroupMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_ALL[];
}

type TgiftGroupExtraFields = {
    owner: IgiftGroupMember;
    members?: [IgiftGroupMember];
};

export type TgiftGroupFields = TlistGroupBaseFields & TgiftGroupExtraFields;

// Child groups

export interface IgiftGroupChildMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_CHILD_ALL[];
}

type TgiftGroupChildExtraFields = {
    owner: IgiftGroupChildMember;
    members?: [IgiftGroupChildMember];
    parentGroupId: Schema.Types.ObjectId | string;
    maxListItems?: Number;
    maxSecretListItemsEach?: Number;
};

export type TgiftGroupChildFields = TlistGroupBaseFields & TgiftGroupChildExtraFields;

// Aggregated

type TlistGroupAnyBase = TbasicListFields & TgiftListFields & TgiftGroupFields & TgiftGroupChildFields;
export type TlistGroupAny = Document & TlistGroupAnyBase & TlistGroupDiscriminatorKey;

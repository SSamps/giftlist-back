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

type TnewBasicListExtraFields = {
    owner: IbasicListMember;
    members?: [IbasicListMember];
    maxListItems?: Number;
};

type TbasicListExtraFields = {
    owner: IbasicListMember;
    members: [IbasicListMember];
    maxListItems?: Number;
};

export type TnewBasicListFields = TlistGroupBaseFields & TnewBasicListExtraFields;
export type TnewBasicListDocument = Document & TnewBasicListFields;

export type TbasicListFields = TlistGroupBaseFields & TbasicListExtraFields;
export type TbasicListDocument = Document & TbasicListFields;

// Gift Lists

export interface IgiftListMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_LIST_ALL[];
}

type TnewGiftListExtraFields = {
    owner: IgiftListMember;
    members?: [IgiftListMember];
    maxListItems?: Number;
    listItems?: TgiftListItem[];
    maxSecretListItemsEach?: Number;
    secretListItems?: TgiftListItem[];
};

type TgiftListExtraFields = {
    owner: IgiftListMember;
    members: [IgiftListMember];
    maxListItems: Number;
    listItems: TgiftListItem[];
    maxSecretListItemsEach: Number;
    secretListItems: TgiftListItem[];
};

export type TnewGiftListFields = TlistGroupBaseFields & TnewGiftListExtraFields;
export type TnewGiftListDocument = Document & TnewGiftListFields;

export type TgiftListFields = TlistGroupBaseFields & TgiftListExtraFields;
export type TgiftListDocument = Document & TgiftListFields;

// Parent groups
// Gift Groups

export interface IgiftGroupMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_ALL[];
}

type TnewGiftGroupExtraFields = {
    owner: IgiftGroupMember;
    members?: [IgiftGroupMember];
};

type TgiftGroupExtraFields = {
    owner: IgiftGroupMember;
    members: [IgiftGroupMember];
};

export type TnewGiftGroupFields = TlistGroupBaseFields & TnewGiftGroupExtraFields;
export type TnewGiftGroupDocument = Document & TnewGiftGroupFields;

export type TgiftGroupFields = TlistGroupBaseFields & TgiftGroupExtraFields;
export type TgiftGroupDocument = Document & TgiftGroupFields;

// Child groups

export interface IgiftGroupChildMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_CHILD_ALL[];
}

type TnewGiftGroupChildExtraFields = {
    owner: IgiftGroupChildMember;
    members?: [IgiftGroupChildMember];
    parentGroupId: Schema.Types.ObjectId | string;
    maxListItems?: Number;
    maxSecretListItemsEach?: Number;
};

type TgiftGroupChildExtraFields = {
    owner: IgiftGroupChildMember;
    members: [IgiftGroupChildMember];
    parentGroupId: Schema.Types.ObjectId | string;
    maxListItems: Number;
    maxSecretListItemsEach: Number;
};

export type TnewGiftGroupChildFields = TlistGroupBaseFields & TnewGiftGroupChildExtraFields;
export type TnewGiftGroupChildDocument = Document & TnewGiftGroupChildFields;

export type TgiftGroupChildFields = TlistGroupBaseFields & TgiftGroupChildExtraFields;
export type TgiftGroupChildDocument = Document & TgiftGroupChildFields;

// Aggregated

type TlistGroupAnyBase = TbasicListFields & TgiftListFields & TgiftGroupFields & TgiftGroupChildFields;
export type TlistGroupAny = Document & TlistGroupAnyBase & TlistGroupDiscriminatorKey;

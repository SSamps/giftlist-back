import { Document, LeanDocument, Schema } from 'mongoose';
import { TbasicListItem, TgiftListItem, TgiftListItemCensored } from './listItemInterfaces';
import {
    TYPE_PERM_ALL_LIST_GROUP,
    TYPE_PERM_BASIC_LIST_ALL,
    TYPE_PERM_GIFT_GROUP_ALL,
    TYPE_PERM_GIFT_GROUP_CHILD_ALL,
    TYPE_PERM_GIFT_LIST_ALL,
} from './listGroupPermissions';
import { BASIC_LIST } from './variants/discriminators/singular/BasicListModel';
import { GIFT_LIST } from './variants/discriminators/singular/GiftListModel';
import { GIFT_GROUP } from './variants/discriminators/parent/GiftGroupModel';
import { GIFT_GROUP_CHILD } from './variants/discriminators/child/GiftGroupChildModel';

// Base
export class invalidGroupVariantError extends Error {
    constructor(variant: string) {
        super(variant + ' is an invalid groupVariant');
        this.name = 'invalidGroupVariantError';
    }
}

export class invalidParentError extends Error {
    constructor(parentId: string) {
        super(
            'unable to find a parent group with id of ' +
                parentId +
                'on which the user is authorised to create child groups.'
        );
        this.name = 'invalidParentError';
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

export type TgroupMemberTypes = 'member' | 'owner';

export type TlistGroupBaseFields = {
    groupName: string;
    creationDate?: Date;
};

type TlistGroupDiscriminatorKey = {
    groupVariant: typeof BASIC_LIST | typeof GIFT_LIST | typeof GIFT_GROUP | typeof GIFT_GROUP_CHILD;
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
    maxListItems: Number;
    listItems: TbasicListItem[];
};

export type TnewBasicListFields = TlistGroupBaseFields & TnewBasicListExtraFields;

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

type TgiftListExtraFieldsCensored = {
    owner: IgiftListMember;
    members: [IgiftListMember];
    maxListItems: Number;
    listItems: TgiftListItemCensored[];
    maxSecretListItemsEach: Number;
    secretListItems: TgiftListItemCensored[] | undefined;
};

export type TnewGiftListFields = TlistGroupBaseFields & TnewGiftListExtraFields;

export type TgiftListFields = TlistGroupBaseFields & TgiftListExtraFields;
export type TgiftListDocument = Document & TgiftListFields;

export type TgiftListFieldsCensored = TlistGroupBaseFields & TgiftListExtraFieldsCensored;

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
    listItems: TgiftListItem[];
    maxSecretListItemsEach: Number;
    secretListItems: TgiftListItem[];
};

type TgiftGroupChildExtraFieldsCensored = {
    owner: IgiftGroupChildMember;
    members: [IgiftGroupChildMember];
    parentGroupId: Schema.Types.ObjectId | string;
    maxListItems: Number;
    listItems: TgiftListItemCensored[];
    maxSecretListItemsEach: Number;
    secretListItems: TgiftListItemCensored[] | undefined;
};

export type TnewGiftGroupChildFields = TlistGroupBaseFields & TnewGiftGroupChildExtraFields;

export type TgiftGroupChildFields = TlistGroupBaseFields & TgiftGroupChildExtraFields;
export type TgiftGroupChildDocument = Document & TgiftGroupChildFields;

export type TgiftGroupChildFieldsCensored = TlistGroupBaseFields & TgiftGroupChildExtraFieldsCensored;

// Aggregated

type TlistGroupAnyBase = TbasicListFields & TgiftListFields & TgiftGroupFields & TgiftGroupChildFields;
export type TlistGroupAny = Document & TlistGroupAnyBase & TlistGroupDiscriminatorKey;

type TgroupChildren = {
    children: LeanDocument<TlistGroupAnyCensoredSingular>[];
};

export type TlistGroupAnyWithChildren = TlistGroupAny & TgroupChildren;

export type TgroupMemberAny = IbasicListMember & IgiftListMember & IgiftGroupMember & IgiftGroupChildMember;

type TlistGroupAnyBaseCensored = TbasicListFields &
    TgiftListFieldsCensored &
    TgiftGroupFields &
    TgiftGroupChildFieldsCensored;
export type TlistGroupAnyCensoredSingular = Document & TlistGroupAnyBaseCensored & TlistGroupDiscriminatorKey;
export type TlistGroupAnyCensoredWithChildren = TlistGroupAnyCensoredSingular & TgroupChildren;

export type TlistGroupAnyCensoredAny = TlistGroupAnyCensoredSingular | TlistGroupAnyCensoredWithChildren;

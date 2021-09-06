import { Document, LeanDocument, Schema } from 'mongoose';
import { IbasicListItem, IgiftListItem, IgiftListItemCensored } from './listItemInterfaces';
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
    displayName: string;
    oldestReadMessage?: Date | undefined;
    permissions: TYPE_PERM_ALL_LIST_GROUP[];
}

export interface IlistGroupBaseFields {
    groupName: string;
    creationDate?: Date;
}

// Singular groups
// Basic Lists

export interface IbasicListMember extends IgroupMemberBase {
    permissions: TYPE_PERM_BASIC_LIST_ALL[];
}

interface InewBasicListExtraFields {
    members: IbasicListMember[];
    maxListItems?: Number;
}

interface IbasicListExtraFields {
    members: IbasicListMember[];
    maxListItems: Number;
    listItems: IbasicListItem[];
    groupVariant: typeof BASIC_LIST;
}

export type TnewBasicListFields = IlistGroupBaseFields & InewBasicListExtraFields;

export type TbasicListFields = IlistGroupBaseFields & IbasicListExtraFields;
export type TbasicListDocument = Document & TbasicListFields;

// Gift Lists

export interface IgiftListMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_LIST_ALL[];
}

interface InewGiftListExtraFields {
    members: IgiftListMember[];
    maxListItems?: Number;
    listItems?: IgiftListItem[];
    maxSecretListItemsEach?: Number;
    secretListItems?: IgiftListItem[];
}

interface IgiftListExtraFields {
    members: IgiftListMember[];
    maxListItems: Number;
    listItems: IgiftListItem[];
    maxSecretListItemsEach: Number;
    secretListItems: IgiftListItem[];
    groupVariant: typeof GIFT_LIST;
}

interface IgiftListExtraFieldsCensored {
    members: IgiftListMember[];
    maxListItems: Number;
    listItems: IgiftListItemCensored[];
    maxSecretListItemsEach: Number;
    secretListItems: IgiftListItemCensored[] | undefined;
    groupVariant: typeof GIFT_LIST;
}

export type TnewGiftListFields = IlistGroupBaseFields & InewGiftListExtraFields;

export type TgiftListFields = IlistGroupBaseFields & IgiftListExtraFields;
export type TgiftListDocument = Document & TgiftListFields;

export type TgiftListFieldsCensored = IlistGroupBaseFields & IgiftListExtraFieldsCensored;

// Parent groups
// Gift Groups

export interface IgiftGroupMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_ALL[];
}

interface InewGiftGroupExtraFields {
    members: IgiftGroupMember[];
}

interface IgiftGroupExtraFields {
    members: IgiftGroupMember[];
    groupVariant: typeof GIFT_GROUP;
}

export type TnewGiftGroupFields = IlistGroupBaseFields & InewGiftGroupExtraFields;

export type TgiftGroupFields = IlistGroupBaseFields & IgiftGroupExtraFields;
export type TgiftGroupDocument = Document & TgiftGroupFields;

interface IgroupChildren {
    children: LeanDocument<TlistGroupAnyCensoredSingular>[];
}

export type TgiftGroupDocumentWithChildren = Document & TgiftGroupFields & IgroupChildren;

// Child groups

export interface IgiftGroupChildMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_CHILD_ALL[];
}

interface InewGiftGroupChildExtraFields {
    members: IgiftGroupChildMember[];
    parentGroupId: Schema.Types.ObjectId | string;
    maxListItems?: Number;
    maxSecretListItemsEach?: Number;
}

interface IgiftGroupChildExtraFields {
    members: IgiftGroupChildMember[];
    parentGroupId: Schema.Types.ObjectId | string;
    maxListItems: Number;
    listItems: IgiftListItem[];
    maxSecretListItemsEach: Number;
    secretListItems: IgiftListItem[];
    groupVariant: typeof GIFT_GROUP_CHILD;
}

interface IgiftGroupChildExtraFieldsCensored {
    members: IgiftGroupChildMember[];
    parentGroupId: Schema.Types.ObjectId | string;
    maxListItems: Number;
    listItems: IgiftListItemCensored[];
    maxSecretListItemsEach: Number;
    secretListItems: IgiftListItemCensored[] | undefined;
    groupVariant: typeof GIFT_GROUP_CHILD;
}

export type TnewGiftGroupChildFields = IlistGroupBaseFields & InewGiftGroupChildExtraFields;

export type TgiftGroupChildFields = IlistGroupBaseFields & IgiftGroupChildExtraFields;
export type TgiftGroupChildDocument = Document & TgiftGroupChildFields;

export type TgiftGroupChildFieldsCensored = IlistGroupBaseFields & IgiftGroupChildExtraFieldsCensored;

// Aggregated

type TlistGroupAnyFields = TbasicListFields | TgiftListFields | TgiftGroupFields | TgiftGroupChildFields;
export type TlistGroupAnyDocument = Document & TlistGroupAnyFields;

export type TlistGroupAnyWithChildren = TlistGroupAnyDocument & IgroupChildren;

export type TgroupMemberAny = IbasicListMember | IgiftListMember | IgiftGroupMember | IgiftGroupChildMember;

type TlistGroupAnyFieldsCensored =
    | TbasicListFields
    | TgiftListFieldsCensored
    | TgiftGroupFields
    | TgiftGroupChildFieldsCensored;
export type TlistGroupAnyCensoredSingular = Document & TlistGroupAnyFieldsCensored;
export type TlistGroupAnyCensoredWithChildren = TlistGroupAnyCensoredSingular & IgroupChildren;

export type TlistGroupAnyCensoredAny = TlistGroupAnyCensoredSingular | TlistGroupAnyCensoredWithChildren;

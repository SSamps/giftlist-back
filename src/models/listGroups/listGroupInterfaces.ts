import { Document, Schema } from 'mongoose';
import { IbasicListItem, IgiftListItem, IgiftListItemCensored } from './listItemInterfaces';
import {
    TYPE_PERM_ALL_LIST_GROUP,
    TYPE_PERM_BASIC_LIST_ALL,
    TYPE_PERM_GIFT_GROUP_ALL,
    TYPE_PERM_GIFT_GROUP_CHILD_ALL,
    TYPE_PERM_GIFT_LIST_ALL,
} from './listGroupPermissions';
import {
    BASIC_LIST,
    GIFT_GROUP,
    GIFT_GROUP_CHILD,
    GIFT_LIST,
    LIST_GROUP_ALL_CENSORABLE,
    LIST_GROUP_ALL_WITH_ANY_ITEMS,
    LIST_GROUP_ALL_WITH_REGULAR_ITEMS,
    LIST_GROUP_ALL_WITH_SECRET_ITEMS,
    LIST_GROUP_PARENT_VARIANTS,
} from './variants/listGroupVariants';

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

export interface IlistGroupBaseDefaultFields {
    creationDate: Date;
    _id: Schema.Types.ObjectId | string;
}

export interface IListGroupBaseRequiredFields {
    groupName: string;
}

export type IlistGroupBaseFields = IlistGroupBaseDefaultFields & IListGroupBaseRequiredFields;

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

export type TnewBasicListFields = IListGroupBaseRequiredFields & InewBasicListExtraFields;

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

export type TnewGiftListFields = IListGroupBaseRequiredFields & InewGiftListExtraFields;

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

export type TnewGiftGroupFields = IListGroupBaseRequiredFields & InewGiftGroupExtraFields;

export type TgiftGroupFields = IlistGroupBaseFields & IgiftGroupExtraFields;
export type TgiftGroupDocument = Document & TgiftGroupFields;

interface IgroupChildren {
    children: TlistGroupAnyFieldsCensored[];
}

export type TgiftGroupWithChildrenFields = TgiftGroupFields & IgroupChildren;

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

export type TnewGiftGroupChildFields = IListGroupBaseRequiredFields & InewGiftGroupChildExtraFields;

export type TgiftGroupChildFields = IlistGroupBaseFields & IgiftGroupChildExtraFields;
export type TgiftGroupChildDocument = Document & TgiftGroupChildFields;

export type TgiftGroupChildFieldsCensored = IlistGroupBaseFields & IgiftGroupChildExtraFieldsCensored;

//   Aggregated
export type TlistGroupAnyFields = TbasicListFields | TgiftListFields | TgiftGroupFields | TgiftGroupChildFields;
export type TlistGroupAnyDocument = Document & TlistGroupAnyFields;

export type TlistGroupAnyWithAnyItemsFields = TbasicListFields | TgiftListFields | TgiftGroupChildFields;
export type TlistGroupAnyWithRegularItemsFields = TbasicListFields | TgiftListFields | TgiftGroupChildFields;
export type TlistGroupAnyWithSecretItemsFields = TgiftListFields | TgiftGroupChildFields;

export type TlistGroupAnyParentFields = TgiftGroupFields;
export type TlistGroupAnyNonParentFields = TbasicListFields | TgiftListFields | TgiftGroupChildFields;

export type TlistGroupAnyWithChildren = TlistGroupAnyDocument & IgroupChildren;

export type TgroupMemberAny = IgroupMemberBase &
    (IbasicListMember | IgiftListMember | IgiftGroupMember | IgiftGroupChildMember);

export type TlistGroupAnyCensorableFields = TgiftListFields | TgiftGroupChildFields;

export type TlistGroupAnyFieldsCensored =
    | TbasicListFields
    | TgiftListFieldsCensored
    | TgiftGroupFields
    | TgiftGroupChildFieldsCensored;

// Group Type Predicates
export const groupVariantIsAParent = (group: TlistGroupAnyFields): group is TgiftGroupFields => {
    return LIST_GROUP_PARENT_VARIANTS.includes(group.groupVariant);
};

export const groupVariantHasAnyItems = (group: TlistGroupAnyFields): group is TlistGroupAnyWithAnyItemsFields => {
    return LIST_GROUP_ALL_WITH_ANY_ITEMS.includes(group.groupVariant);
};

export const groupVariantHasRegularItems = (
    group: TlistGroupAnyFields
): group is TlistGroupAnyWithRegularItemsFields => {
    return LIST_GROUP_ALL_WITH_REGULAR_ITEMS.includes(group.groupVariant);
};

export const groupVariantHasSecretItems = (group: TlistGroupAnyFields): group is TlistGroupAnyWithSecretItemsFields => {
    return LIST_GROUP_ALL_WITH_SECRET_ITEMS.includes(group.groupVariant);
};

export const groupVariantNeedsCensoring = (group: TlistGroupAnyFields): group is TlistGroupAnyCensorableFields => {
    return LIST_GROUP_ALL_CENSORABLE.includes(group.groupVariant);
};

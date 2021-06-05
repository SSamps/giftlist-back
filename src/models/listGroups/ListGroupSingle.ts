import { Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from './ListGroup';
import {
    PERM_LIST_GROUP_SINGLE_BASIC_LIST as PERM_BASIC_LIST_ALL,
    PERM_LIST_GROUP_SINGLE_GIFT_LIST as PERM_GIFT_LIST_ALL,
    TYPE_PERM_LIST_GROUP_SINGLE_BASIC_LIST as TYPE_PERM_BASIC_LIST_ALL,
    TYPE_PERM_LIST_GROUP_SINGLE_GIFT_LIST as TYPE_PERM_GIFT_LIST_ALL,
} from './permissions/ListGroupPermissions';

// Define groupTypes which are single groups
export const BASIC_LIST = 'basicList';
export const GIFT_LIST = 'giftList';

export const LIST_GROUP_SINGLE_VARIANTS = [BASIC_LIST, GIFT_LIST];

// Basic Lists
export interface IgroupMemberBasicList extends IgroupMemberBase {
    permissions: TYPE_PERM_BASIC_LIST_ALL[];
}

export type TbasicListExtensionFields = {
    owner: IgroupMemberBasicList;
    members?: [IgroupMemberBasicList];
    maxListItems?: Number;
};

export type TbasicListFields = TlistGroupBase & TbasicListExtensionFields;

export const BasicListSchema = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_BASIC_LIST_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_BASIC_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    maxListItems: { type: Number, required: true, default: 50 },
});
export const basicListModel = ListGroupSchemaBase.discriminator('basicList', BasicListSchema);

// Gift Lists
export interface IgroupMemberGiftList extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_LIST_ALL[];
}

export type TgiftListExtensionFields = {
    owner: IgroupMemberGiftList;
    members?: [IgroupMemberGiftList];
    maxListItems?: Number;
    maxSecretListItemsEach?: Number;
};

export type TgiftListFields = TlistGroupBase & TgiftListExtensionFields;

export const giftListSchema = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_GIFT_LIST_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    maxListItems: { type: Number, required: true, default: 20 },
    maxSecretListItemsEach: { type: Number, required: true, default: 5 },
});
export const giftListModel = ListGroupSchemaBase.discriminator('giftList', giftListSchema);

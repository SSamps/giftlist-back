import { Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from '../ListGroupBase';
import { PERM_GIFT_LIST_ALL, TYPE_PERM_GIFT_LIST_ALL } from '../permissions/ListGroupPermissions';

export const GIFT_LIST = 'giftList';

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
export const giftListModel = ListGroupSchemaBase.discriminator(GIFT_LIST, giftListSchema);

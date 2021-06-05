import { Schema } from 'mongoose';
import { IgroupMemberBase, listGroupBaseModel, TlistGroupBaseFields } from '../ListGroupBase';
import { PERM_GIFT_LIST_ALL, TYPE_PERM_GIFT_LIST_ALL } from '../permissions/ListGroupPermissions';

export const GIFT_LIST = 'giftList';

export interface IgiftListMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_LIST_ALL[];
}

export type TgiftListExtraFields = {
    owner: IgiftListMember;
    members?: [IgiftListMember];
    maxListItems?: Number;
    maxSecretListItemsEach?: Number;
};

export type TgiftListFields = TlistGroupBaseFields & TgiftListExtraFields;

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
export const GiftListModel = listGroupBaseModel.discriminator(GIFT_LIST, giftListSchema);

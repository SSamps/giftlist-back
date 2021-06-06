import { Schema } from 'mongoose';
import { IgroupMemberBase, listGroupBaseModel, TlistGroupBaseFields } from '../ListGroupBase';
import { PERM_GIFT_GROUP_CHILD_ALL, TYPE_PERM_GIFT_GROUP_CHILD_ALL } from '../permissions/ListGroupPermissions';

export const GIFT_GROUP_CHILD = 'GIFT_GROUP_CHILD';

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

const giftGroupChildSchema = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_CHILD_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_CHILD_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    parentGroupId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    maxListItems: { type: Number, required: true, default: 20 },
    maxSecretListItemsEach: { type: Number, required: true, default: 5 },
});

export const GiftGroupChildModel = listGroupBaseModel.discriminator(GIFT_GROUP_CHILD, giftGroupChildSchema);

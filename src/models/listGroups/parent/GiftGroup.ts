import { Schema } from 'mongoose';
import { IgroupMemberBase, listGroupBaseModel, TlistGroupBaseFields } from '../ListGroupBase';
import { PERM_GIFT_GROUP_ALL, TYPE_PERM_GIFT_GROUP_ALL } from '../permissions/ListGroupPermissions';

export const GIFT_GROUP = 'GIFT_GROUP';

export interface IgiftGroupMember extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_ALL[];
}

export type TgiftGroupExtraFields = {
    owner: IgiftGroupMember;
    members?: [IgiftGroupMember];
};

export type TgiftGroupFields = TlistGroupBaseFields & TgiftGroupExtraFields;

const giftGroupSchema = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
});

const GiftGroupModel = listGroupBaseModel.discriminator(GIFT_GROUP, giftGroupSchema);

export default GiftGroupModel;

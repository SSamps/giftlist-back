import { Schema } from 'mongoose';
import { listGroupBaseModel } from '../../ListGroupBase';
import { PERM_GIFT_GROUP_ALL } from '../../permissions/listGroupPermissions';

export const GIFT_GROUP = 'GIFT_GROUP';

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

export const GiftGroupModel = listGroupBaseModel.discriminator(GIFT_GROUP, giftGroupSchema);

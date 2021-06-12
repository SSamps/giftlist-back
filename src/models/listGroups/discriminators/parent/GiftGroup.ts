import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../ListGroupBase';
import { PERM_GIFT_GROUP_ALL } from '../../permissions/listGroupPermissions';
import { TgiftGroupDocument } from '../interfaces';

export const GIFT_GROUP = 'GIFT_GROUP';

const giftGroupSchema = new Schema<TgiftGroupDocument>({
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

export const GiftGroupModel = ListGroupBaseModel.discriminator(GIFT_GROUP, giftGroupSchema);

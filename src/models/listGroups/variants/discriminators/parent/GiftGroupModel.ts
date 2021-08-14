import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../../ListGroupBaseModel';
import { PERM_GIFT_GROUP_ALL } from '../../../listGroupPermissions';
import { TgiftGroupDocument } from '../../../listGroupInterfaces';

export const GIFT_GROUP = 'GIFT_GROUP';

const giftGroupSchema = new Schema<TgiftGroupDocument>({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        displayName: { type: String, required: true },
        permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            displayName: { type: String, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
});

export const GiftGroupModel = ListGroupBaseModel.discriminator(GIFT_GROUP, giftGroupSchema);

import { Schema } from 'mongoose';
import { listGroupBaseModel } from '../../ListGroupBase';
import { PERM_GIFT_LIST_ALL } from '../../permissions/ListGroupPermissions';

export const GIFT_LIST = 'GIFT_LIST';

const giftListSchema = new Schema({
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

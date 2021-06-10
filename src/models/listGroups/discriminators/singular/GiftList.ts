import { Schema } from 'mongoose';
import { listGroupBaseModel } from '../../ListGroupBase';
import { PERM_GIFT_LIST_ALL } from '../../permissions/listGroupPermissions';
import { TgiftListDocument } from '../interfaces';

export const GIFT_LIST = 'GIFT_LIST';

const giftListSchema = new Schema<TgiftListDocument>({
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
    listItems: [
        {
            authorId: { type: Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            link: { type: String },
            selectedBy: { type: Schema.Types.ObjectId },
        },
    ],
    maxSecretListItemsEach: { type: Number, required: true, default: 5 },
    secretListItems: [
        {
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            link: { type: String },
            selectedBy: { type: Schema.Types.ObjectId },
        },
    ],
});

export const GiftListModel = listGroupBaseModel.discriminator(GIFT_LIST, giftListSchema);

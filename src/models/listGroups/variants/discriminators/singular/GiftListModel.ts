import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../../ListGroupBaseModel';
import { PERM_GIFT_LIST_ALL } from '../../../listGroupPermissions';
import { TgiftListDocument } from '../../../listGroupInterfaces';

export const GIFT_LIST = 'GIFT_LIST';

const giftListSchema = new Schema<TgiftListDocument>({
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            displayName: { type: String, required: true },
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
            links: [{ type: String }],
            selectedBy: [{ type: Schema.Types.ObjectId }],
        },
    ],
    maxSecretListItemsEach: { type: Number, required: true, default: 5 },
    secretListItems: [
        {
            authorId: { type: Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            links: [{ type: String }],
            selectedBy: [{ type: Schema.Types.ObjectId }],
        },
    ],
});

export const GiftListModel = ListGroupBaseModel.discriminator(GIFT_LIST, giftListSchema);

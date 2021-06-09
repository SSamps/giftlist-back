import { Schema } from 'mongoose';
import { listGroupBaseModel } from '../../ListGroupBase';
import { PERM_GIFT_LIST_ALL } from '../../permissions/listGroupPermissions';

export const GIFT_LIST = 'GIFT_LIST';

const giftListSchema = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_GIFT_LIST_ALL }],
        oldestUnreadMsg: { type: Date },
        listItems: [
            {
                author: { type: Schema.Types.ObjectId },
                creationDate: { type: Date, default: Date.now },
                body: { type: String },
                link: { type: String },
                selectedBy: { type: Schema.Types.ObjectId },
            },
        ],
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
            listItems: [
                {
                    author: { type: Schema.Types.ObjectId },
                    creationDate: { type: Date, default: Date.now },
                    body: { type: String },
                    link: { type: String },
                    selectedBy: { type: Schema.Types.ObjectId },
                },
            ],
        },
    ],
    maxListItems: { type: Number, required: true, default: 20 },
    maxSecretListItemsEach: { type: Number, required: true, default: 5 },
});

export const GiftListModel = listGroupBaseModel.discriminator(GIFT_LIST, giftListSchema);

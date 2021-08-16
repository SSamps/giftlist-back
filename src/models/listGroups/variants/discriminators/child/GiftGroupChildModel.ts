import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../../ListGroupBaseModel';
import { PERM_GIFT_GROUP_CHILD_ALL } from '../../../listGroupPermissions';
import { TgiftGroupChildDocument } from '../../../listGroupInterfaces';

export const GIFT_GROUP_CHILD = 'GIFT_GROUP_CHILD';

const giftGroupChildSchema = new Schema<TgiftGroupChildDocument>({
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            displayName: { type: String, required: true },
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
    listItems: [
        {
            authorId: { type: Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            link: { type: String },
            selectedBy: [{ type: Schema.Types.ObjectId }],
        },
    ],
    maxSecretListItemsEach: { type: Number, required: true, default: 5 },
    secretListItems: [
        {
            authorId: { type: Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            link: { type: String },
            selectedBy: [{ type: Schema.Types.ObjectId }],
        },
    ],
});

export const GiftGroupChildModel = ListGroupBaseModel.discriminator(GIFT_GROUP_CHILD, giftGroupChildSchema);

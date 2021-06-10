import { Schema } from 'mongoose';
import { listGroupBaseModel } from '../../ListGroupBase';
import { PERM_GIFT_GROUP_CHILD_ALL } from '../../permissions/listGroupPermissions';
import { TgiftGroupChildDocument } from '../interfaces';

export const GIFT_GROUP_CHILD = 'GIFT_GROUP_CHILD';

const giftGroupChildSchema = new Schema<TgiftGroupChildDocument>({
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

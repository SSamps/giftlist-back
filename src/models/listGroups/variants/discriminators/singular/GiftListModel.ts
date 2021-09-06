import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../../ListGroupBaseModel';
import { PERM_GIFT_LIST_ALL } from '../../../listGroupPermissions';
import { TgiftListFields } from '../../../listGroupInterfaces';
import {
    VALIDATION_ITEM_BODY_MAX_LENGTH,
    VALIDATION_ITEM_BODY_MIN_LENGTH,
    VALIDATION_ITEM_LINK_MAX_LENGTH,
    VALIDATION_ITEM_LINK_MIN_LENGTH,
} from '../../../../validation';

export const GIFT_LIST = 'GIFT_LIST';

const giftListSchema = new Schema<TgiftListFields>({
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            displayName: { type: String, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    maxListItems: { type: 'Number', required: true, default: 20 },
    listItems: [
        {
            authorId: { type: Schema.Types.ObjectId },
            creationDate: {
                type: Date,
                default: () => {
                    return new Date();
                },
            },
            body: {
                type: String,
                minlength: VALIDATION_ITEM_BODY_MIN_LENGTH,
                maxlength: VALIDATION_ITEM_BODY_MAX_LENGTH,
            },
            links: [
                {
                    type: String,
                    minlength: VALIDATION_ITEM_LINK_MIN_LENGTH,
                    maxlength: VALIDATION_ITEM_LINK_MAX_LENGTH,
                },
            ],
            selectedBy: [{ type: Schema.Types.ObjectId }],
        },
    ],
    maxSecretListItemsEach: { type: 'Number', required: true, default: 5 },
    secretListItems: [
        {
            authorId: { type: Schema.Types.ObjectId },
            creationDate: {
                type: Date,
                default: () => {
                    return new Date();
                },
            },
            body: {
                type: String,
                minlength: VALIDATION_ITEM_BODY_MIN_LENGTH,
                maxlength: VALIDATION_ITEM_BODY_MAX_LENGTH,
            },
            links: [
                {
                    type: String,
                    minlength: VALIDATION_ITEM_LINK_MIN_LENGTH,
                    maxlength: VALIDATION_ITEM_LINK_MAX_LENGTH,
                },
            ],
            selectedBy: [{ type: Schema.Types.ObjectId }],
        },
    ],
});

export const GiftListModel = ListGroupBaseModel.discriminator(GIFT_LIST, giftListSchema);

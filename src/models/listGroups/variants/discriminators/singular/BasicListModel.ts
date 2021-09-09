import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../../ListGroupBaseModel';
import { PERM_BASIC_LIST_ALL } from '../../../listGroupPermissions';
import { TbasicListFields } from '../../../listGroupInterfaces';
import { VALIDATION_ITEM_BODY_MAX_LENGTH, VALIDATION_ITEM_BODY_MIN_LENGTH } from '../../../../validation';
import { BASIC_LIST } from '../../listGroupVariants';

const basicListSchema = new Schema<TbasicListFields>({
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            displayName: { type: String, required: true },
            permissions: [{ type: String, required: true, enum: PERM_BASIC_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    maxListItems: { type: 'Number', required: true, default: 50 },
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
                    minlength: VALIDATION_ITEM_BODY_MIN_LENGTH,
                    maxlength: VALIDATION_ITEM_BODY_MAX_LENGTH,
                },
            ],
            selected: { type: Boolean, default: false },
        },
    ],
});

export const BasicListModel = ListGroupBaseModel.discriminator(BASIC_LIST, basicListSchema);

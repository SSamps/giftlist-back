import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../ListGroupBase';
import { PERM_BASIC_LIST_ALL } from '../../permissions/listGroupPermissions';
import { TbasicListDocument } from '../interfaces';

export const BASIC_LIST = 'BASIC_LIST';

const basicListSchema = new Schema<TbasicListDocument>({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_BASIC_LIST_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_BASIC_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    maxListItems: { type: Number, required: true, default: 50 },
});

export const BasicListModel = ListGroupBaseModel.discriminator(BASIC_LIST, basicListSchema);

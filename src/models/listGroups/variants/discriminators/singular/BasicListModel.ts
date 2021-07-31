import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../../ListGroupBaseModel';
import { PERM_BASIC_LIST_ALL } from '../../../listGroupPermissions';
import { TbasicListDocument } from '../../../listGroupInterfaces';

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
    listItems: [
        {
            authorId: { type: Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            links: [{ type: String }],
            selectedBy: [{ type: Schema.Types.ObjectId }],
        },
    ],
});

export const BasicListModel = ListGroupBaseModel.discriminator(BASIC_LIST, basicListSchema);

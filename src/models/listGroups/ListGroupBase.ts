import { Schema, model } from 'mongoose';
import { TlistGroupAny } from './discriminators/interfaces';

const options = { discriminatorKey: 'groupVariant' };

const ListGroupBaseSchema = new Schema(
    {
        owner: {
            userId: { type: Schema.Types.ObjectId },
            permissions: [{ type: String }],
            oldestUnreadMsg: { type: Date },
        },
        members: [
            {
                userId: { type: Schema.Types.ObjectId },
                permissions: [{ type: String }],
                oldestUnreadMsg: { type: Date },
                _id: false,
            },
        ],
        parentGroupId: {
            type: Schema.Types.ObjectId,
        },
        groupName: { type: String },
        creationDate: { type: Date, default: Date.now },
    },
    options
);

export const listGroupBaseModel = model<TlistGroupAny>('ListGroup', ListGroupBaseSchema);

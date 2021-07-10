import { Schema, model } from 'mongoose';
import { TlistGroupAny } from './listGroupInterfaces';

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
        listItems: [
            {
                authorId: { type: Schema.Types.ObjectId },
                creationDate: { type: Date, default: Date.now },
                body: { type: String },
                link: { type: String },
                selectedBy: [{ type: Schema.Types.ObjectId }],
            },
        ],
    },
    options
);

export const ListGroupBaseModel = model<TlistGroupAny>('ListGroup', ListGroupBaseSchema);

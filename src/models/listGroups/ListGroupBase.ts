import { Schema, model } from 'mongoose';
import { TlistGroupAny } from './discriminators/interfaces';

const options = { discriminatorKey: 'groupVariant' };

const ListGroupBaseSchema = new Schema(
    {
        owner: {
            userId: { type: Schema.Types.ObjectId },
            permissions: [{ type: String }],
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
                userId: { type: Schema.Types.ObjectId },
                permissions: [{ type: String }],
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
        parentGroupId: {
            type: Schema.Types.ObjectId,
        },
        groupName: { type: String },
        creationDate: { type: Date, default: Date.now },
    },
    options
);

export const listGroupBaseModel = model<TlistGroupAny>('ListGroup', ListGroupBaseSchema);

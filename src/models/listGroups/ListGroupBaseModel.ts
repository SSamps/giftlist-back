import { Schema, model } from 'mongoose';
import { VALIDATION_GROUP_NAME_MAX_LENGTH, VALIDATION_GROUP_NAME_MIN_LENGTH } from '../validation';
import { TlistGroupAny } from './listGroupInterfaces';

const options = { discriminatorKey: 'groupVariant' };

const ListGroupBaseSchema = new Schema(
    {
        members: [
            {
                userId: { type: Schema.Types.ObjectId },
                displayName: { type: String },
                permissions: [{ type: String }],
                oldestUnreadMsg: { type: Date },
                _id: false,
            },
        ],
        parentGroupId: {
            type: Schema.Types.ObjectId,
        },
        groupName: {
            type: String,
            required: true,
            minlength: VALIDATION_GROUP_NAME_MIN_LENGTH,
            maxlength: VALIDATION_GROUP_NAME_MAX_LENGTH,
        },
        creationDate: {
            type: Date,
            default: () => {
                return new Date();
            },
        },
    },
    options
);

export const ListGroupBaseModel = model<TlistGroupAny>('ListGroup', ListGroupBaseSchema);

import { Schema, model } from 'mongoose';
import { MESSAGE_DISCRIMINATOR, TmessageAny } from './messageInterfaces';

const options = { discriminatorKey: MESSAGE_DISCRIMINATOR };

const messageBaseSchema = new Schema(
    {
        groupId: {
            type: Schema.Types.ObjectId,
        },
        author: {
            type: Schema.Types.ObjectId,
        },
        creationDate: {
            type: Date,
            default: () => {
                return new Date();
            },
        },
        body: { type: String },
    },
    options
);

export const MessageBaseModel = model<TmessageAny>('message', messageBaseSchema);

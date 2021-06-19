import { Schema } from 'mongoose';
import { MessageBaseModel } from '../../MessageBaseModel';
import { TusermMessageDocument } from '../../messageInterfaces';

export const USER_MESSAGE = 'USER_MESSAGE';

const userMessageSchema = new Schema<TusermMessageDocument>({
    groupId: {
        type: Schema.Types.ObjectId,
    },
    author: {
        type: Schema.Types.ObjectId,
    },
    creationDate: { type: Date, default: Date.now },
    body: { type: String },
});

export const UserMessageModel = MessageBaseModel.discriminator(USER_MESSAGE, userMessageSchema);

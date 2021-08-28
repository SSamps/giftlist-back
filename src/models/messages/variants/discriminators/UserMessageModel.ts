import { Schema } from 'mongoose';
import { MessageBaseModel } from '../../MessageBaseModel';
import { TuserMessageDocument } from '../../messageInterfaces';

export const USER_MESSAGE = 'USER_MESSAGE';

const userMessageSchema = new Schema<TuserMessageDocument>({
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
});

export const UserMessageModel = MessageBaseModel.discriminator(USER_MESSAGE, userMessageSchema);

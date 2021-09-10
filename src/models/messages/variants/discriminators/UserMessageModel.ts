import { Schema } from 'mongoose';
import { VALIDATION_MESSAGE_MAX_LENGTH, VALIDATION_MESSAGE_MIN_LENGTH } from '../../../validation';
import { MessageBaseModel } from '../../MessageBaseModel';
import { TuserMessageFields } from '../../messageInterfaces';

export const USER_MESSAGE = 'USER_MESSAGE';

const userMessageSchema = new Schema<TuserMessageFields>({
    groupId: {
        type: Schema.Types.ObjectId,
    },
    authorId: {
        type: Schema.Types.ObjectId,
    },
    authorName: {
        type: String,
    },
    creationDate: {
        type: Date,
        default: () => {
            return new Date();
        },
    },
    body: { type: String, minlength: VALIDATION_MESSAGE_MIN_LENGTH, maxlength: VALIDATION_MESSAGE_MAX_LENGTH },
});

export const UserMessageModel = MessageBaseModel.discriminator(USER_MESSAGE, userMessageSchema);

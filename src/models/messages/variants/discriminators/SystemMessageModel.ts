import { Schema } from 'mongoose';
import { VALIDATION_MESSAGE_MAX_LENGTH, VALIDATION_MESSAGE_MIN_LENGTH } from '../../../validation';
import { MessageBaseModel } from '../../MessageBaseModel';
import { TsystemMessageFields } from '../../messageInterfaces';

export const SYSTEM_MESSAGE = 'SYSTEM_MESSAGE';

const systemMessageSchema = new Schema<TsystemMessageFields>({
    groupId: {
        type: Schema.Types.ObjectId,
    },
    creationDate: {
        type: Date,
        default: () => {
            return new Date();
        },
    },
    body: {
        type: String,
        minlength: VALIDATION_MESSAGE_MIN_LENGTH,
        maxlength: VALIDATION_MESSAGE_MAX_LENGTH,
    },
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
});

export const SystemMessageModel = MessageBaseModel.discriminator(SYSTEM_MESSAGE, systemMessageSchema);

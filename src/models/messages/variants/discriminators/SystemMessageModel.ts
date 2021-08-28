import { Schema } from 'mongoose';
import { MessageBaseModel } from '../../MessageBaseModel';
import { TsystemMessageDocument } from '../../messageInterfaces';

export const SYSTEM_MESSAGE = 'SYSTEM_MESSAGE';

const systemMessageSchema = new Schema<TsystemMessageDocument>({
    groupId: {
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

export const SystemMessageModel = MessageBaseModel.discriminator(SYSTEM_MESSAGE, systemMessageSchema);

import { Schema } from 'mongoose';
import { MessageBaseModel } from '../../MessageBase';
import { TsystemMessageDocument } from '../messageInterfaces';

export const SYSTEM_MESSAGE = 'SYSTEM_MESSAGE';

const systemMessageSchema = new Schema<TsystemMessageDocument>({
    groupId: {
        type: Schema.Types.ObjectId,
    },
    creationDate: { type: Date, default: Date.now },
    body: { type: String },
});

export const SystemMessageModel = MessageBaseModel.discriminator(SYSTEM_MESSAGE, systemMessageSchema);

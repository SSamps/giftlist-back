import { Document, Schema } from 'mongoose';

// Base model
export const MESSAGE_DISCRIMINATOR = 'messageVariant';
type TmessageDiscriminatorKey = { MESSAGE_DISCRIMINATOR: string };

type TnewMessageBaseFields = {
    groupId: Schema.Types.ObjectId | string;
    body: string;
};

type TmessageBaseFields = {
    groupId: Schema.Types.ObjectId | string;
    body: string;
    creationDate: Date;
    MESSAGE_DISCRIMINATOR?: string;
};

// User messages

type TnewUserMessageExtraFields = {
    authorId: Schema.Types.ObjectId | string;
    authorName: string;
};

type TuserMessageExtraFields = {
    authorId: Schema.Types.ObjectId | string;
    authorName: string;
};

export type TnewUserMessageFields = TnewMessageBaseFields & TnewUserMessageExtraFields;

export type TuserMessageFields = TmessageBaseFields & TuserMessageExtraFields;
export type TuserMessageDocument = Document & TuserMessageFields;

// System messages

type TnewSystemMessageExtraFields = {
    userId?: Schema.Types.ObjectId | string;
    userName?: string;
};
type TsystemMessageExtraFields = { userId?: Schema.Types.ObjectId | string; userName?: string };

export type TnewSystemMessageFields = TnewMessageBaseFields & TnewSystemMessageExtraFields;
export type TsystemMessageFields = TmessageBaseFields & TsystemMessageExtraFields;
export type TsystemMessageDocument = Document & TmessageBaseFields;

// Aggregate

type TmessageAnyBase = TuserMessageFields & TsystemMessageFields;
export type TmessageAny = Document & TmessageDiscriminatorKey & TmessageAnyBase;

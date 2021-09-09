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
    author: Schema.Types.ObjectId | string;
};

type TuserMessageExtraFields = {
    author: Schema.Types.ObjectId | string;
};

export type TnewUserMessageFields = TnewMessageBaseFields & TnewUserMessageExtraFields;

type TuserMessageFields = TmessageBaseFields & TuserMessageExtraFields;
export type TuserMessageDocument = Document & TuserMessageFields;

// System messages

type TnewSystemMessageExtraFields = {};
type TsystemMessageExtraFields = {};

export type TnewSystemMessageFields = TnewMessageBaseFields & TnewSystemMessageExtraFields;
type TsystemMessageFields = TmessageBaseFields & TsystemMessageExtraFields;
export type TsystemMessageDocument = Document & TmessageBaseFields;

// Aggregate

type TmessageAnyBase = TuserMessageFields & TsystemMessageFields;
export type TmessageAny = Document & TmessageDiscriminatorKey & TmessageAnyBase;

import { Schema } from 'mongoose';

export type TbasicListItem = {
    creationDate: Date;
    body: String;
    link?: String;
    selectedBy?: Schema.Types.ObjectId | string;
};

export type TgiftListItem = {
    author: Schema.Types.ObjectId | string;
    creationDate: Date;
    body: String;
    link?: String;
    selectedBy?: Schema.Types.ObjectId | string;
};

import { Schema } from 'mongoose';

export type TgiftListItem = {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: string;
    links: string[];
    selectedBy?: Schema.Types.ObjectId[] | string[];
    _id: Schema.Types.ObjectId | string;
};

export type TgiftListItemCensored = {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: String;
    links: string[];
    selectedBy?: Schema.Types.ObjectId[] | string[] | undefined;
    _id: Schema.Types.ObjectId | string;
};

export type TbasicListItem = {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: string;
    links: string[];
    selected?: boolean;
    _id: Schema.Types.ObjectId | string;
};

export type TbasicListItemCensored = {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: String;
    links: string[];
    selected?: boolean;
    _id: Schema.Types.ObjectId | string;
};

export type TnewListItemFields = {
    authorId: Schema.Types.ObjectId | string;
    body: String;
    links: string[];
};

export type TitemTypes = 'listItem' | 'secretListItem';

import { Schema } from 'mongoose';

export type TListItem = {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: string;
    links: string[];
    selectedBy?: Schema.Types.ObjectId[] | string[];
    _id: Schema.Types.ObjectId | string;
};

export type TListItemCensored = {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: String;
    links: string[];
    selectedBy?: Schema.Types.ObjectId[] | string[] | undefined;
    _id: Schema.Types.ObjectId | string;
};

export type TnewListItemFields = {
    authorId: Schema.Types.ObjectId | string;
    body: String;
    links: string[];
};

export type TitemTypes = 'listItem' | 'secretListItem';

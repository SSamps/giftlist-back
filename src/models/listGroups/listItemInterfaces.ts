import { Schema } from 'mongoose';

export interface IgiftListItem {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: string;
    links: string[];
    selectedBy?: Schema.Types.ObjectId[] | string[];
    _id: Schema.Types.ObjectId | string;
}

export interface IgiftListItemCensored {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: String;
    links: string[];
    selectedBy?: Schema.Types.ObjectId[] | string[] | undefined;
    _id: Schema.Types.ObjectId | string;
}

export interface IbasicListItem {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: string;
    links: string[];
    selected?: boolean;
    _id: Schema.Types.ObjectId | string;
}

export interface IbasicListItemCensored {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: String;
    links: string[];
    selected?: boolean;
    _id: Schema.Types.ObjectId | string;
}

export interface InewListItemFields {
    authorId: Schema.Types.ObjectId | string;
    body: String;
    links: string[];
}

export type TitemTypes = 'listItem' | 'secretListItem';

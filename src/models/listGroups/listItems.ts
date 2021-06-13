import { Schema } from 'mongoose';

export type TListItem = {
    authorId: Schema.Types.ObjectId | string;
    creationDate?: Date;
    body: String;
    link?: String;
    selectedBy?: Schema.Types.ObjectId[] | string[];
    _id: Schema.Types.ObjectId | string;
};

export type TnewListItemFields = {
    authorId: Schema.Types.ObjectId | string;
    body: String;
    link?: String;
};

export type TitemTypes = 'listItem' | 'secretListItem';

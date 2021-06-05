import { Document, Schema, model } from 'mongoose';
import { TlistGroupChildBase } from './ListGroupChild';
import { TlistGroupParentBase } from './ListGroupParent';
import { TlistGroupSingleBase } from './ListGroupSingle';
import { TYPE_PERM_ALL_LIST_GROUP } from './permissions/ListGroupPermissions';

export class invalidGroupVariantError extends Error {
    constructor(variant: string) {
        super(variant + ' is an invalid groupVariant');
        this.name = 'invalidGroupVariantError';
    }
}

export interface IgroupMemberBase {
    userId: Schema.Types.ObjectId | string;
    oldestReadMessage?: Date | undefined;
    permissions: TYPE_PERM_ALL_LIST_GROUP[];
}

export type TlistGroupBase = {
    groupName: string;
    creationDate?: Date;
};

export type TlistGroupAnyBase = TlistGroupSingleBase | TlistGroupChildBase | TlistGroupParentBase;
export type TlistGroupSingle = Document & TlistGroupSingleBase;
export type TlistGroupParent = Document & TlistGroupParentBase;
export type TlistGroupAny = Document & TlistGroupAnyBase;

export const ListGroupSchemaBase = new Schema({
    groupVariant: { type: String },
    owner: {
        userId: { type: Schema.Types.ObjectId },
        permissions: [{ type: String }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId },
            permissions: [{ type: String }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    parentGroupId: {
        type: Schema.Types.ObjectId,
    },
    groupName: { type: String },
    creationDate: { type: Date, default: Date.now },
});

const ListGroupBase = model<TlistGroupAny>('ListGroup', ListGroupSchemaBase);
export default ListGroupBase;

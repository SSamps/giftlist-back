import { Document, Schema, model } from 'mongoose';
import { TlistGroupChildBase } from './child/ListGroupChild';
import { TlistGroupParentBase } from './parent/ListGroupParent';
import { TbasicListFields } from './singular/BasicList';
import { TYPE_PERM_ALL_LIST_GROUP } from './permissions/ListGroupPermissions';
import { TgiftListFields } from './singular/GiftList';

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

export type TlistGroupDiscriminatorKey = {
    groupVariant: string;
};

export type TlistGroupAnyBase = TbasicListFields | TgiftListFields | TlistGroupChildBase | TlistGroupParentBase;
export type TlistGroupAny = Document & TlistGroupAnyBase & TlistGroupDiscriminatorKey;

const options = { discriminatorKey: 'groupVariant' };

export const ListGroupSchemaBase = new Schema(
    {
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
    },
    options
);

const ListGroupBase = model<TlistGroupAny>('ListGroup', ListGroupSchemaBase);
export default ListGroupBase;

import { Document, Schema, model } from 'mongoose';
import { TgiftGroupChildFields } from './child/GiftGroupChild';
import { TgiftGroupFields } from './parent/GiftGroup';
import { TbasicListFields } from './singular/BasicList';
import { TYPE_PERM_ALL_LIST_GROUP } from './permissions/ListGroupPermissions';
import { TgiftListFields } from './singular/GiftList';

export class invalidGroupVariantError extends Error {
    constructor(variant: string) {
        super(variant + ' is an invalid groupVariant');
        this.name = 'invalidGroupVariantError';
    }
}

export class invalidParentVariantError extends Error {
    constructor(childVariant: string, parentVariant: string) {
        super(childVariant + ' is an invalid child for the provided parent variant' + parentVariant);
        this.name = 'invalidParentVariantError';
    }
}

export interface IgroupMemberBase {
    userId: Schema.Types.ObjectId | string;
    oldestReadMessage?: Date | undefined;
    permissions: TYPE_PERM_ALL_LIST_GROUP[];
}

export type TlistGroupBaseFields = {
    groupName: string;
    creationDate?: Date;
};

type TlistGroupDiscriminatorKey = {
    groupVariant: string;
};

type TlistGroupAnyBase = TbasicListFields | TgiftListFields | TgiftGroupChildFields | TgiftGroupFields;
export type TlistGroupAny = Document & TlistGroupAnyBase & TlistGroupDiscriminatorKey;

const options = { discriminatorKey: 'groupVariant' };

const ListGroupBaseSchema = new Schema(
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

export const listGroupBaseModel = model<TlistGroupAny>('ListGroup', ListGroupBaseSchema);

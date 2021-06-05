import { Document, Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from '../ListGroupBase';
import { PERM_GIFT_GROUP_ALL, TYPE_PERM_GIFT_GROUP_ALL } from '../permissions/ListGroupPermissions';

// Define groupTypes which are parent groups
export const GIFT_GROUP = 'giftGroup';

type TYPE_LIST_GROUP_PARENT_VARIANTS = typeof GIFT_GROUP;

// Define other types and interfaces

export interface IgroupMemberParent extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_ALL[];
}

export type TlistGroupBaseExtensionParent = {
    owner: IgroupMemberParent;
    members?: [IgroupMemberParent];
    groupVariant: TYPE_LIST_GROUP_PARENT_VARIANTS;
};

export type TlistGroupParentBase = TlistGroupBase & TlistGroupBaseExtensionParent;
export type TlistGroupParent = Document & TlistGroupParentBase;

// Define schema

const ListGroupSchemaExtensionParent = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
});

const ListGroupParent = ListGroupSchemaBase.discriminator(GIFT_GROUP, ListGroupSchemaExtensionParent);

export default ListGroupParent;

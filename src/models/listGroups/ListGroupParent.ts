import { Document, Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from './ListGroup';
import { PERM_LIST_GROUP_PARENT, TYPE_PERM_LIST_GROUP_PARENT } from './permissions/ListGroupPermissions';

// Define groupTypes which are parent groups
export const PARENT_GIFT_GROUP = 'parentGiftGroup';

export const LIST_GROUP_PARENT_VARIANTS = [PARENT_GIFT_GROUP];
type TYPE_LIST_GROUP_PARENT_VARIANTS = typeof PARENT_GIFT_GROUP;

// Define other types and interfaces

export interface IgroupMemberParent extends IgroupMemberBase {
    permissions: TYPE_PERM_LIST_GROUP_PARENT[];
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
    groupVariant: { type: String, required: true, enum: LIST_GROUP_PARENT_VARIANTS },
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_LIST_GROUP_PARENT }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_LIST_GROUP_PARENT }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
});

const ListGroupParent = ListGroupSchemaBase.discriminator('ListGroupParent', ListGroupSchemaExtensionParent);

export default ListGroupParent;

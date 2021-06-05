import { Document, Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from '../ListGroupBase';
import { PERM_GIFT_GROUP_CHILD_ALL, TYPE_PERM_GIFT_GROUP_CHILD_ALL } from '../permissions/ListGroupPermissions';

// Define groupTypes which are child groups
export const GIFT_GROUP_CHILD = 'GIFT_GROUP_CHILD';

type TYPE_LIST_GROUP_CHILD_VARIANTS = typeof GIFT_GROUP_CHILD;

// Define other types and interfaces

export interface IgroupMemberChild extends IgroupMemberBase {
    permissions: TYPE_PERM_GIFT_GROUP_CHILD_ALL[];
}

export type TlistGroupBaseExtensionChild = {
    owner: IgroupMemberChild;
    members?: [IgroupMemberChild];
    groupVariant: TYPE_LIST_GROUP_CHILD_VARIANTS;
    parentGroupId: Schema.Types.ObjectId | string;
};

export type TlistGroupChildBase = TlistGroupBase & TlistGroupBaseExtensionChild;
export type TlistGroupChild = Document & TlistGroupChildBase;

// Define schema

const ListGroupSchemaExtensionChild = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_CHILD_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_CHILD_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    parentGroupId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
});

const ListGroupChild = ListGroupSchemaBase.discriminator(GIFT_GROUP_CHILD, ListGroupSchemaExtensionChild);

export default ListGroupChild;

import { Document, Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from './ListGroup';
import { PERM_LIST_GROUP_CHILD, TYPE_PERM_LIST_GROUP_CHILD } from './permissions/ListGroupPermissions';

// Define groupTypes which are child groups
const CHILD_GIFT_LIST = 'childGiftList';

export const CHILD_GROUP_TYPES = [CHILD_GIFT_LIST];
type TYPE_CHILD_GROUP_TYPES = typeof CHILD_GIFT_LIST;

// Define other types and interfaces

export interface IgroupMemberChild extends IgroupMemberBase {
    permissions: TYPE_PERM_LIST_GROUP_CHILD[];
}

export type TlistGroupBaseExtensionChild = {
    owner: IgroupMemberChild;
    members?: [IgroupMemberChild];
    groupType: TYPE_CHILD_GROUP_TYPES;
    parentGroupId: Schema.Types.ObjectId | string;
};

export type TlistGroupChildBase = TlistGroupBase & TlistGroupBaseExtensionChild;
export type TlistGroupChild = Document & TlistGroupChildBase;

// Define schema

const ListGroupSchemaExtensionChild = new Schema({
    groupType: { type: String, required: true, enum: CHILD_GROUP_TYPES },
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_LIST_GROUP_CHILD }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_LIST_GROUP_CHILD }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    parentGroupId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
});

const ListGroupChild = ListGroupSchemaBase.discriminator('ListGroupChild', ListGroupSchemaExtensionChild);

export default ListGroupChild;

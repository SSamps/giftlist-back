import { Document, Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from './ListGroup';
import { PERM_LIST_GROUP_SINGLE, TYPE_PERM_LIST_GROUP_SINGLE } from './permissions/ListGroupPermissions';

// Define groupTypes which are single groups
const BASIC_LIST = 'basicList';
const GIFT_LIST = 'giftList';

export const LIST_SINGLE_GROUP_TYPES = [BASIC_LIST, GIFT_LIST];
type TYPE_LIST_SINGLE_GROUP_TYPES = typeof BASIC_LIST | typeof GIFT_LIST;

// Define other types and interfaces

export interface IgroupMemberSingle extends IgroupMemberBase {
    permissions: TYPE_PERM_LIST_GROUP_SINGLE[];
}

export type TlistGroupBaseExtensionSingle = {
    owner: IgroupMemberSingle;
    members?: [IgroupMemberSingle];
    groupType: TYPE_LIST_SINGLE_GROUP_TYPES;
};

export type TlistGroupSingleBase = TlistGroupBase & TlistGroupBaseExtensionSingle;
export type TlistGroupSingle = Document & TlistGroupSingleBase;

// Define schema

const ListGroupSchemaExtensionSingle = new Schema({
    groupType: { type: String, required: true, enum: LIST_SINGLE_GROUP_TYPES },
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_LIST_GROUP_SINGLE }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_LIST_GROUP_SINGLE }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
});

const ListGroupSingle = ListGroupSchemaBase.discriminator('ListGroupSingle', ListGroupSchemaExtensionSingle);

export default ListGroupSingle;

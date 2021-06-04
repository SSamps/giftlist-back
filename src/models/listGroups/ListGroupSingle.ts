import { Document, Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from './ListGroup';
import { PERM_LIST_GROUP_SINGLE, TYPE_PERM_LIST_GROUP_SINGLE } from './permissions/ListGroupPermissions';

// Define groupTypes which are single groups
export const BASIC_LIST = 'basicList';
export const GIFT_LIST = 'giftList';

export const LIST_GROUP_SINGLE_VARIANTS = [BASIC_LIST, GIFT_LIST];
type TYPE_LIST_GROUP_SINGLE_VARIANTS = typeof BASIC_LIST | typeof GIFT_LIST;

// Define other types and interfaces

export interface IgroupMemberSingle extends IgroupMemberBase {
    permissions: TYPE_PERM_LIST_GROUP_SINGLE[];
}

export type TlistGroupBaseExtensionSingle = {
    owner: IgroupMemberSingle;
    members?: [IgroupMemberSingle];
    groupVariant: TYPE_LIST_GROUP_SINGLE_VARIANTS;
};

export type TlistGroupSingleBase = TlistGroupBase & TlistGroupBaseExtensionSingle;
export type TlistGroupSingle = Document & TlistGroupSingleBase;

// Define schema

const ListGroupSchemaExtensionSingle = new Schema({
    groupVariant: { type: String, required: true, enum: LIST_GROUP_SINGLE_VARIANTS },
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

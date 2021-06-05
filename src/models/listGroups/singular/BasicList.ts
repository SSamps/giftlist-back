import { Schema } from 'mongoose';
import ListGroupSchemaBase, { IgroupMemberBase, TlistGroupBase } from '../ListGroupBase';
import { PERM_BASIC_LIST_ALL, TYPE_PERM_BASIC_LIST_ALL } from '../permissions/ListGroupPermissions';

export const BASIC_LIST = 'basicList';

export interface IgroupMemberBasicList extends IgroupMemberBase {
    permissions: TYPE_PERM_BASIC_LIST_ALL[];
}

export type TbasicListExtensionFields = {
    owner: IgroupMemberBasicList;
    members?: [IgroupMemberBasicList];
    maxListItems?: Number;
};

export type TbasicListFields = TlistGroupBase & TbasicListExtensionFields;

export const BasicListSchema = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_BASIC_LIST_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_BASIC_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    maxListItems: { type: Number, required: true, default: 50 },
});
export const basicListModel = ListGroupSchemaBase.discriminator(BASIC_LIST, BasicListSchema);

import { Schema } from 'mongoose';
import { IgroupMemberBase, listGroupBaseModel, TlistGroupBaseFields } from '../ListGroupBase';
import { PERM_BASIC_LIST_ALL, TYPE_PERM_BASIC_LIST_ALL } from '../permissions/ListGroupPermissions';

export const BASIC_LIST = 'BASIC_LIST';

export interface IbasicListMember extends IgroupMemberBase {
    permissions: TYPE_PERM_BASIC_LIST_ALL[];
}

export type TbasicListExtraFields = {
    owner: IbasicListMember;
    members?: [IbasicListMember];
    maxListItems?: Number;
};

export type TbasicListFields = TlistGroupBaseFields & TbasicListExtraFields;

export const basicListSchema = new Schema({
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
export const BasicListModel = listGroupBaseModel.discriminator(BASIC_LIST, basicListSchema);

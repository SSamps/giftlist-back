import { Document, Schema, model } from 'mongoose';
import { PERM_ALL_LIST_GROUP, TYPE_PERM_ALL_LIST_GROUP } from './permissions/ListGroupPermissions';

export const SINGLE_GROUP_TYPES = ['basicList', 'giftList'];
export const PARENT_GROUP_TYPES = ['parentGiftGroup'];
export const CHILD_GROUP_TYPES = ['childGiftList'];

export const ALL_GROUP_TYPES = SINGLE_GROUP_TYPES.concat(CHILD_GROUP_TYPES, PARENT_GROUP_TYPES);

export interface IgroupMember {
    userId: Schema.Types.ObjectId | string;
    permissions: TYPE_PERM_ALL_LIST_GROUP[];
    oldestReadMessage?: Date | undefined;
}

export type TlistGroupSingleBase = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'basicList' | 'giftList';
    groupName: string;
    creationDate?: Date;
};

export type TlistGroupParentBase = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'parentGiftGroup';
    groupName: string;
    creationDate?: Date;
};

export type TlistGroupChildBase = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'childGiftList';
    groupName: string;
    creationDate?: Date;
    parentGroupId: Schema.Types.ObjectId | string;
};

export type TlistGroupAnyBase = TlistGroupSingleBase | TlistGroupChildBase | TlistGroupParentBase;
export type TlistGroupSingle = Document & TlistGroupSingleBase;
export type TlistGroupParent = Document & TlistGroupParentBase;
export type TlistGroupChild = Document & TlistGroupChildBase;
export type TlistGroupAny = Document & TlistGroupAnyBase;

export const ListGroupSchema = new Schema({
    groupType: { type: String, required: true, enum: ALL_GROUP_TYPES },
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: PERM_ALL_LIST_GROUP }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: PERM_ALL_LIST_GROUP }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    groupName: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    parentGroupId: {
        type: Schema.Types.ObjectId,
        required: function (this: TlistGroupChildBase) {
            return this.groupType === 'childGiftList';
        },
    },
});

const ListGroup = model<TlistGroupAny>('ListGroup', ListGroupSchema);
export default ListGroup;

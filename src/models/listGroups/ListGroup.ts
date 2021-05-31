import { Document, Schema, model } from 'mongoose';
import { TlistGroupChildBase } from './ListGroupChild';
import { TlistGroupParentBase } from './ListGroupParent';
import { TlistGroupSingleBase } from './ListGroupSingle';

// export const ALL_GROUP_TYPES = SINGLE_GROUP_TYPES.concat(CHILD_GROUP_TYPES, PARENT_GROUP_TYPES);

export interface IgroupMemberBase {
    userId: Schema.Types.ObjectId | string;
    oldestReadMessage?: Date | undefined;
}

export type TlistGroupBase = {
    groupName: string;
    creationDate?: Date;
};

export type TlistGroupAnyBase = TlistGroupSingleBase | TlistGroupChildBase | TlistGroupParentBase;
export type TlistGroupSingle = Document & TlistGroupSingleBase;
export type TlistGroupParent = Document & TlistGroupParentBase;
export type TlistGroupAny = Document & TlistGroupAnyBase;

export const ListGroupSchemaBase = new Schema({
    groupName: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
});

const ListGroup = model<TlistGroupAny>('ListGroup', ListGroupSchemaBase);
export default ListGroup;

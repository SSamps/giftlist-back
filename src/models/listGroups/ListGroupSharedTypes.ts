import { Schema } from 'mongoose';
import { CHILD_GROUP_TYPES, TlistGroupChildBase } from './ListGroupChild';
import { PARENT_GROUP_TYPES, TlistGroupParentBase } from './ListGroupParent';
import { SINGLE_GROUP_TYPES, TlistGroupSingleBase } from './ListGroupSingle';

export type TlistGroupAnyBase = TlistGroupSingleBase | TlistGroupChildBase | TlistGroupParentBase;
export type TlistGroupAny = Document & TlistGroupAnyBase;

export const ALL_GROUP_TYPES = SINGLE_GROUP_TYPES.concat(CHILD_GROUP_TYPES, PARENT_GROUP_TYPES);

export interface IgroupMember {
    userId: Schema.Types.ObjectId | string;
    oldestReadMessage?: Date | undefined;
}

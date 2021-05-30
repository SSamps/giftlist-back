import { Schema, model, Document } from 'mongoose';
import { IgroupMember } from './ListGroupSharedTypes';

export const PARENT_GROUP_TYPES = ['parentGiftGroup'];

export type TlistGroupParentBase = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'basicList' | 'giftList' | 'giftGroup';
    groupName: string;
    creationDate?: Date;
};

type TlistGroupParent = Document & TlistGroupParentBase;

export const ListGroupParentSchema = new Schema({
    owner: {
        userId: { type: Schema.Types.ObjectId, required: true },
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            oldestUnreadMsg: { type: Date },
        },
    ],
    groupType: { type: String, required: true, enum: PARENT_GROUP_TYPES },
    groupName: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
});

const ListGroupParent = model<TlistGroupParent>('ListGroupParent', ListGroupParentSchema);
export default ListGroupParent;

import { Document, Schema, model } from 'mongoose';
import { IgroupMember } from './ListGroupSharedTypes';

export const SINGLE_GROUP_TYPES = ['basicList', 'giftList'];

export type TlistGroupSingleBase = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'basicList' | 'giftList';
    groupName: string;
    creationDate?: Date;
};

export type TlistGroupSingle = Document & TlistGroupSingleBase;

export const ListGroupSingleSchema = new Schema({
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
    groupType: { type: String, required: true, enum: SINGLE_GROUP_TYPES },
    groupName: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
});

const ListGroupSingle = model<TlistGroupSingle>('ListGroupSingle', ListGroupSingleSchema);
export default ListGroupSingle;

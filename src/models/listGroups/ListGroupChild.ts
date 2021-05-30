import { Schema, model, Document } from 'mongoose';
import { IgroupMember } from './ListGroupSharedTypes';

export const CHILD_GROUP_TYPES = ['childGiftList'];

export type TlistGroupChildBase = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'childGiftList';
    groupName: string;
    creationDate?: Date;
    parentGroupId: Schema.Types.ObjectId | string;
};

type TlistGroupChild = Document & TlistGroupChildBase;

export const ListGroupChildSchema = new Schema({
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
    groupType: { type: String, required: true, enum: CHILD_GROUP_TYPES },
    groupName: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    parentGroupId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
});

const ListGroupChild = model<TlistGroupChild>('ListGroupChild', ListGroupChildSchema);
export default ListGroupChild;

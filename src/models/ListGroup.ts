import { Document, Schema, model } from 'mongoose';

export const GROUP_TYPES = ['basicList', 'giftList', 'giftGroup', 'childGiftList'];
export const CHILD_GROUP_TYPES = ['childGiftList'];

export interface IgroupMember {
    userId: Schema.Types.ObjectId | string;
    oldestReadMessage?: Date | undefined;
}

type TlistGroupReg = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'basicList' | 'giftList' | 'giftGroup';
    groupName: string;
    creationDate?: Date;
};

type TlistGroupChild = {
    owner: IgroupMember;
    members?: [IgroupMember];
    groupType: 'childGiftList';
    groupName: string;
    creationDate?: Date;
    parentGroupId: Schema.Types.ObjectId | string;
};

export type TlistGroupBase = TlistGroupReg | TlistGroupChild;
export type TlistGroup = Document & TlistGroupBase;

export const ListGroupSchema = new Schema({
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
    groupType: { type: String, required: true, enum: GROUP_TYPES },
    groupName: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    parentGroupId: {
        type: Schema.Types.ObjectId,
        required: function (this: TlistGroup) {
            return this.groupType === 'childGiftList';
        },
    },
});

const ListGroup = model<TlistGroup>('ListGroup', ListGroupSchema);
export default ListGroup;

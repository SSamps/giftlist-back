import { Document, Schema } from 'mongoose';
import ListGroupSchemaBase, { TlistGroupBase } from './ListGroup';

export type TlistGroupBaseExtensionChild = {
    parentGroupId: Schema.Types.ObjectId | string;
};

export type TlistGroupChildBase = TlistGroupBase & TlistGroupBaseExtensionChild;
export type TlistGroupChild = Document & TlistGroupChildBase;

const ListGroupSchemaExtensionChild = new Schema({
    parentGroupId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
});

const ListGroupChild = ListGroupSchemaBase.discriminator('ListGroupChild', ListGroupSchemaExtensionChild);

export default ListGroupChild;

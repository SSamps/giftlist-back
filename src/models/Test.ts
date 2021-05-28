import { Document, Schema, model } from 'mongoose';

export interface ItestData extends Document {
    user: string;
    testData: [{ testVar: string }];
}

export const TestSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    },
    testData: [
        {
            testVar: {
                type: String,
                required: true,
            },
        },
    ],
});

const Test = model<ItestData>('Test', TestSchema);
export default Test;

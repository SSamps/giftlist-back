import { Document, Schema, model } from 'mongoose';

export interface IUserCensoredProps {
    displayName: string;
    email: string;
    registrationDate: Date;
    _id: Schema.Types.ObjectId;
    verified: Boolean;
}

export interface IUserProps {
    displayName: string;
    email: string;
    password: string;
    registrationDate: Date;
    oldestValidJWT?: Date;
    _id: Schema.Types.ObjectId;
    verified: Boolean;
}

export interface IUser extends Document {
    displayName: string;
    email: string;
    password: string;
    registrationDate: Date;
    oldestValidJWT?: Date;
    verified: Boolean;
    _id: Schema.Types.ObjectId;
}

export const UserSchema = new Schema({
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registrationDate: {
        type: Date,
        default: () => {
            return new Date();
        },
    },
    oldestValidJWT: {
        type: Date,
        default: () => {
            return new Date();
        },
    },
    verified: { type: Boolean, default: false },
});

export const UserModel = model<IUser>('User', UserSchema);

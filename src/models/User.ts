import { Document, Schema, model } from 'mongoose';

export interface IUserCensoredProps {
    displayName?: string;
    email?: string;
    registrationDate?: Date;
    _id?: string;
}

export interface IUserProps {
    displayName: string;
    email: string;
    password: string;
    registrationDate: Date;
    oldestValidJWT?: Date;
    _id: string;
}

export interface IUser extends Document {
    displayName: string;
    email: string;
    password: string;
    registrationDate: Date;
    oldestValidJWT?: Date;
}

export const UserSchema = new Schema({
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registrationDate: { type: Date, default: Date.now },
    oldestValidJWT: { type: Date, default: Date.now },
});

const User = model<IUser>('User', UserSchema);
export default User;

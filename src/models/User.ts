import { Document, Schema, model } from 'mongoose';
import {
    VALIDATION_USER_DISPLAY_NAME_MAX_LENGTH,
    VALIDATION_USER_DISPLAY_NAME_MIN_LENGTH,
    VALIDATION_USER_EMAIL_MAX_LENGTH,
    VALIDATION_USER_EMAIL_MIN_LENGTH,
    VALIDATION_USER_PASSWORD_MAX_LENGTH,
    VALIDATION_USER_PASSWORD_MIN_LENGTH,
} from './validation';

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
    displayName: {
        type: String,
        required: true,
        minlength: VALIDATION_USER_DISPLAY_NAME_MIN_LENGTH,
        maxlength: VALIDATION_USER_DISPLAY_NAME_MAX_LENGTH,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: VALIDATION_USER_EMAIL_MIN_LENGTH,
        maxlength: VALIDATION_USER_EMAIL_MAX_LENGTH,
    },
    password: {
        type: String,
        required: true,
        minlength: VALIDATION_USER_PASSWORD_MIN_LENGTH,
        maxlength: VALIDATION_USER_PASSWORD_MAX_LENGTH,
    },
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

import express from 'express';
import { IUserCensoredProps } from '../../models/User';

declare global {
    namespace Express {
        interface Request {
            user?: IUserCensoredProps;
        }
    }
}

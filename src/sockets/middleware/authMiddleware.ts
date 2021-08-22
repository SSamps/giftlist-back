import jwt from 'jsonwebtoken';
import { IUserCensoredProps, UserModel } from '../../models/User';
import { Socket } from 'socket.io/dist/socket';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ExtendedError } from 'socket.io/dist/namespace';

interface IauthToken {
    alg: string;
    typ: string;
    user: { id: string };
    iat: number;
    exp: number;
}

export const socketAuthMiddleware = async (
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>,
    next: (err?: ExtendedError | undefined) => void
) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        console.log('no token');
        next(new Error('Unauthorized: missing x-auth-token'));
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as IauthToken;

        // Check whether the token was issued before oldestValidJWT was last set. This could be used to invalidate user tokens if required. Also protects against tokens being used after user deletion.
        try {
            var foundUser = await UserModel.findById(decoded.user.id).select('-password');
        } catch (err) {
            next(new Error('Server Error'));
            return;
        }

        if (!foundUser) {
            next(new Error('User not found'));
            return;
        }

        const oldestValidJWT = foundUser.oldestValidJWT;
        // Add one second to iat as it is rounded down to the nearest second when set while oldestValidJWT was not
        const tokenDate = new Date((decoded.iat + 1) * 1000);

        if (tokenDate < (oldestValidJWT as Date)) {
            next(new Error('Unauthorized'));
            return;
        }

        if (!foundUser.verified) {
            next(new Error('You have not verified your email'));
            return;
        }

        var user: IUserCensoredProps = {
            _id: foundUser._id,
            displayName: foundUser.displayName,
            email: foundUser.email,
            registrationDate: foundUser.registrationDate,
            verified: foundUser.verified,
        };

        socket.data.user = user;
        next();
    } catch (err) {
        console.error(err.message);
        next(new Error('Unauthorized'));
        return;
    }
};

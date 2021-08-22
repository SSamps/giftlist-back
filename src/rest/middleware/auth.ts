import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { IUserCensoredProps, UserModel } from '../../models/User';

interface IauthToken {
    alg: string;
    typ: string;
    user: { id: string };
    iat: number;
    exp: number;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // Get token from header
    const token = req.header('x-auth-token');
    // Check if not token
    if (!token) {
        console.log('no token');
        return res.status(401).json({ msg: 'Unauthorized: missing x-auth-token' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as IauthToken;

        // Check whether the token was issued before oldestValidJWT was last set. This could be used to invalidate user tokens if required. Also protects against tokens being used after user deletion.
        try {
            var foundUser = await UserModel.findById(decoded.user.id).select('-password');
        } catch (err) {
            return res.status(500).json({ msg: 'Server Error' });
        }

        if (!foundUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const oldestValidJWT = foundUser.oldestValidJWT;
        // Add one second to iat as it is rounded down to the nearest second when set while oldestValidJWT was not
        const tokenDate = new Date((decoded.iat + 1) * 1000);

        if (tokenDate < (oldestValidJWT as Date)) {
            console.log('invalidated token');
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        if (!foundUser.verified) {
            return res.status(401).json({ msg: 'User not verified' });
        }

        var user: IUserCensoredProps = {
            _id: foundUser._id,
            displayName: foundUser.displayName,
            email: foundUser.email,
            registrationDate: foundUser.registrationDate,
            verified: foundUser.verified,
        };

        req.user = user;
        next();
    } catch (err) {
        console.error(err.message);
        return res.status(401).json({ msg: 'Unauthorized' });
    }
}

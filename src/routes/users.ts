import express, { Router, Request, Response } from 'express';
import { check, validationResult, Result, ValidationError } from 'express-validator';
import { Schema } from 'mongoose';
import { IUserCensoredProps, IUser, IUserProps, UserModel } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendgrid from '@sendgrid/mail';
import { unverifiedUserAuthMiddleware } from '../middleware/verificationAuth';
import { listGroupBaseModel } from '../models/listGroups/ListGroupBase';
import { PERM_GROUP_DELETE } from '../models/listGroups/permissions/listGroupPermissions';

import { GiftGroupModel } from '../models/listGroups/discriminators/parent/GiftGroup';
import { authMiddleware } from '../middleware/auth';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
const router: Router = express.Router();

interface IverificationToken {
    alg: string;
    typ: string;
    senderName: string;
    newUserId: string;
    iat: number;
    exp: number;
}

async function sendVerificationEmail(newUserId: Schema.Types.ObjectId, email: string, displayName: string) {
    const payload = { newUserId: newUserId };
    const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

    const verifyBaseLink = 'https://giftlist.sampsy.dev/verify/';
    const verifyLink = verifyBaseLink + token;

    const msg = {
        //TODO change this to use the supplied email
        to: 'simonjsampson@gmail.com',
        from: {
            name: 'GiftList',
            email: 'welcome.giftlist@sampsy.dev',
        },
        templateId: 'd-965b63e57066478db17d0c6ae5f1203b',
        dynamic_template_data: {
            displayName: displayName,
            verifyLink: verifyLink,
        },
    };
    await sendgrid.send(msg);

    return;
}

// TODO improve validation of user display name, email
// @route POST api/users
// @desc Register a new user
// @access Public
router.post(
    '/',
    check('displayName', 'Display name is required').not().isEmpty(),
    check('email', 'Please include a valid email').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please provide a password with 8 or more characters').isLength({ min: 8 }),
    async (req: Request, res: Response) => {
        console.log('POST api/users hit');
        const errors: Result<ValidationError> = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { displayName, email, password }: IUserProps = req.body;

        try {
            // See if user already exists in the database

            let foundUser = await UserModel.findOne({ email });
            if (foundUser) {
                return res.status(400).json({ errors: [{ msg: 'An account already exists with that email address' }] });
            }

            // Encrypt the password

            const salt: string = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);

            // Create a new user

            const newUser: IUser = new UserModel({
                displayName,
                email,
                password,
            });

            // Add the user to the database

            await newUser.save();

            // Send a verification email

            sendVerificationEmail(newUser._id, email, displayName);

            // Return a jwt
            const payload = {
                user: {
                    id: newUser.id,
                },
            };

            var user: IUserCensoredProps = {
                _id: newUser.id,
                displayName: displayName,
                email: email,
                registrationDate: newUser.registrationDate,
                verified: newUser.verified,
            };

            // TODO reduce lifetime of token on release
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1w' }, (err, token) => {
                if (err) throw err;
                return res.json({ token, user });
            });
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route POST api/users/sendverification
// @desc Send a verification email
// @access Private
router.post('/sendverification', unverifiedUserAuthMiddleware, async (req: Request, res: Response) => {
    console.log('POST api/users/sendverification hit');
    try {
        await sendVerificationEmail(req.user._id, req.user.email, req.user.displayName);
        console.log('sending response to user');
        return res.send(200);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route POST api/users/verify/:verificationtoken
// @desc Verify a new user
// @access Public
router.post('/verify/:verificationtoken', async (req: Request, res: Response) => {
    console.log('POST api/users/verify/:verificationtoken hit');

    const verificationToken = req.params.verificationtoken;

    try {
        const decodedVerificationToken = jwt.verify(verificationToken, process.env.JWT_SECRET) as IverificationToken;
        const { newUserId } = decodedVerificationToken;

        const verifiedUser = await UserModel.findByIdAndUpdate(newUserId, { verified: true });

        if (!verifiedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        return res.send(200);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route DELETE api/users/
// @desc Delete a user and all their content
// @access Private
router.delete('/', unverifiedUserAuthMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE api/users/ hit');

    const userId = req.user._id;

    try {
        // delete user and groups
        // TODO delete listitems & messages (or do something else with them)

        let foundOwnedParentGroups = await GiftGroupModel.find({
            'owner.userId': userId,
            'owner.permissions': PERM_GROUP_DELETE,
        });

        for (var i = 0; i < foundOwnedParentGroups.length; i++) {
            let parentId = foundOwnedParentGroups[i].id;
            await listGroupBaseModel.deleteMany({ $or: [{ parentGroupId: parentId }, { _id: parentId }] });
        }

        await listGroupBaseModel.deleteMany({
            'owner.userId': userId,
            'owner.permissions': PERM_GROUP_DELETE,
        });

        await UserModel.findByIdAndDelete(userId);

        return res.status(200).json();
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route PUT api/users/
// @desc Update a user's display name
// @access Private
router.put(
    '/',
    authMiddleware,
    check('displayName', 'Display name is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('PUT api/users/ hit');
        try {
            const userId = req.user._id;
            const { displayName } = req.body;

            await UserModel.findByIdAndUpdate(userId, { displayName: displayName });

            return res.status(200).send();
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error: ' + err.message);
        }
    }
);

module.exports = router;

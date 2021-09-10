import express, { Router, Request, Response } from 'express';
import { check, validationResult, Result, ValidationError } from 'express-validator';
import { Schema } from 'mongoose';
import { IUserCensoredProps, IUser, IUserProps, UserModel } from '../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendgrid from '@sendgrid/mail';
import { unverifiedUserAuthMiddleware } from '../middleware/verificationAuth';
import { ListGroupBaseModel } from '../../models/listGroups/ListGroupBaseModel';
import { PERM_GROUP_OWNER } from '../../models/listGroups/listGroupPermissions';
import { authMiddleware } from '../middleware/auth';
import {
    deleteGroupAndAnyChildGroups,
    findUserInGroup,
    formatValidatorErrArrayAsMsgString,
    leaveGiftGroup,
    removeMemberFromGiftListsOrGiftGroupChildren,
} from '../../misc/helperFunctions';
import {
    VALIDATION_USER_DISPLAY_NAME_MAX_LENGTH,
    VALIDATION_USER_DISPLAY_NAME_MIN_LENGTH,
    VALIDATION_USER_EMAIL_MAX_LENGTH,
    VALIDATION_USER_EMAIL_MIN_LENGTH,
    VALIDATION_USER_PASSWORD_MAX_LENGTH,
    VALIDATION_USER_PASSWORD_MIN_LENGTH,
    VALIDATION_USER_PASSWORD_MIN_LOWERCASE,
    VALIDATION_USER_PASSWORD_MIN_NUMBER,
    VALIDATION_USER_PASSWORD_MIN_SYMBOL,
    VALIDATION_USER_PASSWORD_MIN_UPPERCASE,
} from '../../models/validation';
import { BASIC_LIST, GIFT_GROUP, GIFT_LIST } from '../../models/listGroups/variants/listGroupVariants';
import { UserMessageModel } from '../../models/messages/variants/discriminators/UserMessageModel';

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
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '6h' });

    const verifyBaseLink = 'https://giftlist.sampsy.dev/verify/';
    const verifyLink = verifyBaseLink + token;

    const msg = {
        to: email,
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

// @route POST api/users
// @desc Register a new user
// @access Public
router.post(
    '/',
    check(
        'displayName',
        `Please supply a display name between ${VALIDATION_USER_DISPLAY_NAME_MIN_LENGTH} and ${VALIDATION_USER_DISPLAY_NAME_MAX_LENGTH} characters long.`
    )
        .not()
        .isEmpty()
        .isString()
        .isLength({ min: VALIDATION_USER_DISPLAY_NAME_MIN_LENGTH, max: VALIDATION_USER_DISPLAY_NAME_MAX_LENGTH }),
    check(
        'password',
        `Passwords must be between ${VALIDATION_USER_PASSWORD_MIN_LENGTH} and ${VALIDATION_USER_PASSWORD_MAX_LENGTH} characters with at least ${VALIDATION_USER_PASSWORD_MIN_UPPERCASE} uppercase, ${VALIDATION_USER_PASSWORD_MIN_LOWERCASE} lowercase and ${VALIDATION_USER_PASSWORD_MIN_NUMBER} number.`
    )
        .not()
        .isEmpty()
        .isLength({ max: VALIDATION_USER_PASSWORD_MAX_LENGTH })
        .isStrongPassword({
            minLength: VALIDATION_USER_PASSWORD_MIN_LENGTH,
            minLowercase: VALIDATION_USER_PASSWORD_MIN_LOWERCASE,
            minUppercase: VALIDATION_USER_PASSWORD_MIN_UPPERCASE,
            minNumbers: VALIDATION_USER_PASSWORD_MIN_NUMBER,
            minSymbols: VALIDATION_USER_PASSWORD_MIN_SYMBOL,
        }),
    check(
        'email',
        `Please supply an email between ${VALIDATION_USER_EMAIL_MIN_LENGTH} and ${VALIDATION_USER_EMAIL_MAX_LENGTH} characters long.`
    )
        .not()
        .isEmpty()
        .isEmail()
        .isLength({ min: VALIDATION_USER_EMAIL_MIN_LENGTH, max: VALIDATION_USER_EMAIL_MAX_LENGTH }),

    async (req: Request, res: Response) => {
        console.log('POST api/users hit');
        const errors: Result<ValidationError> = validationResult(req);

        if (!errors.isEmpty()) {
            const errMsg = formatValidatorErrArrayAsMsgString(errors.array());
            return res.status(400).send('Error:' + errMsg);
        }

        let { displayName, email, password }: IUserProps = req.body;

        try {
            // See if user already exists in the database

            let foundUser = await UserModel.findOne({ email });
            if (foundUser) {
                return res.status(400).send('Error: An account already exists with that email address');
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

            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) throw err;
                return res.json({ token, user });
            });
        } catch (err) {
            console.error('Error inside POST api/users: ' + err.message);
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
        return res.sendStatus(200);
    } catch (err) {
        console.error('Error inside POST api/users/sendverification: ' + err.message);
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
            return res.status(404).send('Error: User not found');
        }

        return res.send(200);
    } catch (err) {
        console.error('Error inside POST api/users/verify/:verificationtoken: ' + err.message);
        return res.status(500).send('Server error');
    }
});

// TODO: Also post a system message to chats
// @route DELETE api/users/
// @desc Delete a user and all their content
// @access Private
router.delete('/', unverifiedUserAuthMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE api/users/ hit');

    const userId = req.user._id;
    const userDisplayName = req.user.displayName;

    try {
        const foundGroups = await ListGroupBaseModel.find({ 'members.userId': userId });

        let ownedGroups = [];
        let memberGroups = [];

        for (let group of foundGroups) {
            let foundUser = findUserInGroup(group, userId);

            if (foundUser?.permissions.includes(PERM_GROUP_OWNER)) {
                ownedGroups.push(group);
            } else {
                memberGroups.push(group);
            }
        }

        if (ownedGroups.length > 0) {
            for (let group of ownedGroups) {
                await deleteGroupAndAnyChildGroups(group);
            }
        }

        const basicListIds = [];
        const giftListIds = [];
        const giftGroupIds = [];
        if (memberGroups.length > 0) {
            for (const group of memberGroups) {
                if (group.groupVariant === BASIC_LIST) {
                    basicListIds.push(group._id);
                } else if (group.groupVariant === GIFT_LIST) {
                    giftListIds.push(group._id);
                } else if (group.groupVariant === GIFT_GROUP) {
                    giftGroupIds.push(group._id);
                }
            }

            if (basicListIds.length > 0) {
                await ListGroupBaseModel.updateMany(
                    { _id: { $in: basicListIds } },
                    { $pull: { members: { userId: userId } } }
                );
            }

            if (giftListIds.length > 0) {
                removeMemberFromGiftListsOrGiftGroupChildren(GIFT_LIST, giftListIds, userId, userDisplayName);
            }

            for (const groupId of giftGroupIds) {
                leaveGiftGroup(groupId, userId, userDisplayName);
            }
        }

        await UserModel.findByIdAndDelete(userId);

        return res.status(200).send();
    } catch (err) {
        console.error('Error inside DELETE api/users/: ' + err.message);
        return res.status(500).send('Internal server error');
    }
});

// @route PUT api/users/
// @desc Update a user's display name
// @access Private
router.put(
    '/',
    authMiddleware,
    check(
        'displayName',
        `Display name must be between ${VALIDATION_USER_DISPLAY_NAME_MIN_LENGTH} and ${VALIDATION_USER_DISPLAY_NAME_MAX_LENGTH} characters long.`
    )
        .not()
        .isEmpty()
        .isString()
        .isLength({ min: VALIDATION_USER_DISPLAY_NAME_MIN_LENGTH, max: VALIDATION_USER_DISPLAY_NAME_MAX_LENGTH }),
    async (req: Request, res: Response) => {
        console.log('PUT api/users/ hit');
        try {
            const tokenUserId = req.user._id;
            const { displayName } = req.body;

            const updatedUser = await UserModel.findByIdAndUpdate(
                tokenUserId,
                { displayName: displayName },
                { new: true }
            );
            if (!updatedUser) {
                return res.status(500).send('Server error');
            }
            await ListGroupBaseModel.updateMany(
                {
                    'members.userId': tokenUserId,
                },
                { 'members.$[member].displayName': displayName },
                { arrayFilters: [{ 'member.userId': tokenUserId }] }
            );

            await UserMessageModel.updateMany({ authorId: tokenUserId }, { authorName: displayName });

            let user: IUserCensoredProps = {
                _id: updatedUser._id,
                displayName: updatedUser.displayName,
                email: updatedUser.email,
                registrationDate: updatedUser.registrationDate,
                verified: updatedUser.verified,
            };

            return res.status(200).json(user);
        } catch (err) {
            console.error('Error inside PUT api/users/: ' + err.message);
            return res.status(500).send('Server error: ' + err.message);
        }
    }
);

interface IpasswordResetToken {
    alg: string;
    typ: string;
    userIdRequestingPassReset: string;
    iat: number;
    exp: number;
}

// @route POST api/users/resetpassword
// @desc Request a password reset email
// @access Private
router.post(
    '/resetpassword',
    check('email', 'email is required').not().isEmpty().isEmail(),
    async (req: Request, res: Response) => {
        console.log('POST api/users/resetpassword hit');

        const errors: Result<ValidationError> = validationResult(req);

        if (!errors.isEmpty()) {
            const errMsg = formatValidatorErrArrayAsMsgString(errors.array());
            return res.status(400).send('Error:' + errMsg);
        }

        const reqEmail = req.body.email;

        try {
            const foundUser = await UserModel.findOne({ email: reqEmail });

            if (!foundUser) {
                return res.status(400).send('Error: We could not find an account with that email address.');
            }

            const payload = {
                userIdRequestingPassReset: foundUser._id,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });

            const passwordResetBaseLink = 'https://giftlist.sampsy.dev/resetpassword/';
            const passwordResetLink = passwordResetBaseLink + token;

            const msg = {
                to: foundUser.email,
                from: {
                    name: 'GiftList',
                    email: 'recovery.giftlist@sampsy.dev',
                },
                templateId: 'd-077bcbf43c8148c7a119f24b9b231acc',
                dynamic_template_data: {
                    displayName: foundUser.displayName,
                    passwordResetLink: passwordResetLink,
                },
            };

            await sendgrid.send(msg);
            return res.send(200);
        } catch (err) {
            console.error('Error inside POST api/users/resetpassword: ' + err.message);
            return res.send(500);
        }
    }
);

// @route POST api/users/resetpassword/:token
// @desc Reset a password using a token from an email
// @access Private
router.post(
    '/resetpassword/:token',
    check(
        'password',
        `Passwords must be between ${VALIDATION_USER_PASSWORD_MIN_LENGTH} and ${VALIDATION_USER_PASSWORD_MAX_LENGTH} characters with at least ${VALIDATION_USER_PASSWORD_MIN_UPPERCASE} uppercase, ${VALIDATION_USER_PASSWORD_MIN_LOWERCASE} lowercase and ${VALIDATION_USER_PASSWORD_MIN_NUMBER} number.`
    )
        .not()
        .isEmpty()
        .isLength({ max: VALIDATION_USER_PASSWORD_MAX_LENGTH })
        .isStrongPassword({
            minLength: VALIDATION_USER_PASSWORD_MIN_LENGTH,
            minLowercase: VALIDATION_USER_PASSWORD_MIN_LOWERCASE,
            minUppercase: VALIDATION_USER_PASSWORD_MIN_UPPERCASE,
            minNumbers: VALIDATION_USER_PASSWORD_MIN_NUMBER,
            minSymbols: VALIDATION_USER_PASSWORD_MIN_SYMBOL,
        }),
    async (req: Request, res: Response) => {
        console.log('POST api/users/resetpassword/:token hit');

        const errors: Result<ValidationError> = validationResult(req);

        if (!errors.isEmpty()) {
            const errMsg = formatValidatorErrArrayAsMsgString(errors.array({ onlyFirstError: true }));
            return res.status(400).send('Error:' + errMsg);
        }

        const resetToken = req.params.token;
        const password = req.body.password;

        let decodedResetToken;

        try {
            decodedResetToken = jwt.verify(resetToken, process.env.JWT_SECRET) as IpasswordResetToken;
        } catch (err) {
            if (err.message) {
                return res.status(400).send(err.message);
            } else {
                return res.send(500);
            }
        }

        const { userIdRequestingPassReset } = decodedResetToken;

        try {
            var foundUser = await UserModel.findById(userIdRequestingPassReset);

            if (!foundUser) {
                return res.status(400).send('Error: User not found');
            }

            const salt: string = await bcrypt.genSalt(10);
            const newPassword = await bcrypt.hash(password, salt);

            foundUser.password = newPassword;

            await foundUser.save();

            return res.send(200);
        } catch (err) {
            console.error('Error inside POST api/users/resetpassword/:token: ' + err.message);
            return res.status(500).send('Server error');
        }
    }
);

module.exports = router;

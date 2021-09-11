import express, { Router, Request, Response } from 'express';
import { IUserCensoredProps, IUserProps, UserModel } from '../../models/User';
import { check, validationResult, Result, ValidationError } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { unverifiedUserAuthMiddleware } from '../middleware/verificationAuth';
import { formatValidatorErrArrayAsMsgString } from '../../misc/helperFunctions';

const router: Router = express.Router();

// @route GET api/auth
// @desc Get a user's info using a token
// @access Private
router.get('/', unverifiedUserAuthMiddleware, async (req, res) => {
    try {
        console.log('GET api/auth hit');
        return res.json(req.user);
    } catch (err) {
        console.error('Error inside GET api/auth: ' + err.message);
        return res.status(500).send('Server error');
    }
});

// @route POST api/auth
// @desc Login user, sending a token and basic user info
// @access Public
router.post(
    '/',
    check('email', 'An email is required').not().isEmpty(),
    check('password', 'A password is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('POST api/auth hit');
        const errors: Result<ValidationError> = validationResult(req);

        if (!errors.isEmpty()) {
            const errMsg = formatValidatorErrArrayAsMsgString(errors.array());
            return res.status(400).send('Error:' + errMsg);
        }

        let { email, password }: IUserProps = req.body;

        try {
            // See if user exists in the database
            let foundUser = await UserModel.findOne({ email });
            if (!foundUser) {
                return res.status(400).send('Error: Your email or password is incorrect.');
            }

            // Check if the password is correct
            const isMatch = await bcrypt.compare(password, foundUser.password);
            if (!isMatch) {
                return res.status(400).send('Error: Your email or password is incorrect.');
            }

            // Return a jwt and a cut down user
            const payload = {
                user: {
                    id: foundUser.id,
                },
            };

            var user: IUserCensoredProps = {
                _id: foundUser.id,
                displayName: foundUser.displayName,
                email: foundUser.email,
                registrationDate: foundUser.registrationDate,
                verified: foundUser.verified,
            };

            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' }, (err, token) => {
                if (err) throw err;
                return res.json({ token, user });
            });
        } catch (err) {
            console.error('Error inside POST api/auth: ' + err.message);
            return res.status(500).send('Server error');
        }
    }
);

module.exports = router;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verificationAuth_1 = require("../middleware/verificationAuth");
const router = express_1.default.Router();
// @route GET api/auth
// @desc Get a user's info using a token
// @access Private
router.get('/', verificationAuth_1.unverifiedUserAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('GET api/auth hit');
        return res.json(req.user);
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route POST api/auth
// @desc Login user, sending a token and basic user info
// @access Public
router.post('/', express_validator_1.check('email', 'An email is required').not().isEmpty(), express_validator_1.check('password', 'A password is required').exists(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST api/auth hit');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let { email, password } = req.body;
    try {
        // See if user exists in the database
        let foundUser = yield User_1.UserModel.findOne({ email });
        if (!foundUser) {
            return res.status(400).json({ errors: [{ msg: 'Your email or password is incorrect.' }] });
        }
        // Check if the password is correct
        const isMatch = yield bcryptjs_1.default.compare(password, foundUser.password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Your email or password is incorrect.' }] });
        }
        // Return a jwt and a cut down user
        const payload = {
            user: {
                id: foundUser.id,
            },
        };
        var user = {
            _id: foundUser.id,
            displayName: foundUser.displayName,
            email: foundUser.email,
            registrationDate: foundUser.registrationDate,
            verified: foundUser.verified,
        };
        // TODO reduce lifetime of this token on release
        jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1w' }, (err, token) => {
            if (err)
                throw err;
            return res.json({ token, user });
        });
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
}));
module.exports = router;

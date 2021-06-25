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
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const verificationAuth_1 = require("../middleware/verificationAuth");
const ListGroupBaseModel_1 = require("../models/listGroups/ListGroupBaseModel");
const listGroupPermissions_1 = require("../models/listGroups/listGroupPermissions");
const GiftGroupModel_1 = require("../models/listGroups/variants/discriminators/parent/GiftGroupModel");
const auth_1 = require("../middleware/auth");
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const router = express_1.default.Router();
function sendVerificationEmail(newUserId, email, displayName) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = { newUserId: newUserId };
        const token = yield jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });
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
        yield mail_1.default.send(msg);
        return;
    });
}
// TODO improve validation of user display name, email
// @route POST api/users
// @desc Register a new user
// @access Public
router.post('/', express_validator_1.check('displayName', 'Display name is required').not().isEmpty(), express_validator_1.check('email', 'Please include a valid email').not().isEmpty(), express_validator_1.check('email', 'Please include a valid email').isEmail(), express_validator_1.check('password', 'Please provide a password with 8 or more characters').isLength({ min: 8 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST api/users hit');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let { displayName, email, password } = req.body;
    try {
        // See if user already exists in the database
        let foundUser = yield User_1.UserModel.findOne({ email });
        if (foundUser) {
            return res.status(400).json({ errors: [{ msg: 'An account already exists with that email address' }] });
        }
        // Encrypt the password
        const salt = yield bcryptjs_1.default.genSalt(10);
        password = yield bcryptjs_1.default.hash(password, salt);
        // Create a new user
        const newUser = new User_1.UserModel({
            displayName,
            email,
            password,
        });
        // Add the user to the database
        yield newUser.save();
        // Send a verification email
        sendVerificationEmail(newUser._id, email, displayName);
        // Return a jwt
        const payload = {
            user: {
                id: newUser.id,
            },
        };
        var user = {
            _id: newUser.id,
            displayName: displayName,
            email: email,
            registrationDate: newUser.registrationDate,
            verified: newUser.verified,
        };
        // TODO reduce lifetime of token on release
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
// @route POST api/users/sendverification
// @desc Send a verification email
// @access Private
router.post('/sendverification', verificationAuth_1.unverifiedUserAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST api/users/sendverification hit');
    try {
        yield sendVerificationEmail(req.user._id, req.user.email, req.user.displayName);
        console.log('sending response to user');
        return res.send(200);
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route POST api/users/verify/:verificationtoken
// @desc Verify a new user
// @access Public
router.post('/verify/:verificationtoken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST api/users/verify/:verificationtoken hit');
    const verificationToken = req.params.verificationtoken;
    try {
        const decodedVerificationToken = jsonwebtoken_1.default.verify(verificationToken, process.env.JWT_SECRET);
        const { newUserId } = decodedVerificationToken;
        const verifiedUser = yield User_1.UserModel.findByIdAndUpdate(newUserId, { verified: true });
        if (!verifiedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        return res.send(200);
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route DELETE api/users/
// @desc Delete a user and all their content
// @access Private
router.delete('/', verificationAuth_1.unverifiedUserAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('DELETE api/users/ hit');
    const userId = req.user._id;
    try {
        // delete user and groups
        // TODO delete listitems & messages (or do something else with them)
        let foundOwnedParentGroups = yield GiftGroupModel_1.GiftGroupModel.find({
            'owner.userId': userId,
            'owner.permissions': listGroupPermissions_1.PERM_GROUP_DELETE,
        });
        for (var i = 0; i < foundOwnedParentGroups.length; i++) {
            let parentId = foundOwnedParentGroups[i].id;
            yield ListGroupBaseModel_1.ListGroupBaseModel.deleteMany({ $or: [{ parentGroupId: parentId }, { _id: parentId }] });
        }
        yield ListGroupBaseModel_1.ListGroupBaseModel.deleteMany({
            'owner.userId': userId,
            'owner.permissions': listGroupPermissions_1.PERM_GROUP_DELETE,
        });
        yield User_1.UserModel.findByIdAndDelete(userId);
        return res.status(200).json();
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route PUT api/users/
// @desc Update a user's display name
// @access Private
router.put('/', auth_1.authMiddleware, express_validator_1.check('displayName', 'Display name is required').not().isEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('PUT api/users/ hit');
    try {
        const userId = req.user._id;
        const { displayName } = req.body;
        yield User_1.UserModel.findByIdAndUpdate(userId, { displayName: displayName });
        return res.status(200).send();
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error: ' + err.message);
    }
}));
module.exports = router;

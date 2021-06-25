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
exports.unverifiedUserAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
function unverifiedUserAuthMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get token from header
        const token = req.header('x-auth-token');
        // Check if not token
        if (!token) {
            console.log('no token');
            return res.status(401).json({ msg: 'Unauthorized: missing x-auth-token' });
        }
        // Verify token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Check whether the token was issued before oldestValidJWT was last set. This could be used to invalidate user tokens if required. Also protects against tokens being used after user deletion.
            try {
                var foundUser = yield User_1.UserModel.findById(decoded.user.id).select('-password');
            }
            catch (err) {
                return res.status(500).json({ msg: 'Server Error' });
            }
            if (!foundUser) {
                return res.status(404).json({ msg: 'User not found' });
            }
            const oldestValidJWT = foundUser.oldestValidJWT;
            // Add one second to iat as it is rounded down to the nearest second when set while oldestValidJWT was not
            const tokenDate = new Date((decoded.iat + 1) * 1000);
            if (tokenDate < oldestValidJWT) {
                console.log('invalidated token');
                return res.status(401).json({ msg: 'Unauthorized' });
            }
            var user = {
                _id: foundUser._id,
                displayName: foundUser.displayName,
                email: foundUser.email,
                registrationDate: foundUser.registrationDate,
                verified: foundUser.verified,
            };
            req.user = user;
            next();
        }
        catch (err) {
            console.error(err.message);
            return res.status(401).json({ msg: 'Unauthorized' });
        }
    });
}
exports.unverifiedUserAuthMiddleware = unverifiedUserAuthMiddleware;

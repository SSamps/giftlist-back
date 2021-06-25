"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.UserSchema = void 0;
const mongoose_1 = require("mongoose");
exports.UserSchema = new mongoose_1.Schema({
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registrationDate: { type: Date, default: Date.now },
    oldestValidJWT: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
});
exports.UserModel = mongoose_1.model('User', exports.UserSchema);

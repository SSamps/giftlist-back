"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMessageModel = exports.USER_MESSAGE = void 0;
const mongoose_1 = require("mongoose");
const MessageBaseModel_1 = require("../../MessageBaseModel");
exports.USER_MESSAGE = 'USER_MESSAGE';
const userMessageSchema = new mongoose_1.Schema({
    groupId: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    creationDate: { type: Date, default: Date.now },
    body: { type: String },
});
exports.UserMessageModel = MessageBaseModel_1.MessageBaseModel.discriminator(exports.USER_MESSAGE, userMessageSchema);

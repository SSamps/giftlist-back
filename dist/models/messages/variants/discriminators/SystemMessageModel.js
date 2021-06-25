"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMessageModel = exports.SYSTEM_MESSAGE = void 0;
const mongoose_1 = require("mongoose");
const MessageBaseModel_1 = require("../../MessageBaseModel");
exports.SYSTEM_MESSAGE = 'SYSTEM_MESSAGE';
const systemMessageSchema = new mongoose_1.Schema({
    groupId: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    creationDate: { type: Date, default: Date.now },
    body: { type: String },
});
exports.SystemMessageModel = MessageBaseModel_1.MessageBaseModel.discriminator(exports.SYSTEM_MESSAGE, systemMessageSchema);

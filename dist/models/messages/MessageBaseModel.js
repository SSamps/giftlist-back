"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBaseModel = void 0;
const mongoose_1 = require("mongoose");
const messageInterfaces_1 = require("./messageInterfaces");
const options = { discriminatorKey: messageInterfaces_1.MESSAGE_DISCRIMINATOR };
const messageBaseSchema = new mongoose_1.Schema({
    groupId: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    creationDate: { type: Date, default: Date.now },
    body: { type: String },
}, options);
exports.MessageBaseModel = mongoose_1.model('message', messageBaseSchema);

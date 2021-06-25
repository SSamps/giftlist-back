"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListGroupBaseModel = void 0;
const mongoose_1 = require("mongoose");
const options = { discriminatorKey: 'groupVariant' };
const ListGroupBaseSchema = new mongoose_1.Schema({
    owner: {
        userId: { type: mongoose_1.Schema.Types.ObjectId },
        permissions: [{ type: String }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId },
            permissions: [{ type: String }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    parentGroupId: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    groupName: { type: String },
    creationDate: { type: Date, default: Date.now },
}, options);
exports.ListGroupBaseModel = mongoose_1.model('ListGroup', ListGroupBaseSchema);

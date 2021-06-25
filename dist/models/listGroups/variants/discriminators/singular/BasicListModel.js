"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicListModel = exports.BASIC_LIST = void 0;
const mongoose_1 = require("mongoose");
const ListGroupBaseModel_1 = require("../../../ListGroupBaseModel");
const listGroupPermissions_1 = require("../../../listGroupPermissions");
exports.BASIC_LIST = 'BASIC_LIST';
const basicListSchema = new mongoose_1.Schema({
    owner: {
        userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: listGroupPermissions_1.PERM_BASIC_LIST_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: listGroupPermissions_1.PERM_BASIC_LIST_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    maxListItems: { type: Number, required: true, default: 50 },
    listItems: [
        {
            authorId: { type: mongoose_1.Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            link: { type: String },
            selectedBy: [{ type: mongoose_1.Schema.Types.ObjectId }],
        },
    ],
});
exports.BasicListModel = ListGroupBaseModel_1.ListGroupBaseModel.discriminator(exports.BASIC_LIST, basicListSchema);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftGroupChildModel = exports.GIFT_GROUP_CHILD = void 0;
const mongoose_1 = require("mongoose");
const ListGroupBaseModel_1 = require("../../../ListGroupBaseModel");
const listGroupPermissions_1 = require("../../../listGroupPermissions");
exports.GIFT_GROUP_CHILD = 'GIFT_GROUP_CHILD';
const giftGroupChildSchema = new mongoose_1.Schema({
    owner: {
        userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: listGroupPermissions_1.PERM_GIFT_GROUP_CHILD_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: listGroupPermissions_1.PERM_GIFT_GROUP_CHILD_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
    parentGroupId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    maxListItems: { type: Number, required: true, default: 20 },
    listItems: [
        {
            authorId: { type: mongoose_1.Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            link: { type: String },
            selectedBy: [{ type: mongoose_1.Schema.Types.ObjectId }],
        },
    ],
    maxSecretListItemsEach: { type: Number, required: true, default: 5 },
    secretListItems: [
        {
            authorId: { type: mongoose_1.Schema.Types.ObjectId },
            creationDate: { type: Date, default: Date.now },
            body: { type: String },
            link: { type: String },
            selectedBy: [{ type: mongoose_1.Schema.Types.ObjectId }],
        },
    ],
});
exports.GiftGroupChildModel = ListGroupBaseModel_1.ListGroupBaseModel.discriminator(exports.GIFT_GROUP_CHILD, giftGroupChildSchema);

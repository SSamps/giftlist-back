"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftGroupModel = exports.GIFT_GROUP = void 0;
const mongoose_1 = require("mongoose");
const ListGroupBaseModel_1 = require("../../../ListGroupBaseModel");
const listGroupPermissions_1 = require("../../../listGroupPermissions");
exports.GIFT_GROUP = 'GIFT_GROUP';
const giftGroupSchema = new mongoose_1.Schema({
    owner: {
        userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
        permissions: [{ type: String, required: true, enum: listGroupPermissions_1.PERM_GIFT_GROUP_ALL }],
        oldestUnreadMsg: { type: Date },
    },
    members: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            permissions: [{ type: String, required: true, enum: listGroupPermissions_1.PERM_GIFT_GROUP_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
});
exports.GiftGroupModel = ListGroupBaseModel_1.ListGroupBaseModel.discriminator(exports.GIFT_GROUP, giftGroupSchema);

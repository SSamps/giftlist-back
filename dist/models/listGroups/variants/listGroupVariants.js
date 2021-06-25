"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIST_GROUP_ALL_TOP_LEVEL_VARIANTS = exports.LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES = exports.LIST_GROUP_ALL_VARIANTS = exports.LIST_GROUP_CHILD_VARIANTS = exports.LIST_GROUP_PARENT_VARIANTS = exports.LIST_GROUP_SINGLE_VARIANTS = void 0;
const GiftGroupChildModel_1 = require("./discriminators/child/GiftGroupChildModel");
const GiftGroupModel_1 = require("./discriminators/parent/GiftGroupModel");
const BasicListModel_1 = require("./discriminators/singular/BasicListModel");
const GiftListModel_1 = require("./discriminators/singular/GiftListModel");
exports.LIST_GROUP_SINGLE_VARIANTS = [BasicListModel_1.BASIC_LIST, GiftListModel_1.GIFT_LIST];
exports.LIST_GROUP_PARENT_VARIANTS = [GiftGroupModel_1.GIFT_GROUP];
exports.LIST_GROUP_CHILD_VARIANTS = [GiftGroupChildModel_1.GIFT_GROUP_CHILD];
exports.LIST_GROUP_ALL_VARIANTS = [
    ...exports.LIST_GROUP_SINGLE_VARIANTS,
    ...exports.LIST_GROUP_PARENT_VARIANTS,
    ...exports.LIST_GROUP_CHILD_VARIANTS,
];
exports.LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES = [GiftGroupChildModel_1.GIFT_GROUP_CHILD, GiftListModel_1.GIFT_LIST];
exports.LIST_GROUP_ALL_TOP_LEVEL_VARIANTS = [...exports.LIST_GROUP_SINGLE_VARIANTS, ...exports.LIST_GROUP_PARENT_VARIANTS];

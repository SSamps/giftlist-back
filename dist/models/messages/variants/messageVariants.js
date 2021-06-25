"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_VARIANTS = void 0;
const SystemMessageModel_1 = require("./discriminators/SystemMessageModel");
const UserMessageModel_1 = require("./discriminators/UserMessageModel");
exports.MESSAGE_VARIANTS = [UserMessageModel_1.USER_MESSAGE, SystemMessageModel_1.SYSTEM_MESSAGE];

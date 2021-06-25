"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const express_validator_1 = require("express-validator");
const ListGroupBaseModel_1 = require("../../models/listGroups/ListGroupBaseModel");
const listGroupPermissions_1 = require("../../models/listGroups/listGroupPermissions");
const listGroupVariants_1 = require("../../models/listGroups/variants/listGroupVariants");
const UserMessageModel_1 = require("../../models/messages/variants/discriminators/UserMessageModel");
const router = express_1.default.Router();
// @route GET api/groups/:groupid/messages
// @desc TEST ROUTE. Gets all messages in a group. Later will add this functionality to the group route.
// @access Private
router.get('/:groupid/messages', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('GET api/groups/:groupid/messages');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;
    try {
        let foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
            $and: [
                { _id: groupIdParams, groupVariant: { $in: listGroupVariants_1.LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES } },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_RW_MESSAGES },
                        { 'members.userId': userIdToken, 'members.permissions': listGroupPermissions_1.PERM_GROUP_RW_MESSAGES },
                    ],
                },
            ],
        });
        if (!foundGroup) {
            return res
                .status(400)
                .send('User is not an owner or member of the supplied group with the correct permissions');
        }
        let foundMessages = yield UserMessageModel_1.UserMessageModel.find({ groupId: groupIdParams });
        return res.status(200).json({ messages: foundMessages });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
}));
// @route POST api/groups/:groupid/messages
// @desc Post a message to a list group
// @access Private
router.post('/:groupid/messages', auth_1.authMiddleware, express_validator_1.check('body', 'A list item body is required').not().isEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST api/groups/:groupid/messages');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;
    const { body } = req.body;
    try {
        let foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
            $and: [
                { _id: groupIdParams, groupVariant: { $in: listGroupVariants_1.LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES } },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_RW_MESSAGES },
                        { 'members.userId': userIdToken, 'members.permissions': listGroupPermissions_1.PERM_GROUP_RW_MESSAGES },
                    ],
                },
            ],
        });
        if (!foundGroup) {
            return res
                .status(404)
                .send('User is not an owner or member of the supplied group with the correct permissions');
        }
        const newMessageFields = { author: userIdToken, groupId: groupIdParams, body: body };
        const newMessage = new UserMessageModel_1.UserMessageModel(newMessageFields);
        yield newMessage.save();
        return res.status(200).send();
    }
    catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
}));
// @route POST api/groups/:groupid/messages/:messageid
// @desc Delete an item from a list group
// @access Private
router.delete('/messages/:messageid', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('DELETE api/groups/:groupid/messages/:messageid');
    const userIdToken = req.user._id;
    const messageIdParams = req.params.messageid;
    try {
        let removedMessage = yield UserMessageModel_1.UserMessageModel.findOneAndRemove({ _id: messageIdParams, author: userIdToken });
        if (!removedMessage) {
            return res.status(404).send();
        }
        return res.status(200).send();
    }
    catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
}));
module.exports = router;

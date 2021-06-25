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
const GiftListModel_1 = require("../../models/listGroups/variants/discriminators/singular/GiftListModel");
const helperFunctions_1 = require("../helperFunctions");
const router = express_1.default.Router();
// @route POST api/groups/:groupid/items
// @desc Add an item to a list group
// @access Private
router.post('/:groupid/items', auth_1.authMiddleware, express_validator_1.oneOf([
    express_validator_1.check('listItem', 'A list item or secret list item object is required').not().isEmpty(),
    express_validator_1.check('secretListItem', 'A list item or secret list item object is required').not().isEmpty(),
]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST api/groups/giftlist/:groupid/items');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupId = req.params.groupid;
    const { listItem, secretListItem } = req.body;
    if (listItem && secretListItem) {
        return res.status(400).send('You cannot specify a new list item and secret list item in the same request');
    }
    let result;
    try {
        if (listItem) {
            result = yield helperFunctions_1.handleNewListItemRequest(userIdToken, groupId, listItem, res);
        }
        else if (secretListItem) {
            result = yield helperFunctions_1.handleNewSecretListItemRequest(userIdToken, groupId, secretListItem, res);
        }
        return result;
    }
    catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
}));
// @route DELETE api/groups/:groupid/items/:itemid
// @desc Delete an item from a list group
// @access Private
router.delete('/:groupid/items/:itemid', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('DELETE api/groups/:groupid/items/:itemid');
    const userIdToken = req.user._id;
    const groupId = req.params.groupid;
    const itemId = req.params.itemid;
    try {
        const foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
            $and: [
                { _id: groupId },
                {
                    $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
                },
            ],
        });
        if (!foundGroup) {
            return res.status(404).send();
        }
        const [itemType, foundItem] = helperFunctions_1.findItemInGroup(foundGroup, itemId);
        if (!foundItem) {
            return res.status(404).send('Item not found');
        }
        if (foundItem.authorId.toString() !== userIdToken.toString()) {
            return res.status(401).send('You can only delete your own items');
        }
        if (itemType === 'listItem') {
            let result = yield foundGroup.update({ $pull: { listItems: { _id: itemId } } });
            if (result.nModified === 1) {
                return res.status(200).send();
            }
            return res.status(404).send();
        }
        else {
            let result = yield foundGroup.update({ $pull: { secretListItems: { _id: itemId } } });
            if (result.nModified === 1) {
                return res.status(200).send();
            }
            return res.status(404).send();
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
}));
// @route PUT api/groups/:groupid/items/:itemid
// @desc Modify an item in a list group
// @access Private
router.put('/:groupid/items/:itemid', auth_1.authMiddleware, express_validator_1.check('body', 'A list item body is required').not().isEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('PUT api/groups/:groupid/items');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupId = req.params.groupid;
    const itemId = req.params.itemid;
    const { body, link } = req.body;
    try {
        const foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
            $and: [
                { _id: groupId, groupVariant: GiftListModel_1.GIFT_LIST },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_RW_LIST_ITEMS },
                        { 'members.userId': userIdToken, 'members.permissions': listGroupPermissions_1.PERM_GROUP_RW_SECRET_LIST_ITEMS },
                    ],
                },
            ],
        });
        if (!foundGroup) {
            return res.status(404).send();
        }
        const [itemType, foundItem] = helperFunctions_1.findItemInGroup(foundGroup, itemId);
        if (!foundItem) {
            return res.status(404).send('Item not found');
        }
        if (foundItem.authorId.toString() !== userIdToken.toString()) {
            return res.status(401).send('You can only modify your own items');
        }
        if (itemType === 'listItem') {
            let result = yield foundGroup.update({ $set: { 'listItems.$[item].body': body, 'listItems.$[item].link': link } }, { arrayFilters: [{ 'item._id': itemId }] });
            if (result.nModified === 1) {
                return res.status(200).send();
            }
            return res.status(404).send();
        }
        else {
            let result = yield foundGroup.update({ $pull: { secretListItems: { _id: itemId } } });
            if (result.nModified === 1) {
                return res.status(200).send();
            }
            return res.status(404).send();
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
}));
// @route PUT api/groups/:groupid/items/:itemid/select
// @desc Select an item in a list group
// @access Private
router.put('/:groupid/items/:itemid/select', auth_1.authMiddleware, express_validator_1.check('action', 'You must specify an action in the request body').not().isEmpty(), express_validator_1.check('action', 'action must be either select or deselect').isIn(['SELECT', 'DESELECT']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('PUT api/groups/:groupid/items/:itemid/select');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupId = req.params.groupid;
    const itemId = req.params.itemid;
    const { action } = req.body;
    try {
        const foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
            $and: [
                { _id: groupId, groupVariant: GiftListModel_1.GIFT_LIST },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_RW_LIST_ITEMS },
                        { 'members.userId': userIdToken, 'members.permissions': listGroupPermissions_1.PERM_GROUP_RW_SECRET_LIST_ITEMS },
                    ],
                },
            ],
        });
        if (!foundGroup) {
            return res.status(404).send();
        }
        const [itemType, foundItem] = helperFunctions_1.findItemInGroup(foundGroup, itemId);
        if (!foundItem) {
            return res.status(404).send('Item not found');
        }
        const [, foundUser] = helperFunctions_1.findUserInGroup(foundGroup, userIdToken);
        if (!foundUser) {
            return res.status(401).send('You must be a member of a group to select items within it');
        }
        if (itemType === 'listItem') {
            if (!foundUser.permissions.includes(listGroupPermissions_1.PERM_GROUP_SELECT_LIST_ITEMS)) {
                return res.status(401).send('You are not authorised to select list items in this group');
            }
        }
        else if (itemType === 'secretListItem') {
            if (!foundUser.permissions.includes(listGroupPermissions_1.PERM_GROUP_SELECT_SECRET_LIST_ITEMS)) {
                return res.status(401).send('You are not authorised to select secret list items in this group');
            }
        }
        if (itemType === 'listItem') {
            if (action === 'SELECT') {
                yield foundGroup.update({ $addToSet: { 'listItems.$[item].selectedBy': userIdToken } }, { arrayFilters: [{ 'item._id': itemId }] });
                return res.status(200).send();
            }
            else {
                yield foundGroup.update({ $pull: { 'listItems.$[item].selectedBy': userIdToken } }, { arrayFilters: [{ 'item._id': itemId }] });
            }
        }
        else {
            if (action === 'SELECT') {
                yield foundGroup.update({ $addToSet: { 'secretListItems.$[item].selectedBy': userIdToken } }, { arrayFilters: [{ 'item._id': itemId }] });
            }
            else {
                yield foundGroup.update({ $pull: { 'secretListItems.$[item].selectedBy': userIdToken } }, { arrayFilters: [{ 'item._id': itemId }] });
            }
        }
        return res.status(200).send();
    }
    catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
}));
module.exports = router;

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
const helperFunctions_1 = require("../helperFunctions");
const router = express_1.default.Router();
// TODO will have to update this later to censor the results depending on the user's permissions
// @route GET api/groups
// @desc Get all top level groups a user owns or is a member of and censors them.
// @access Private
router.get('/user', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('GET /api/groups/user hit');
    const userIdToken = req.user._id;
    try {
        let foundMemberGroups = yield ListGroupBaseModel_1.ListGroupBaseModel.find({
            $and: [
                { $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }] },
                { groupVariant: { $in: listGroupVariants_1.LIST_GROUP_ALL_TOP_LEVEL_VARIANTS } },
            ],
        });
        let foundOwnedGroups = [];
        for (var i = foundMemberGroups.length - 1; i >= 0; i--) {
            let document = foundMemberGroups[i];
            if (document.owner.userId.toString() === userIdToken.toString()) {
                foundOwnedGroups.push(document);
                foundMemberGroups.splice(i, 1);
            }
        }
        if (foundOwnedGroups.length == 0 && foundMemberGroups.length == 0) {
            return res.status(404).json({ msg: 'No groups found' });
        }
        let censoredOwnedGroups = foundOwnedGroups;
        censoredOwnedGroups.map((group) => {
            if (group.secretListItems) {
                group.secretListItems = undefined;
            }
            if (group.listItems) {
                group.listItems.map((item) => {
                    item.selectedBy = undefined;
                    return item;
                });
            }
            return group;
        });
        let response = [...censoredOwnedGroups, ...foundMemberGroups];
        return res.status(200).json(response);
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
// TODO this is a test route so remove it later
// @route GET api/groups
// @desc Get all groups a user owns or is a member of
// @access Private
router.get('/user/all', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('GET /api/groups/user/all hit');
    const userIdToken = req.user._id;
    try {
        let foundMemberGroups = yield ListGroupBaseModel_1.ListGroupBaseModel.find({
            $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
        });
        let foundOwnedGroups = [];
        for (var i = foundMemberGroups.length - 1; i >= 0; i--) {
            let document = foundMemberGroups[i];
            if (document.owner.userId.toString() === userIdToken.toString()) {
                foundOwnedGroups.push(document);
                foundMemberGroups.splice(i, 1);
            }
        }
        if (foundOwnedGroups.length == 0 && foundMemberGroups.length == 0) {
            return res.status(404).json({ msg: 'No groups found' });
        }
        return res.status(200).json({ ownedGroups: foundOwnedGroups, memberGroups: foundMemberGroups });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route POST api/groups/
// @desc Add a new group
// @access Private
router.post('/', auth_1.authMiddleware, express_validator_1.check('groupName', 'groupName is required').not().isEmpty(), express_validator_1.check('groupVariant', 'groupVariant is required').not().isEmpty(), express_validator_1.check('groupVariant', 'groupVariant is not a valid group type').isIn(listGroupVariants_1.LIST_GROUP_ALL_VARIANTS), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST /api/groups hit');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const { groupVariant, groupName, parentGroupId } = req.body;
    let result;
    try {
        result = yield helperFunctions_1.addGroup(userIdToken, groupVariant, groupName, res, parentGroupId);
        return result;
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route PUT api/groups/:groupid/leave
// @desc Leave a group if a member
// @access Private
router.put('/:groupid/leave', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('PUT /api/groups/:groupid/leave hit');
    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;
    try {
        const foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne().and([
            { _id: groupIdParams },
            { 'members.userId': userIdToken },
        ]);
        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or not a member');
        }
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
    try {
        const updatedGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOneAndUpdate({ _id: groupIdParams }, { $pull: { members: { userId: userIdToken } } }, { new: true });
        return res.status(200).json(updatedGroup);
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route DELETE api/groups/:groupid/delete
// @desc Delete a group and all child groups if any
// @access Private
router.delete('/:groupid/delete', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('DELETE /api/groups/:groupid/delete hit');
    const userId = req.user._id;
    const groupId = req.params.groupid;
    try {
        const result = yield helperFunctions_1.deleteGroupAndAnyChildGroups(userId, groupId);
        return res.status(result.status).json(result.msg);
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route PUT api/groups/:groupid/permission
// @desc Modify the permissions for users in a group
// @access Private
router.put('/:groupid/permission', auth_1.authMiddleware, express_validator_1.check('targetUserId', 'targetUserId is required').not().isEmpty(), express_validator_1.check('targetPermission', 'targetPermission is required').not().isEmpty(), express_validator_1.check('targetPermission', 'targetPermission cannot be modified').isIn(listGroupPermissions_1.PERM_MUTABLE_ALL), express_validator_1.check('modification', 'modification is required').not().isEmpty(), express_validator_1.check('modification', 'Invalid permission modifier').isIn(listGroupPermissions_1.PERM_MODIFIERS_ALL), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('put /api/groups/:groupid/permission hit');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;
    const { targetUserId, targetPermission, modification } = req.body;
    try {
        var foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
            $and: [
                { _id: groupIdParams },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_ADMIN },
                        { 'members.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_ADMIN },
                    ],
                },
                { 'members.userId': targetUserId },
            ],
        });
        if (!foundGroup) {
            return res
                .status(400)
                .send('Invalid groupId, target user not in the group or requesting user is not authorised to manage permissions on this group');
        }
        else if (listGroupVariants_1.LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
            return res.status(400).send('Invalid permission: users cannot be invited directly to child groups');
        }
        if (modification === listGroupPermissions_1.PERM_MODIFIER_ADD) {
            yield foundGroup.update({ $addToSet: { 'members.$[member].permissions': targetPermission } }, { arrayFilters: [{ 'member.userId': targetUserId }] });
        }
        else if (modification === listGroupPermissions_1.PERM_MODIFIER_REMOVE) {
            yield foundGroup.update({ $pull: { 'members.$[member].permissions': targetPermission } }, { arrayFilters: [{ 'member.userId': targetUserId }] });
        }
        return res.status(200).json({ msg: 'Permissions updated' });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
// @route PUT api/groups/:groupid/kick
// @desc Kick a user from a group
// @access Private
router.put('/:groupid/kick', auth_1.authMiddleware, express_validator_1.check('targetUserId', 'targetUserId is required').not().isEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('put /api/groups/:groupid/kick hit');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;
    const { targetUserId } = req.body;
    try {
        var foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne({
            $and: [
                { _id: groupIdParams },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_ADMIN },
                        { 'members.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_ADMIN },
                    ],
                },
                { 'members.userId': targetUserId },
            ],
        });
        if (!foundGroup) {
            return res
                .status(400)
                .send('Invalid groupId, target user not in the group or requesting user is not authorised to kick users from this group');
        }
        else if (listGroupVariants_1.LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
            return res.status(400).send('Invalid permission: users cannot be kicked from child groups');
        }
        yield foundGroup.update({ $pull: { members: { userId: targetUserId } } });
        return res.status(200).json({ msg: 'User kicked' });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
}));
module.exports = router;

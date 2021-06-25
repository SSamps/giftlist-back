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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const express_validator_1 = require("express-validator");
const ListGroupBaseModel_1 = require("../../models/listGroups/ListGroupBaseModel");
const listGroupPermissions_1 = require("../../models/listGroups/listGroupPermissions");
const BasicListModel_1 = require("../../models/listGroups/variants/discriminators/singular/BasicListModel");
const GiftGroupChildModel_1 = require("../../models/listGroups/variants/discriminators/child/GiftGroupChildModel");
const GiftGroupModel_1 = require("../../models/listGroups/variants/discriminators/parent/GiftGroupModel");
const GiftListModel_1 = require("../../models/listGroups/variants/discriminators/singular/GiftListModel");
const listGroupInterfaces_1 = require("../../models/listGroups/listGroupInterfaces");
const router = express_1.default.Router();
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
// @route POST api/groups/:groupid/invite/send
// @desc Send an invite
// @access Private
router.post('/:groupid/invite/send', auth_1.authMiddleware, express_validator_1.check('invitedEmail', 'invitedEmail is required').not().isEmpty(), express_validator_1.check('invitedEmail', 'invitedEmail must be an email').isEmail(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST /api/groups/:groupid/invite/send hit');
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;
    try {
        var foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne().and([
            { _id: groupIdParams },
            {
                $or: [
                    { 'owner.userId': userIdToken, 'owner.permissions': listGroupPermissions_1.PERM_GROUP_INVITE },
                    { 'members.userId': userIdToken, 'members.permissions': listGroupPermissions_1.PERM_GROUP_INVITE },
                ],
            },
        ]);
        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or unauthorized');
        }
        const { groupName, _id } = foundGroup;
        const senderName = req.user.displayName;
        const payload = {
            senderName: senderName,
            groupName: groupName,
            groupId: _id,
        };
        const token = yield jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });
        const inviteBaseLink = 'https://giftlist.sampsy.dev/invite/';
        const inviteLink = inviteBaseLink + token;
        const msg = {
            to: req.body.invitedEmail,
            from: {
                name: 'GiftList',
                email: 'invites.giftlist@sampsy.dev',
            },
            templateId: 'd-cc51518222ad4be5b77288e51c7b02a3',
            dynamic_template_data: {
                groupName: groupName,
                senderName: senderName,
                inviteLink: inviteLink,
            },
        };
        yield mail_1.default.send(msg);
        return res.send(200);
    }
    catch (err) {
        console.log(err);
        return res.send(500);
    }
}));
// @route POST api/groups/invite/verify/:groupToken
// @desc Verify an invite token
// @access Private
router.get('/invite/verify/:groupToken', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('GET /api/groups/invite/verify/:groupToken hit');
    const groupToken = req.params.groupToken;
    try {
        const decodedGroupToken = jsonwebtoken_1.default.verify(groupToken, process.env.JWT_SECRET);
        // TODO check the group also still exists
        const { senderName, groupName } = decodedGroupToken;
        return res.json({ senderName: senderName, groupName: groupName });
    }
    catch (err) {
        if (err.message) {
            return res.status(400).send(err.message);
        }
        else {
            return res.send(500);
        }
    }
}));
// @route POST api/groups/invite/accept/:groupToken
// @desc Accept an invite
// @access Private
router.post('/invite/accept/:groupToken', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST /api/groups/invite/accept/:groupid hit');
    const userIdToken = req.user._id;
    const groupToken = req.params.groupToken;
    let decodedGroupToken;
    try {
        decodedGroupToken = jsonwebtoken_1.default.verify(groupToken, process.env.JWT_SECRET);
    }
    catch (err) {
        if (err.message) {
            return res.status(400).send(err.message);
        }
        else {
            return res.send(500);
        }
    }
    const { groupId } = decodedGroupToken;
    try {
        var foundGroup = yield ListGroupBaseModel_1.ListGroupBaseModel.findOne().and([
            { _id: groupId },
            {
                $nor: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
            },
        ]);
        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or user already in group');
        }
        const { groupVariant } = foundGroup;
        switch (groupVariant) {
            case BasicListModel_1.BASIC_LIST: {
                let newMember = {
                    userId: userIdToken,
                    permissions: listGroupPermissions_1.basicListMemberBasePerms,
                };
                yield BasicListModel_1.BasicListModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case GiftListModel_1.GIFT_LIST: {
                let newMember = {
                    userId: userIdToken,
                    permissions: listGroupPermissions_1.giftListMemberBasePerms,
                };
                yield GiftListModel_1.GiftListModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case GiftGroupChildModel_1.GIFT_GROUP_CHILD: {
                let newMember = {
                    userId: userIdToken,
                    permissions: listGroupPermissions_1.giftGroupChildMemberBasePerms,
                };
                yield GiftGroupChildModel_1.GiftGroupChildModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            case GiftGroupModel_1.GIFT_GROUP: {
                let newMember = {
                    userId: userIdToken,
                    permissions: listGroupPermissions_1.giftGroupMemberBasePerms,
                };
                yield GiftGroupModel_1.GiftGroupModel.findOneAndUpdate({ _id: groupId }, { $push: { members: newMember } });
                break;
            }
            default:
                throw new listGroupInterfaces_1.invalidGroupVariantError(groupVariant);
        }
        return res.send(200);
    }
    catch (err) {
        console.log(err.message);
        console.log(err);
        return res.status(500).send('Server error');
    }
}));
module.exports = router;

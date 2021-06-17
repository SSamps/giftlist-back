import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import jwt from 'jsonwebtoken';
import sendgrid from '@sendgrid/mail';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import { ListGroupBaseModel } from '../../models/listGroups/ListGroupBaseModel';
import {
    giftGroupChildMemberBasePerms,
    giftGroupMemberBasePerms,
    basicListMemberBasePerms,
    giftListMemberBasePerms,
    PERM_GROUP_INVITE,
} from '../../models/listGroups/listGroupPermissions';
import { BasicListModel, BASIC_LIST } from '../../models/listGroups/variants/discriminators/singular/BasicListModel';
import {
    GiftGroupChildModel,
    GIFT_GROUP_CHILD,
} from '../../models/listGroups/variants/discriminators/child/GiftGroupChildModel';
import { GiftGroupModel, GIFT_GROUP } from '../../models/listGroups/variants/discriminators/parent/GiftGroupModel';
import { GiftListModel, GIFT_LIST } from '../../models/listGroups/variants/discriminators/singular/GiftListModel';
import {
    IbasicListMember,
    IgiftGroupChildMember,
    IgiftGroupMember,
    IgiftListMember,
    invalidGroupVariantError,
} from '../../models/listGroups/listGroupInterfaces';

const router: Router = express.Router();

// @route POST api/groups/message
// @desc Send an invite
// @access Public
router.get('/message', async (req: Request, res: Response) => {
    console.log('POST /api/groups/message hit');

    res.send(200);
});

module.exports = router;

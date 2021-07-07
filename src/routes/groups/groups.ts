import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import { ListGroupBaseModel } from '../../models/listGroups/ListGroupBaseModel';
import {
    PERM_GROUP_ADMIN,
    PERM_MODIFIERS_ALL,
    PERM_MUTABLE_ALL,
    PERM_MODIFIER_ADD,
    PERM_MODIFIER_REMOVE,
} from '../../models/listGroups/listGroupPermissions';
import {
    LIST_GROUP_ALL_TOP_LEVEL_VARIANTS,
    LIST_GROUP_ALL_VARIANTS,
    LIST_GROUP_CHILD_VARIANTS,
} from '../../models/listGroups/variants/listGroupVariants';

import { addGroup, deleteGroupAndAnyChildGroups } from '../helperFunctions';
import { TlistGroupAny, TlistGroupAnyCensored } from '../../models/listGroups/listGroupInterfaces';

const router: Router = express.Router();

// TODO will have to update this later to censor the results depending on the user's permissions
// @route GET api/groups
// @desc Get all top level groups a user owns or is a member of and censors them.
// @access Private
router.get('/user', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET /api/groups/user hit');

    const userIdToken = req.user._id;

    try {
        let foundMemberGroups = await ListGroupBaseModel.find({
            $and: [
                { $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }] },
                { groupVariant: { $in: LIST_GROUP_ALL_TOP_LEVEL_VARIANTS } },
            ],
        });
        let foundOwnedGroups: TlistGroupAny[] = [];

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

        let censoredOwnedGroups: TlistGroupAnyCensored[] = foundOwnedGroups;

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
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// TODO this is a test route so remove it later
// @route GET api/groups/user/all
// @desc Get all groups a user owns or is a member of
// @access Private
router.get('/user/all', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET /api/groups/user/all hit');

    const userIdToken = req.user._id;

    try {
        let foundMemberGroups = await ListGroupBaseModel.find({
            $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
        });
        let foundOwnedGroups: TlistGroupAny[] = [];

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
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// TODO censor based on user permissions
// @route GET api/groups/:groupid
// @desc Get a group the user owns or is a member of
// @access Private
router.get('/:groupid', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET /api/groups/:groupid hit');

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    try {
        let foundGroup = await ListGroupBaseModel.findOne({
            $and: [
                { _id: groupIdParams },
                {
                    $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
                },
            ],
        });

        if (!foundGroup) {
            return res.status(404).send('Group not found or unauthorised');
        }

        return res.status(200).json(foundGroup);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route POST api/groups/
// @desc Add a new group
// @access Private
router.post(
    '/',
    authMiddleware,
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is required').not().isEmpty(),
    check('groupVariant', 'groupVariant is not a valid group type').isIn(LIST_GROUP_ALL_VARIANTS),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupVariant, groupName, parentGroupId } = req.body;

        let result;
        try {
            result = await addGroup(userIdToken, groupVariant, groupName, res, parentGroupId);
            return result;
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route PUT api/groups/:groupid/leave
// @desc Leave a group if a member
// @access Private
router.put('/:groupid/leave', authMiddleware, async (req: Request, res: Response) => {
    console.log('PUT /api/groups/:groupid/leave hit');

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    try {
        const foundGroup = await ListGroupBaseModel.findOne().and([
            { _id: groupIdParams },
            { 'members.userId': userIdToken },
        ]);

        if (!foundGroup) {
            return res.status(400).send('Invalid groupId or not a member');
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }

    try {
        const updatedGroup = await ListGroupBaseModel.findOneAndUpdate(
            { _id: groupIdParams },
            { $pull: { members: { userId: userIdToken } } },
            { new: true }
        );
        return res.status(200).json(updatedGroup);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route DELETE api/groups/:groupid/delete
// @desc Delete a group and all child groups if any
// @access Private
router.delete('/:groupid/delete', authMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE /api/groups/:groupid/delete hit');

    const userId = req.user._id;
    const groupId = req.params.groupid;

    try {
        const result = await deleteGroupAndAnyChildGroups(userId, groupId);

        return res.status(result.status).json(result.msg);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route PUT api/groups/:groupid/permission
// @desc Modify the permissions for users in a group
// @access Private
router.put(
    '/:groupid/permission',
    authMiddleware,
    check('targetUserId', 'targetUserId is required').not().isEmpty(),
    check('targetPermission', 'targetPermission is required').not().isEmpty(),
    check('targetPermission', 'targetPermission cannot be modified').isIn(PERM_MUTABLE_ALL),
    check('modification', 'modification is required').not().isEmpty(),
    check('modification', 'Invalid permission modifier').isIn(PERM_MODIFIERS_ALL),
    async (req: Request, res: Response) => {
        console.log('put /api/groups/:groupid/permission hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { targetUserId, targetPermission, modification } = req.body;

        try {
            var foundGroup = await ListGroupBaseModel.findOne({
                $and: [
                    { _id: groupIdParams },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                            { 'members.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                        ],
                    },
                    { 'members.userId': targetUserId },
                ],
            });
            if (!foundGroup) {
                return res
                    .status(400)
                    .send(
                        'Invalid groupId, target user not in the group or requesting user is not authorised to manage permissions on this group'
                    );
            } else if (LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
                return res.status(400).send('Invalid permission: users cannot be invited directly to child groups');
            }

            if (modification === PERM_MODIFIER_ADD) {
                await foundGroup.update(
                    { $addToSet: { 'members.$[member].permissions': targetPermission } },
                    { arrayFilters: [{ 'member.userId': targetUserId }] }
                );
            } else if (modification === PERM_MODIFIER_REMOVE) {
                await foundGroup.update(
                    { $pull: { 'members.$[member].permissions': targetPermission } },
                    { arrayFilters: [{ 'member.userId': targetUserId }] }
                );
            }

            return res.status(200).json({ msg: 'Permissions updated' });
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route PUT api/groups/:groupid/kick
// @desc Kick a user from a group
// @access Private
router.put(
    '/:groupid/kick',
    authMiddleware,
    check('targetUserId', 'targetUserId is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('put /api/groups/:groupid/kick hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { targetUserId } = req.body;

        try {
            var foundGroup = await ListGroupBaseModel.findOne({
                $and: [
                    { _id: groupIdParams },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                            { 'members.userId': userIdToken, 'owner.permissions': PERM_GROUP_ADMIN },
                        ],
                    },
                    { 'members.userId': targetUserId },
                ],
            });
            if (!foundGroup) {
                return res
                    .status(400)
                    .send(
                        'Invalid groupId, target user not in the group or requesting user is not authorised to kick users from this group'
                    );
            } else if (LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
                return res.status(400).send('Invalid permission: users cannot be kicked from child groups');
            }

            await foundGroup.update({ $pull: { members: { userId: targetUserId } } });
            return res.status(200).json({ msg: 'User kicked' });
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

module.exports = router;

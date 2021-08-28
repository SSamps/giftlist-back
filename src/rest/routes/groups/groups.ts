import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import { ListGroupBaseModel } from '../../../models/listGroups/ListGroupBaseModel';
import {
    PERM_MODIFIERS_ALL,
    PERM_MUTABLE_ALL,
    PERM_MODIFIER_ADD,
    PERM_MODIFIER_REMOVE,
    PERM_GROUP_RENAME,
    PERM_GROUP_KICK,
    PERM_GROUP_MANAGE_PERMS,
    PERM_GROUP_OWNER,
} from '../../../models/listGroups/listGroupPermissions';
import {
    LIST_GROUP_ALL_TOP_LEVEL_VARIANTS,
    LIST_GROUP_ALL_VARIANTS,
    LIST_GROUP_CHILD_VARIANTS,
    LIST_GROUP_PARENT_VARIANTS,
} from '../../../models/listGroups/variants/listGroupVariants';

import {
    addGroup,
    censorSingularGroup,
    findAndDeleteGroupAndAnyChildGroupsIfAllowed,
    findAndCensorChildGroups,
    findOneAndUpdateUsingDiscriminator,
    findUserInGroup,
} from '../helperFunctions';
import { TlistGroupAnyCensoredAny } from '../../../models/listGroups/listGroupInterfaces';
import { LeanDocument } from 'mongoose';

const router: Router = express.Router();

// // @route GET api/groups/user
// // @desc Get all top level groups a user owns or is a member of and censors them before returning.
// // @access Private
router.get('/user', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET /api/groups/user hit');

    const userIdToken = req.user._id;

    let groupVariantKey = 'groupVariant';
    try {
        let foundGroups = await ListGroupBaseModel.find({
            'members.userId': userIdToken,
            [groupVariantKey]: { $in: LIST_GROUP_ALL_TOP_LEVEL_VARIANTS },
        }).lean();

        let censoredGroups: LeanDocument<TlistGroupAnyCensoredAny>[] = [];
        for (let i = 0; i < foundGroups.length; i++) {
            if (LIST_GROUP_PARENT_VARIANTS.includes(foundGroups[i].groupVariant)) {
                censoredGroups.push(await findAndCensorChildGroups(userIdToken.toString(), foundGroups[i]));
            } else {
                censoredGroups.push(censorSingularGroup(userIdToken.toString(), foundGroups[i]));
            }
        }

        return res.status(200).json(censoredGroups);
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
        let foundGroup = await ListGroupBaseModel.findOne({ _id: groupIdParams }).lean();

        if (!foundGroup) {
            return res.status(404).send('Error: Group not found or unauthorised');
        }

        let foundUser = findUserInGroup(foundGroup, userIdToken);
        if (!foundUser) {
            return res.status(401).send('Error: You are not a member of the group');
        }

        let censoredGroup;
        if (LIST_GROUP_PARENT_VARIANTS.includes(foundGroup.groupVariant)) {
            censoredGroup = await findAndCensorChildGroups(userIdToken.toString(), foundGroup);
        } else {
            censoredGroup = censorSingularGroup(userIdToken.toString(), foundGroup);
        }

        return res.status(200).json(censoredGroup);
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
            return res.status(400).json({ errors: errors.array().toString() });
        }

        const tokenUserId = req.user._id;
        const tokenDisplayName = req.user.displayName;
        const { groupVariant, groupName, parentGroupId } = req.body;

        let result;
        try {
            result = await addGroup(tokenUserId, tokenDisplayName, groupVariant, groupName, res, parentGroupId);
            return result;
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// TODO When an individual leaves post a system message if applicable.
// @route PUT api/groups/:groupid/leave
// @desc Leave a group if a member
// @access Private
router.put('/:groupid/leave', authMiddleware, async (req: Request, res: Response) => {
    console.log('PUT /api/groups/:groupid/leave hit');

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    try {
        const foundGroup = await ListGroupBaseModel.findOne({ _id: groupIdParams });

        if (!foundGroup) {
            return res.status(404).send('Error: Group not found');
        }

        const foundUser = findUserInGroup(foundGroup, userIdToken);
        if (!foundUser) {
            return res.status(400).send('Error: You are not a member of the group');
        }

        if (LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
            return res.status(400).send('Error: You cannot leave child groups directly');
        }

        await ListGroupBaseModel.findOneAndUpdate(
            { _id: groupIdParams },
            { $pull: { members: { userId: userIdToken } } }
        );

        if (LIST_GROUP_PARENT_VARIANTS.includes(foundGroup.groupVariant)) {
            await ListGroupBaseModel.updateMany(
                { parentGroupId: groupIdParams },
                { $pull: { members: { userId: userIdToken } } }
            );
        }
        return res.status(200).send('Successfully left group');
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
        const { status, msg } = await findAndDeleteGroupAndAnyChildGroupsIfAllowed(userId, groupId);

        return res.status(status).send(msg);
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

        if (userIdToken === targetUserId) {
            return res.status(400).send('Error: You cannot modify your own permissions');
        }

        try {
            const foundGroup = await ListGroupBaseModel.findOne({ _id: groupIdParams });

            if (!foundGroup) {
                return res.status(404).send('Error: Group not found');
            }

            if (LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
                return res.status(400).send('Error: Users cannot be invited directly to child groups');
            }

            const foundRequestingUser = findUserInGroup(foundGroup, userIdToken);
            if (!foundRequestingUser || !foundRequestingUser.permissions.includes(PERM_GROUP_MANAGE_PERMS)) {
                return res.status(401).send('Error: Unauthorized');
            }

            const foundTargetUser = findUserInGroup(foundGroup, targetUserId);
            if (!foundTargetUser) {
                return res.status(404).send('Error: Target user not found in group');
            }

            if (foundTargetUser.permissions.includes(PERM_GROUP_OWNER)) {
                return res.status(401).send('Error: You cannot modify permissions of the group owner');
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

        if (userIdToken === targetUserId) {
            return res.status(400).send('Error: You cannot kick yourself');
        }

        try {
            const foundGroup = await ListGroupBaseModel.findOne({ _id: groupIdParams });

            if (!foundGroup) {
                return res.status(404).send('Error: Group not found');
            }

            if (LIST_GROUP_CHILD_VARIANTS.includes(foundGroup.groupVariant)) {
                return res.status(400).send('Error: Users cannot be kicked from child groups');
            }

            const foundRequestingUser = findUserInGroup(foundGroup, userIdToken);
            if (!foundRequestingUser || !foundRequestingUser.permissions.includes(PERM_GROUP_KICK)) {
                return res.status(401).send('Error: Unauthorized');
            }

            const foundTargetUser = findUserInGroup(foundGroup, userIdToken);
            if (!foundTargetUser) {
                return res.status(404).send('Error: Target user not found in group');
            }

            if (foundTargetUser.permissions.includes(PERM_GROUP_OWNER)) {
                return res.status(401).send('Error: You cannot kick the group owner');
            }

            await foundGroup.update({ $pull: { members: { userId: targetUserId } } });
            return res.status(200);
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Internal server error');
        }
    }
);

// @route PUT api/groups/:groupid/rename
// @desc Rename a group
// @access Private
router.put(
    '/:groupid/rename',
    authMiddleware,
    check('newName', 'newName is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('put /api/groups/:groupid/rename hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { newName } = req.body;

        try {
            const foundGroup = await ListGroupBaseModel.findOne({ _id: groupIdParams });

            if (!foundGroup) {
                return res.status(400).send('Error: Group not found');
            }

            const foundUser = findUserInGroup(foundGroup, userIdToken);
            if (!foundUser || !foundUser.permissions.includes(PERM_GROUP_RENAME)) {
                return res.status(401).send('Error: Unauthorized');
            }

            const result = await findOneAndUpdateUsingDiscriminator(
                foundGroup.groupVariant,
                { _id: foundGroup._id },
                { groupName: newName },
                { new: true }
            );

            return res.status(200).json(result);
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

module.exports = router;

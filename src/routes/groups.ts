import express, { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import ListGroup, {
    CHILD_GROUP_TYPES,
    IgroupMember,
    PARENT_GROUP_TYPES,
    SINGLE_GROUP_TYPES,
    TlistGroupAny,
    TlistGroupChildBase,
    TlistGroupParentBase,
    TlistGroupSingleBase,
} from '../models/ListGroup';

const router: Router = express.Router();

// @route GET api/groups/user/:userid
// @desc Get a user's own groups
// @access Private
router.get('/user/:userid', auth, async (req: Request, res: Response) => {
    console.log('GET /api/groups/:userid hit');

    const userIdParams = req.params.userid;
    const userIdToken = req.user._id;

    if (userIdParams !== userIdToken.toString()) {
        return res.status(401).json({ msg: 'User not authorized' });
    }

    try {
        let foundMemberGroups = await ListGroup.find({
            $or: [{ 'owner.userId': userIdParams }, { 'members.userId': userIdParams }],
        });
        let foundOwnedGroups: TlistGroupAny[] = [];

        for (var i = foundMemberGroups.length - 1; i >= 0; i--) {
            let document = foundMemberGroups[i];
            if (document.owner.userId.toString() === userIdParams) {
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

// @route POST api/groups/single
// @desc Add a new single group
// @access Private
router.post(
    '/single',
    auth,
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupType', 'groupType is required').not().isEmpty(),
    check('groupType', 'groupType is not a valid single group type').isIn(SINGLE_GROUP_TYPES),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/single hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupType, groupName } = req.body;
        const owner: IgroupMember = { userId: userIdToken, permissions: [] };

        const newListGroupData: TlistGroupSingleBase = { owner, groupType, groupName };

        try {
            const newListGroup: TlistGroupAny = new ListGroup(newListGroupData);
            await newListGroup.save();
            return res.status(200).json(newListGroup);
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route POST api/groups/child
// @desc Add a new child group
// @access Private
router.post(
    '/child',
    auth,
    check('groupType', 'groupType is not a valid child group type').isIn(CHILD_GROUP_TYPES),
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupType', 'groupType is required').not().isEmpty(),
    check('parentGroupId', 'parentGroupId is required for child groups').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/child hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupType, groupName, parentGroupId } = req.body;

        // Validation
        // The parent must exist and the user must be the owner or a member
        try {
            // const foundParentRecord = await ListGroup.findById(parentGroupId);
            const foundParentRecord = await ListGroup.findOne().and([
                { _id: parentGroupId },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': 'CHILD_GROUP_CREATE' },
                        { 'members.userId': userIdToken, 'owner.permissions': 'CHILD_GROUP_CREATE' },
                    ],
                },
            ]);

            console.log(foundParentRecord);
            if (!foundParentRecord) {
                return res.status(400).send('Invalid parentGroupId or unauthorized');
            }
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }

        // The user hasn't exceeded max number of allowable children

        const owner: IgroupMember = { userId: userIdToken, permissions: [] };
        const newListGroupData: TlistGroupChildBase = { owner, groupType, groupName, parentGroupId };

        try {
            const newListGroup: TlistGroupAny = new ListGroup(newListGroupData);
            await newListGroup.save();
            return res.status(200).json(newListGroup);
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route POST api/groups/parent
// @desc Add a new parent group
// @access Private
router.post(
    '/parent',
    auth,
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupType', 'groupType is required').not().isEmpty(),
    check('groupType', 'groupType is not a valid parent group type').isIn(PARENT_GROUP_TYPES),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/parent hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupType, groupName } = req.body;
        const owner: IgroupMember = { userId: userIdToken, permissions: ['CHILD_GROUP_CREATE'] };

        const newListGroupData: TlistGroupParentBase = { owner, groupType, groupName };

        try {
            const newListGroup: TlistGroupAny = new ListGroup(newListGroupData);
            await newListGroup.save();
            return res.status(200).json(newListGroup);
        } catch (err) {
            console.log({ ...err });
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route PUT api/groups/join/groupid
// @desc Join a group
// @access Private

// @route PUT api/groups/leave/groupid
// @desc Leave a group if a member
// @access Private

// @route DELETE api/groups/delete/groupid
// @desc Delete a group and all child groups if any
// @access Private

module.exports = router;

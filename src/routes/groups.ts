import express, { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import ListGroup, {
    CHILD_GROUP_TYPES,
    GROUP_TYPES,
    IgroupMember,
    TlistGroup,
    TlistGroupBase,
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
        const foundGroups = await ListGroup.find({
            $or: [{ 'owner.userId': userIdParams }, { 'members.userId': userIdParams }],
        });

        if (foundGroups.length == 0) {
            return res.status(404).json({ msg: 'No groups found' });
        }

        return res.status(200).json(foundGroups);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route POST api/groups
// @desc Add a new group
// @access Private
router.post(
    '/',
    auth,
    check('groupName', 'groupName is required').not().isEmpty(),
    check('groupType', 'groupType is required').not().isEmpty(),
    check('groupType', 'groupType is invalid').isIn(GROUP_TYPES),
    check('groupType')
        .if((value: string) => CHILD_GROUP_TYPES.includes(value))
        .custom((value, { req }) => req.body.parentGroupId !== undefined)
        .withMessage('Child groups must have a specified parentGroupId'),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupType, groupName, parentGroupId } = req.body;
        const owner: IgroupMember = { userId: userIdToken };

        const newListGroupData: TlistGroupBase = { owner, groupType, groupName, parentGroupId };

        try {
            const newListGroup: TlistGroup = new ListGroup(newListGroupData);
            await newListGroup.save();
            return res.status(200).json(newListGroup);
        } catch (err) {
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

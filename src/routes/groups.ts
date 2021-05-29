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

        const userIdToken = req.user?._id;
        const { groupType, groupName, parentGroupId } = req.body;
        //TODO fix this again
        //@ts-ignore
        const owner: IgroupMember = { userId: userIdToken };

        // build data obj if validation passes
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

module.exports = router;

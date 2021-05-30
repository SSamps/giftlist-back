import express, { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import ListGroupSingle, {
    SINGLE_GROUP_TYPES,
    TlistGroupSingle,
    TlistGroupSingleBase,
} from '../models/listGroups/ListGroupSingle';
import { IgroupMember, TlistGroupAny, TlistGroupAnyBase } from '../models/listGroups/ListGroupSharedTypes';
import ListGroupParent from '../models/listGroups/ListGroupParent';
import ListGroupChild from '../models/listGroups/ListGroupChild';

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
        let foundSingleGroups = await ListGroupSingle.find({
            $or: [{ 'owner.userId': userIdParams }, { 'members.userId': userIdParams }],
        });
        let foundParentGroups = await ListGroupParent.find({
            $or: [{ 'owner.userId': userIdParams }, { 'members.userId': userIdParams }],
        });
        let foundChildGroups = await ListGroupChild.find({
            $or: [{ 'owner.userId': userIdParams }, { 'members.userId': userIdParams }],
        });

        let foundGroups = [foundSingleGroups, foundParentGroups, foundChildGroups];
        let foundOwnedGroups: TlistGroupAnyBase[] = [];
        let foundMemberGroups: TlistGroupAnyBase[] = [];

        foundGroups.forEach((documentList) => {
            for (var i = documentList.length - 1; i >= 0; i--) {
                let document = documentList[i];
                console.log(document);
                if (document.owner.userId.toString() === userIdParams) {
                    foundOwnedGroups.push(document);
                } else {
                    foundMemberGroups.push(document);
                }
            }
        });

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
    check('groupType', 'groupType is invalid').isIn(SINGLE_GROUP_TYPES),
    async (req: Request, res: Response) => {
        console.log('POST /api/groups/single hit');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const { groupType, groupName } = req.body;
        const owner: IgroupMember = { userId: userIdToken };

        const newListGroupData: TlistGroupSingleBase = { owner, groupType, groupName };

        try {
            const newListGroup: TlistGroupSingle = new ListGroupSingle(newListGroupData);
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

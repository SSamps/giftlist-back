import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import { ListGroupBaseModel } from '../../models/listGroups/ListGroupBaseModel';
import { PERM_GROUP_RW_MESSAGES } from '../../models/listGroups/listGroupPermissions';
import { LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES } from '../../models/listGroups/variants/listGroupVariants';
import { TnewUserMessageFields } from '../../models/messages/messageInterfaces';
import { UserMessageModel } from '../../models/messages/variants/discriminators/UserMessageModel';

const router: Router = express.Router();

// @route GET api/groups/:groupid/messages
// @desc TEST ROUTE. Gets all messages in a group. Later will add this functionality to the group route.
// @access Private
router.get('/:groupid/messages', authMiddleware, async (req: Request, res: Response) => {
    console.log('GET api/groups/:groupid/messages');

    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userIdToken = req.user._id;
    const groupIdParams = req.params.groupid;

    try {
        let groupVariantKey = 'groupVariant';
        let foundGroup = await ListGroupBaseModel.findOne({
            $and: [
                { _id: groupIdParams, [groupVariantKey]: { $in: LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES } },
                {
                    $or: [
                        { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_RW_MESSAGES },
                        { 'members.userId': userIdToken, 'members.permissions': PERM_GROUP_RW_MESSAGES },
                    ],
                },
            ],
        });

        if (!foundGroup) {
            return res
                .status(400)
                .send('User is not an owner or member of the supplied group with the correct permissions');
        }

        let foundMessages = await UserMessageModel.find({ groupId: groupIdParams });

        return res.status(200).json({ messages: foundMessages });
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
});

// @route POST api/groups/:groupid/messages
// @desc Post a message to a list group
// @access Private
router.post(
    '/:groupid/messages',
    authMiddleware,
    check('body', 'A list item body is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('POST api/groups/:groupid/messages');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupIdParams = req.params.groupid;
        const { body } = req.body;

        try {
            let groupVariantKey = 'groupVariant';
            let foundGroup = await ListGroupBaseModel.findOne({
                $and: [
                    { _id: groupIdParams, [groupVariantKey]: { $in: LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES } },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_RW_MESSAGES },
                            { 'members.userId': userIdToken, 'members.permissions': PERM_GROUP_RW_MESSAGES },
                        ],
                    },
                ],
            });

            if (!foundGroup) {
                return res
                    .status(404)
                    .send('User is not an owner or member of the supplied group with the correct permissions');
            }

            const newMessageFields: TnewUserMessageFields = { author: userIdToken, groupId: groupIdParams, body: body };
            const newMessage = new UserMessageModel(newMessageFields);
            await newMessage.save();
            return res.status(200).send();
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

// @route POST api/groups/:groupid/messages/:messageid
// @desc Delete an item from a list group
// @access Private
router.delete('/messages/:messageid', authMiddleware, async (req: Request, res: Response) => {
    console.log('DELETE api/groups/:groupid/messages/:messageid');

    const userIdToken = req.user._id;
    const messageIdParams = req.params.messageid;

    try {
        let removedMessage = await UserMessageModel.findOneAndRemove({ _id: messageIdParams, author: userIdToken });

        if (!removedMessage) {
            return res.status(404).send();
        }

        return res.status(200).send();
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;

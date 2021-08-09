import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { check, Result, ValidationError, validationResult, oneOf } from 'express-validator';
import { ListGroupBaseModel } from '../../models/listGroups/ListGroupBaseModel';
import {
    PERM_GROUP_RW_LIST_ITEMS,
    PERM_GROUP_RW_SECRET_LIST_ITEMS,
    PERM_GROUP_SELECT_LIST_ITEMS,
    PERM_GROUP_SELECT_SECRET_LIST_ITEMS,
} from '../../models/listGroups/listGroupPermissions';
import { GIFT_LIST } from '../../models/listGroups/variants/discriminators/singular/GiftListModel';
import {
    findItemInGroup,
    findItemsInGroup,
    findOneAndUpdateUsingDiscriminator,
    findUserPermissionsInGroup,
    handleNewListItemRequest,
    handleNewSecretListItemRequest,
} from '../helperFunctions';
import { BASIC_LIST } from '../../models/listGroups/variants/discriminators/singular/BasicListModel';

const router: Router = express.Router();

// @route POST api/groups/:groupid/items
// @desc Add an item to a list group
// @access Private
router.post(
    '/:groupid/items',
    authMiddleware,
    oneOf([
        check('listItem', 'A list item or secret list item object is required').not().isEmpty(),
        check('secretListItem', 'A list item or secret list item object is required').not().isEmpty(),
    ]),
    async (req: Request, res: Response) => {
        console.log('POST api/groups/giftlist/:groupid/items');
        console.log('request body: ', req.body);

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const { listItem, secretListItem } = req.body;

        if (listItem && secretListItem) {
            return res.status(400).send('You cannot specify a new list item and secret list item in the same request');
        }

        let result;
        try {
            if (listItem) {
                result = await handleNewListItemRequest(userIdToken, groupId, listItem, res);
            } else if (secretListItem) {
                result = await handleNewSecretListItemRequest(userIdToken, groupId, secretListItem, res);
            }
            return result;
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

// @route DELETE api/groups/:groupid/items/:itemid
// @desc Delete an item from a list group
// @access Private
router.delete(
    '/:groupid/items',
    authMiddleware,
    check('itemsToDelete', 'You must specify an array of items ids to delete').isArray(),
    check('itemsToDelete', 'You must specify a populated array of items ids to delete').not().isEmpty(),
    check('itemsToDelete.*', 'You must specify an array of items ids to delete').isString(),
    async (req: Request, res: Response) => {
        console.log('DELETE api/groups/:groupid/items');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const itemsToDelete: string[] = req.body.itemsToDelete;

        try {
            const foundGroup = await ListGroupBaseModel.findOne({
                $and: [
                    { _id: groupId },
                    {
                        $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
                    },
                ],
            });

            if (!foundGroup) {
                return res.status(404).send();
            }

            const foundItems = findItemsInGroup(foundGroup, itemsToDelete);
            if (foundItems.length <= 0) {
                return res.status(404).send('Item not found');
            }

            if (foundGroup.groupVariant === GIFT_LIST) {
                for (let i = 0; i < foundItems.length; i++) {
                    if (foundItems[i].authorId.toString() !== userIdToken.toString()) {
                        return res.status(401).send('You can only delete your own items in a Gift List');
                    }
                }
            }

            let result = await findOneAndUpdateUsingDiscriminator(
                foundGroup.groupVariant,
                { _id: groupId },
                { $pull: { listItems: { _id: { $in: itemsToDelete } }, secretListItems: { _id: itemsToDelete } } },
                { new: true }
            );

            return res.status(200).json(result);
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

// @route PUT api/groups/:groupid/items/:itemid
// @desc Modify an item in a list group
// @access Private
router.put(
    '/:groupid/items/:itemid',
    authMiddleware,
    check('body', 'A list item body is required').not().isEmpty(),
    check('links', 'A list item body is required').isArray(),
    check('links.*', 'All links must be strings').isString(),
    async (req: Request, res: Response) => {
        console.log('PUT api/groups/:groupid/items:itemid');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const itemId = req.params.itemid;
        const { body, links } = req.body;

        try {
            const foundGroup = await ListGroupBaseModel.findOne({
                $and: [
                    { _id: groupId, groupVariant: { $in: [GIFT_LIST, BASIC_LIST] } },
                    {
                        $or: [
                            { 'owner.userId': userIdToken, 'owner.permissions': PERM_GROUP_RW_LIST_ITEMS },
                            { 'members.userId': userIdToken, 'members.permissions': PERM_GROUP_RW_SECRET_LIST_ITEMS },
                        ],
                    },
                ],
            });

            if (!foundGroup) {
                return res.status(404).send();
            }

            const [itemType, foundItem] = findItemInGroup(foundGroup, itemId);
            if (!foundItem) {
                return res.status(404).send('Item not found');
            }

            if (foundItem.authorId.toString() !== userIdToken.toString()) {
                return res.status(401).send('You can only modify your own items');
            }

            let queryItemType = itemType + 's';
            let bodyQuery = `${queryItemType}.$[item].body`;
            let linksQuery = `${queryItemType}.$[item].links`;

            let result = await findOneAndUpdateUsingDiscriminator(
                foundGroup.groupVariant,
                { _id: foundGroup._id },
                { $set: { [bodyQuery]: body, [linksQuery]: links } },
                { new: true, arrayFilters: [{ 'item._id': itemId }] }
            );

            return res.status(200).json(result);
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

// @route PUT api/groups/:groupid/items/:itemid/select
// @desc Select or deselect an item in a list group
// @access Private
router.put(
    '/:groupid/items/:itemid/select',
    authMiddleware,
    check('action', 'You must specify an action in the request body').not().isEmpty(),
    check('action', 'action must be either select or deselect').isIn(['SELECT', 'DESELECT']),
    async (req: Request, res: Response) => {
        console.log('PUT api/groups/:groupid/items/:itemid/select');

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userIdToken = req.user._id;
        const groupId = req.params.groupid;
        const itemId = req.params.itemid;
        const { action }: { action: 'SELECT' | 'DESELECT' } = req.body;

        try {
            const foundGroup = await ListGroupBaseModel.findOne({
                $and: [
                    { _id: groupId, groupVariant: { $in: [BASIC_LIST, GIFT_LIST] } },
                    {
                        $or: [{ 'owner.userId': userIdToken }, { 'members.userId': userIdToken }],
                    },
                ],
            });

            if (!foundGroup) {
                return res.status(404).send('You are not a member or owner of a group with the supplied id');
            }

            const [itemType, foundItem] = findItemInGroup(foundGroup, itemId);

            if (!foundItem) {
                return res.status(404).send('Item not found in the specified group');
            }

            let userPermissions = findUserPermissionsInGroup(userIdToken.toString(), foundGroup);

            if (itemType === 'listItem') {
                if (!userPermissions.includes(PERM_GROUP_SELECT_LIST_ITEMS)) {
                    return res.status(401).send('You are not authorised to select list items in this group');
                }
            } else if (itemType === 'secretListItem') {
                if (!userPermissions.includes(PERM_GROUP_SELECT_SECRET_LIST_ITEMS)) {
                    return res.status(401).send('You are not authorised to select secret list items in this group');
                }
            }

            const searchQuery = { _id: groupId };
            const updateQueryItemType = itemType + 's';
            let updateQuery;

            if (foundGroup.groupVariant === BASIC_LIST) {
                const updateQueryKey = `${updateQueryItemType}.$[item].selected`;
                const updateQueryValue = action === 'SELECT' ? true : false;
                updateQuery = { [updateQueryKey]: updateQueryValue };
            } else {
                const updateQueryKey = `${updateQueryItemType}.$[item].selectedBy`;
                const updateQueryValue = userIdToken;
                const updateQueryOperator = action === 'SELECT' ? '$addToSet' : '$pull';
                updateQuery = { [updateQueryOperator]: { [updateQueryKey]: updateQueryValue } };
            }

            const options = { new: true, arrayFilters: [{ 'item._id': itemId }] };

            const result = await findOneAndUpdateUsingDiscriminator(
                foundGroup.groupVariant,
                searchQuery,
                updateQuery,
                options
            );

            return res.status(200).json(result);
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }
    }
);

module.exports = router;

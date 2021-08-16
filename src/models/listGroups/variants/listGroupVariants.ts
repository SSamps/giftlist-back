import { GIFT_GROUP_CHILD } from './discriminators/child/GiftGroupChildModel';
import { GIFT_GROUP } from './discriminators/parent/GiftGroupModel';
import { BASIC_LIST } from './discriminators/singular/BasicListModel';
import { GIFT_LIST } from './discriminators/singular/GiftListModel';

export const LIST_GROUP_SINGLE_VARIANTS = [BASIC_LIST, GIFT_LIST];
export const LIST_GROUP_PARENT_VARIANTS = [GIFT_GROUP];
export const LIST_GROUP_CHILD_VARIANTS = [GIFT_GROUP_CHILD];
export const LIST_GROUP_ALL_VARIANTS = [
    ...LIST_GROUP_SINGLE_VARIANTS,
    ...LIST_GROUP_PARENT_VARIANTS,
    ...LIST_GROUP_CHILD_VARIANTS,
];

// All groups which are not children
export const LIST_GROUP_ALL_TOP_LEVEL_VARIANTS = [...LIST_GROUP_SINGLE_VARIANTS, ...LIST_GROUP_PARENT_VARIANTS];

// Has items of any kind
export const LIST_GROUP_ALL_WITH_ANY_ITEMS = [GIFT_LIST, GIFT_GROUP_CHILD, BASIC_LIST];

// Has secretListItems
export const LIST_GROUP_ALL_WITH_SECRET_ITEMS = [GIFT_LIST, GIFT_GROUP_CHILD];

// Has regular ListItems
export const LIST_GROUP_ALL_WITH_REGULAR_ITEMS = [GIFT_LIST, GIFT_GROUP_CHILD, BASIC_LIST];

// Has messages
export const LIST_GROUP_ALL_WITH_MESSAGES = [GIFT_LIST, GIFT_GROUP_CHILD];

// All groups must fall into one of these categories
export const LIST_GROUP_ALL_CENSORABLE = [GIFT_LIST, GIFT_GROUP_CHILD];
export const LIST_GROUP_ALL_CENSORABLE_CHILDREN = [GIFT_GROUP];
export const LIST_GROUP_ALL_NON_CENSORABLE = [BASIC_LIST];

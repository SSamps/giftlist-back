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

export const LIST_GROUP_ALL_VARIANTS_WITH_MESSAGES = [GIFT_GROUP_CHILD, GIFT_LIST];
export const LIST_GROUP_ALL_TOP_LEVEL_VARIANTS = [...LIST_GROUP_SINGLE_VARIANTS, ...LIST_GROUP_PARENT_VARIANTS];

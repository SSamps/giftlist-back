import { GIFT_GROUP_CHILD } from '../child/GiftGroupChild';
import { GIFT_GROUP } from '../parent/GiftGroup';
import { BASIC_LIST } from '../singular/BasicList';
import { GIFT_LIST } from '../singular/GiftList';

export const LIST_GROUP_SINGLE_VARIANTS = [BASIC_LIST, GIFT_LIST];
export const LIST_GROUP_PARENT_VARIANTS = [GIFT_GROUP];
export const LIST_GROUP_CHILD_VARIANTS = [GIFT_GROUP_CHILD];
export const LIST_GROUP_ALL_VARIANTS = [
    ...LIST_GROUP_SINGLE_VARIANTS,
    ...LIST_GROUP_PARENT_VARIANTS,
    ...LIST_GROUP_CHILD_VARIANTS,
];

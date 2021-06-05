import { GIFT_GROUP_CHILD } from '../child/ListGroupChild';
import { GIFT_GROUP } from '../parent/ListGroupParent';
import { BASIC_LIST } from '../singular/BasicList';
import { GIFT_LIST } from '../singular/GiftList';

export const LIST_GROUP_SINGLE_VARIANTS = [BASIC_LIST, GIFT_LIST];
export const LIST_GROUP_PARENT_VARIANTS = [GIFT_GROUP];
export const LIST_GROUP_CHILD_VARIANTS = [GIFT_GROUP_CHILD];

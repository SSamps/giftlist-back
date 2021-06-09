import { GIFT_GROUP_CHILD } from '../discriminators/child/GiftGroupChild';
import { GIFT_GROUP } from '../discriminators/parent/GiftGroup';
import { BASIC_LIST } from '../discriminators/singular/BasicList';
import { GIFT_LIST } from '../discriminators/singular/GiftList';

export const LIST_GROUP_SINGLE_VARIANTS = [BASIC_LIST, GIFT_LIST];
export const LIST_GROUP_PARENT_VARIANTS = [GIFT_GROUP];
export const LIST_GROUP_CHILD_VARIANTS = [GIFT_GROUP_CHILD];

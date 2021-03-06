import { Schema } from 'mongoose';
import { ListGroupBaseModel } from '../../../ListGroupBaseModel';
import { PERM_GIFT_GROUP_ALL } from '../../../listGroupPermissions';
import { TgiftGroupFields } from '../../../listGroupInterfaces';
import { GIFT_GROUP } from '../../listGroupVariants';

const giftGroupSchema = new Schema<TgiftGroupFields>({
    members: [
        {
            userId: { type: Schema.Types.ObjectId, required: true },
            displayName: { type: String, required: true },
            permissions: [{ type: String, required: true, enum: PERM_GIFT_GROUP_ALL }],
            oldestUnreadMsg: { type: Date },
            _id: false,
        },
    ],
});

export const GiftGroupModel = ListGroupBaseModel.discriminator(GIFT_GROUP, giftGroupSchema);

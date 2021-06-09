import { Schema } from 'mongoose';
import { GiftGroupChildModel } from '../models/listGroups/discriminators/child/GiftGroupChild';
import { listGroupBaseModel } from '../models/listGroups/ListGroupBase';
import { GiftGroupModel } from '../models/listGroups/discriminators/parent/GiftGroup';
import { PERM_GROUP_DELETE } from '../models/listGroups/permissions/listGroupPermissions';
import { LIST_GROUP_PARENT_VARIANTS } from '../models/listGroups/discriminators/variants/listGroupVariants';

export interface IgroupDeletionResult {
    status: number;
    msg: string;
}

export async function deleteGroupAndAnyChildGroups(
    userId: Schema.Types.ObjectId,
    groupId: string
): Promise<IgroupDeletionResult> {
    var foundGroup = await listGroupBaseModel.findOne().and([
        { _id: groupId },
        {
            $or: [
                { 'owner.userId': userId, 'owner.permissions': PERM_GROUP_DELETE },
                { 'members.userId': userId, 'members.permissions': PERM_GROUP_DELETE },
            ],
        },
    ]);

    if (!foundGroup) {
        return { status: 400, msg: 'Invalid groupId or unauthorized' };
    }

    // TODO Delete all associated list items and messages

    if (!LIST_GROUP_PARENT_VARIANTS.includes(foundGroup.groupVariant)) {
        await listGroupBaseModel.deleteOne({ _id: groupId });
        return { status: 200, msg: 'Group deleted' };
    } else {
        await GiftGroupModel.deleteOne({ _id: groupId });
        await GiftGroupChildModel.deleteMany({ parentGroupId: groupId });
        return { status: 200, msg: 'Parent group and all child groups deleted' };
    }
}

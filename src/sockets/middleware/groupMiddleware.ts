import { IUserCensoredProps } from '../../models/User';
import { Socket } from 'socket.io/dist/socket';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ExtendedError } from 'socket.io/dist/namespace';
import { ListGroupBaseModel } from '../../models/listGroups/ListGroupBaseModel';
import { findUserInGroup } from '../../misc/helperFunctions';

export const socketGroupMiddleware = async (
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>,
    next: (err?: ExtendedError | undefined) => void
) => {
    const user: IUserCensoredProps = socket.data.user;
    const groupId = socket.handshake.query.groupId as string;
    try {
        let foundGroup = await ListGroupBaseModel.findOne({ _id: groupId }).lean();

        if (!foundGroup) {
            next(new Error('Group not found'));
            return;
        }

        let foundUser = findUserInGroup(foundGroup, user._id);
        if (!foundUser || !foundUser.permissions.includes('GROUP_RW_MESSAGES')) {
            next(new Error('Unauthorized'));
            return;
        }

        next();
    } catch (err) {
        console.error(err.message);
        next(new Error('Unauthorized'));
        return;
    }
};

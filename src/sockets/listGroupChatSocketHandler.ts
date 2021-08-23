import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { MessageBaseModel } from '../models/messages/MessageBaseModel';
import { TnewUserMessageFields } from '../models/messages/messageInterfaces';
import { UserMessageModel } from '../models/messages/variants/discriminators/UserMessageModel';
import { IUserCensoredProps } from '../models/User';
import { socketAuthMiddleware } from './middleware/authMiddleware';
import { socketGroupMiddleware } from './middleware/groupMiddleware';

const listGroupChatSocketHandler = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>) => {
    io.use(socketAuthMiddleware);
    io.use(socketGroupMiddleware);

    io.on('connection', (socket) => {
        const user: IUserCensoredProps = socket.data.user;
        const groupId = socket.handshake.query.groupId as string;
        io.emit(`you have connected to the chat functionality ${user.displayName}`);

        socket.on('giftListChat:joinRoom', async () => {
            console.log('joining: ', groupId);
            socket.join(groupId);
            socket.broadcast.to(groupId).emit('giftListChat:message', `${user.displayName} has joined the chat`);

            const foundMessages = await MessageBaseModel.find({ groupId: groupId });

            socket.emit('giftListChat:joinRoom-success', foundMessages);
        });

        socket.on('giftListChat:postMessage', async (body) => {
            const newMessageFields: TnewUserMessageFields = {
                author: user._id,
                groupId: groupId,
                body: body,
            };
            const newMessage = new UserMessageModel(newMessageFields);
            try {
                const savedMessage = await newMessage.save();
                io.to(groupId).emit('giftListChat:newMessage', savedMessage);
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('disconnect', () => {
            console.log('a user disconnected from the socket');
        });
    });
};

export default listGroupChatSocketHandler;

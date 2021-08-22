import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
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

        socket.on('giftListChat:joinRoom', () => {
            console.log('joining: ', groupId);
            socket.join(groupId);
            socket.emit('giftListChat:joinRoom-success');
            socket.broadcast.to(groupId).emit('giftListChat:message', `${user.displayName} has joined the chat`);
        });

        socket.on('Button clicked', (data) => {
            console.log('someone clicked the button');
            io.to(groupId).emit('giftListChat:message', "I'm the backend telling you someone clicked the button");
        });

        socket.on('disconnect', () => {
            console.log('a user disconnected from the socket');
        });
    });
};

export default listGroupChatSocketHandler;

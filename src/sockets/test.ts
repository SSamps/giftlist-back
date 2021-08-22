import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { socketAuthMiddleware } from './middleware/authMiddleware';

const something = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>) => {
    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        console.log('a user connected to the socket');
        console.log(socket.data.user);

        socket.on('Button clicked', (data) => {
            console.log(data);

            console.log(data.var1);
            console.log(data.var2);
            console.log('someone clicked the button');
            io.emit('message', "I'm the backend telling you someone clicked the button");
        });

        socket.on('disconnect', () => {
            console.log('a user disconnected from the socket');
        });
    });
};

export default something;

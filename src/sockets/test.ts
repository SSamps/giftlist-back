import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

const something = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>) => {
    io.on('connection', (socket) => {
        console.log('a user connected to the socket');

        socket.on('disconnect', () => {
            console.log('a user disconnected from the socket');
        });
    });
};

export default something;

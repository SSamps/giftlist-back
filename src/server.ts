// ------
// IMPORTANT: if running locally (not in a container) you need to either install the package "dotenv", using it as below OR set the env vars described in the README on your local system. When running in a container the script "dockerBuildContainer" in package.json will set these env vars using the .env file without requiring the "dotenv" package.
// import dotenv from 'dotenv';
// dotenv.config({ path: './.env' });
// ------

// Other Imports
import express, { Application } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './db';
import cors from 'cors';
import listGroupChatSocketHandler from './sockets/listGroupChatSocketHandler';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Env Vars
const MONGO_URI = process.env.MONGO_URI;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Connect to database
connectDB(MONGO_URI);

// Express configuration
const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;

// // Init middleware
app.use(express.json() as express.RequestHandler);
app.use(cors());

// Define Routes
app.use('/api/users', require('./rest/routes/users'));
app.use('/api/auth', require('./rest/routes/auth'));
app.use('/api/groups', require('./rest/routes/groups/groups'));
app.use('/api/groups', require('./rest/routes/groups/groupItems'));
app.use('/api/groups', require('./rest/routes/groups/groupInvites'));
app.use('/api/admin', require('./rest/routes/admin'));
// Disabled
// app.use('/api/groups', require('./rest/routes/groups/groupMessages'));

// Socket.io configuration
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: '*' } });
const pubClient = createClient({ host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
listGroupChatSocketHandler(io);

// Start app
server.listen(PORT, () => {
    console.log('Server started on port ' + PORT);
});

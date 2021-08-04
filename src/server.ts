// ------
// IMPORTANT: if running locally (not in a container) you need to either install the package "dotenv", using it as below OR set the env vars described in the README on your local system. When running in a container the script "dockerBuildContainer" in package.json will set these env vars using the .env file without requiring the "dotenv" package.
// import dotenv from 'dotenv';
// dotenv.config({ path: './.env' });
// ------

// Other Imports
import express, { Application } from 'express';
import connectDB from './db';
import cors from 'cors';

// Express configuration
const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;

// Connect to database
connectDB(process.env.MONGO_URI);

// // Init middleware
app.use(express.json() as express.RequestHandler);
app.use(cors());

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups/groups'));
app.use('/api/groups', require('./routes/groups/groupMessages'));
app.use('/api/groups', require('./routes/groups/groupItems'));
app.use('/api/groups', require('./routes/groups/groupInvites'));

// Start app
app.listen(PORT, () => {
    console.log('Server started on port ' + PORT);
});

// TODO IMPORTANT Sanitise all data sent to endpoints
// TODO standardise error responses
// TODO standardise logging/

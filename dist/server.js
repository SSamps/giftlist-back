"use strict";
// ------
// IMPORTANT: if running locally (not in a container) you need to either install the package "dotenv", using it as below OR set the env vars described in the README on your local system. When running in a container the script "dockerBuildContainer" in package.json will set these env vars using the .env file without requiring the "dotenv" package.
// import dotenv from 'dotenv';
// dotenv.config({ path: './.env' });
// ------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Other Imports
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./db"));
const cors_1 = __importDefault(require("cors"));
// Express configuration
const app = express_1.default();
const PORT = process.env.PORT || 5000;
// Connect to database
db_1.default(process.env.MONGO_URI);
// // Init middleware
app.use(express_1.default.json());
app.use(cors_1.default());
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
// TODO standardise logging

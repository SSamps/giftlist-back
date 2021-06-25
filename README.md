# giftlistback
# Requirements
## File Modifications

Requires an .env file in the root directory with the following values set to run in containers. If running locally you must also include a .env file along with the package "dotenv" OR these env vars must be set on your system.

MONGO_URI
JWT_SECRET

The application is also configured with the following env vars which have defaults:

EXAMPLE_VAR: defaultValue
PORT: 5000

## Global Dependencies

The following dependencies must be installed with npm install -g [dependency]

node
npm
nodemon
concurrently
docker

## Docker Configuration
When running locally in order for the front and back ends to connect to each other they need to connect to the same docker network. The "npm run dev" script is expecting a docker network called "gift-list" to exist. You can create this using the following command:

docker network create gift-list

## Commands
Run "npm install" to download the project dependencies

# Optional Global Dependencies
## Madge

You can use madge to identify circular dependencies with the following command:

> madge ./ --circular --extensions ts

You can also use madge to generate a dependency graph using the following command:

> madge ./ --extensions ts -i dependencyGraph.png

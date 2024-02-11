# Requirements

## File Modifications

The back end requires an .env file in the root directory with the following values set to run in containers.

| Environment Variable | Description                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------- |
| MONGO_URI            | The connection details including credentials of the mongoDB                                   |
| JWT_SECRET           | A secret password to be used by jsonwebtoken                                                  |
| POSTMARK_API_KEY     | The connection details including credentials of the postmark API                              |
| REDIS_HOST           | The hostname (URI) of the Redis DB used by the socket.io implementation                       |
| REDIS_PORT           | The port of the Redis DB                                                                      |
| REDIS_PASSWORD       | The password of the Redis DB                                                                  |
| PORT                 | The port the application will run on. A default of 5000 is provived and is expected by docker |

Note if running outside of a docker container you must also include the package "dotenv" OR these env vars must be set on your system. The code to configure dotenv is located in a comment at the top of server.ts.

## Node & node packages

Node and the following dependencies should be installed with npm install -g [dependency] if you do not have them already.

-   npm
-   nodemon
-   typescript

## Docker

> Docker desktop is highly recommended.

While the app can be run locally without docker it has been designed to run inside docker containers using the provided npm scripts in package.json. This ensures a more consistent dev environment that more closely matches the production environment.

When running docker containers locally in order for the front and back end containers to connect to each other they need to be part of the same docker network. The "npm run dev" script is expecting a docker network called "gift-list" to exist. You can create this using the following command:

> docker network create gift-list

## Commands

> npm install

To install project dependencies

> npm run dev
> The command will do the following:

-   Build a new docker image of the project and start up a container with the name listapp-backend-dev. The app will be available on localhost:5000.
-   Delete any existing images and containers of the same name
-   Compile all typescript files to Javascript in the dist folder.
-   Set up a watch on typescript files using tsc -w. On save changes will be compiled to typescript in the dist folder.
-   Set up a watch on the project ignoring the src and .vscode folders using nodemon. Saved changes will rebuild the container and image.

# Optional Global Dependencies

## Madge

You can use madge to identify circular dependencies with the following command:

> madge ./ --circular --extensions ts

You can also use madge to generate a dependency graph using the following command:

> madge ./ --extensions ts -i dependencyGraph.png

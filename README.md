# giftlistback

Requires an .env file in the root directory with the following values set to run in containers. If running locally you must also include a .env file along with the package "dotenv" OR these env vars must be set on your system.

MONGO_URI
JWT_SECRET

The application is also configured with the following env vars which have defaults:

EXAMPLE_VAR: defaultValue
PORT: 5000

# Madge

You can use madge to identify circular dependencies with the following command:

> madge ./ --circular --extensions ts

You can also use madge to generate a dependency graph using the following command:

> madge ./ --extensions ts -i dependencyGraph.png

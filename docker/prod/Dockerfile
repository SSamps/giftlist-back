# Stage 1
FROM node:lts-alpine3.15 AS backEndS1
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build

# Stage 2
FROM node:lts-alpine3.15
WORKDIR /app
COPY --from=backEndS1 /app/dist ./dist
COPY --from=backEndS1 /app/node_modules ./node_modules
CMD node dist/server.js
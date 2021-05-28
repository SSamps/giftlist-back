# Stage 1
FROM node:current-alpine3.13 AS backEndS1
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Stage 2
FROM node:current-alpine3.13
WORKDIR /app
COPY --from=backEndS1 /app/dist ./dist
COPY --from=backEndS1 /app/node_modules ./node_modules
CMD node dist/server.js
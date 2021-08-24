FROM node:current-alpine3.14
WORKDIR /app
RUN npm install -g nodemon
COPY package*.json ./
RUN npm install
COPY . .
CMD ["nodemon", "dist/server.js"]
FROM node:21.6.0-slim as node

RUN apt-get update && apt-get install -y python3 python3-pip make g++ curl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "--trace-warnings", "index.js"]

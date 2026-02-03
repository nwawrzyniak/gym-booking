FROM node:25-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production || npm install --production

COPY . .

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server/js/main.js"]

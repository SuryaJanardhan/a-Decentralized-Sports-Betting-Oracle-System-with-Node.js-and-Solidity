FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build || echo "No build script"

EXPOSE 3001

CMD ["npm", "start"]

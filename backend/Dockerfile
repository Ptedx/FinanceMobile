FROM node:18-alpine

WORKDIR /app

# Install OpenSSL required for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3006

CMD ["npm", "start"]

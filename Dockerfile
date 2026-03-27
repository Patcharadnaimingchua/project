FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate   # ⭐ ต้องมีบรรทัดนี้

EXPOSE 3000

CMD ["npm", "run", "dev"]
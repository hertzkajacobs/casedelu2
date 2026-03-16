FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY server ./server
COPY prisma ./prisma
COPY tsconfig.base.json ./
RUN npm install

FROM base AS build
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000 3001 3002 4000
CMD ["npm", "run", "dev"]

# syntax=docker/dockerfile:1
ARG VITE_API_URL=http://localhost:5000/api

FROM node:20-alpine AS builder
WORKDIR /app

ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY vite.config.js ./
COPY index.html ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]

# 1) 빌드
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # → /app/dist 생성

# 2) 산출물만 제공 (compose에서 /usr/share/nginx/html을 react_build 볼륨으로 마운트)
FROM alpine:3.20 AS artifact
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./

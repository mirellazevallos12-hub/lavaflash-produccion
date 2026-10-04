FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY scripts ./scripts
RUN npm install --no-fund --no-audit
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/data-import ./data-import
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /app/data
EXPOSE 8080
CMD ["node","server/index.mjs"]

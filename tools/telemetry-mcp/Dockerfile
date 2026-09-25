FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY src ./src
USER node
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/server.mjs"]

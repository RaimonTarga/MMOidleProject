FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY bot/package.json ./bot/
COPY client/package.json ./client/
COPY admin/package.json ./admin/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @mmo-idle/shared build \
 && pnpm --filter @mmo-idle/server build \
 && pnpm --filter @mmo-idle/bot exec tsc

COPY experiment-runtime/worker.mjs /opt/mmo-experiment/worker.mjs
COPY experiment-runtime/build-metadata.json /opt/mmo-experiment/build-metadata.json

ENV NODE_ENV=development
ENV DEV_TOOLS=true
ENV AUTH_DEV_BYPASS=1

CMD ["node", "/opt/mmo-experiment/worker.mjs"]

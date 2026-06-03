# Mirrors what Railway does (Nixpacks): install all deps, build every workspace,
# then run the server (which serves the built client and connects to Postgres).
FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Install dependencies first for better layer caching. Copy only the manifests
# that affect the dependency graph, then install against the frozen lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build shared → client → server.
COPY . .
# Expose the server ops/telemetry map in the production client build. Vite reads
# VITE_-prefixed env vars at build time; without this SHOW_OPS_MAP is false in prod.
ENV VITE_ENABLE_OPS_MAP=true
# Bake in client dev tooling (test room, dev loadout, map teleport) when building
# the dev image. Defaults to false so the Railway-mirror build stays clean.
# `pnpm docker:up:dev` passes VITE_DEV_TOOLS=true; the matching runtime DEV_TOOLS
# env (set in docker-compose) flips the server's IS_DEV.
ARG VITE_DEV_TOOLS=false
ENV VITE_DEV_TOOLS=$VITE_DEV_TOOLS
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["pnpm", "--filter", "@mmo-idle/server", "start"]

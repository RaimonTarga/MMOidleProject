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
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["pnpm", "--filter", "@mmo-idle/server", "start"]

# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV CI=true

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate


# -----------------------
# Dependencies stage
# -----------------------
FROM base AS deps

ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN pnpm install --frozen-lockfile


# -----------------------
# Build stage
# -----------------------
FROM deps AS build

ARG VITE_API_BASE_URL=http://localhost:4000/api

# Only VITE_* vars are baked into the client bundle by Vite.
# API_BASE_URL is a server runtime var — injected via docker-compose at startup.
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY . .

RUN pnpm run build


# -----------------------
# Runtime stage
# -----------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

COPY --from=build --chown=node:node /app/.output ./.output

USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV CI=true

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
ARG VITE_API_BASE_URL=http://localhost:4000/api
ARG API_BASE_URL=http://localhost:4000/api
ARG VITE_DEV_BUSINESS_ID
ARG VITE_DEV_DEFAULT_TABLE_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    API_BASE_URL=${API_BASE_URL} \
    VITE_DEV_BUSINESS_ID=${VITE_DEV_BUSINESS_ID} \
    VITE_DEV_DEFAULT_TABLE_ID=${VITE_DEV_DEFAULT_TABLE_ID}
COPY . .
RUN npm run build

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


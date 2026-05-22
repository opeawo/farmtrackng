# syntax=docker/dockerfile:1.7
# Multi-stage build for SvelteKit (adapter-node) → Cloud Run.

# ---------- build stage ----------
FROM node:22-slim AS builder
WORKDIR /app

# Install dependencies (cached layer when lockfile unchanged)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Prune dev deps so the runtime image is lean
RUN npm prune --omit=dev

# ---------- runtime stage ----------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Copy built app and production node_modules from the builder stage
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node
EXPOSE 8080

CMD ["node", "build"]

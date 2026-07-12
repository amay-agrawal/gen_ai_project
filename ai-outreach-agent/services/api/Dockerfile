FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json ./
# Copy workspace packages
COPY packages/shared ./packages/shared
COPY services/api ./services/api

# Install dependencies (workspaces handle the linking)
RUN npm ci

# Build the shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build the API
WORKDIR /app/services/api
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/

WORKDIR /app/services/api

EXPOSE 4000

CMD ["node", "dist/index.js"]

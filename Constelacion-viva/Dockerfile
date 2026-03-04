# Multi-stage Dockerfile for Next.js frontend
# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* npm-shrinkwrap.json* ./

# Install dependencies based on lock file
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NODE_ENV=production

# Build Next.js
RUN npm run build

# ==============================
# Stage 3: Runtime
# ==============================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built standalone app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Fix permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000 > /dev/null || exit 1

ENV PORT=3000

CMD ["node", "server.js"]

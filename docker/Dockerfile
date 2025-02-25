FROM node:lts-alpine AS base

# Enable pnpm
RUN corepack enable pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /connect

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm i --frozen-lockfile;

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /connect
COPY --from=deps /connect/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build;

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /connect

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /connect/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /connect/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /connect/.next/static ./.next/static

USER nextjs

# EXPOSE port 3000 to allow communication to/from server
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
CMD ["node", "server.js"]

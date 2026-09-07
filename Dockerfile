FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libxkbcommon0 libasound2 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libxkbcommon0 libasound2 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

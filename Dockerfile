# syntax=docker/dockerfile:1.7

# ---------- build stage ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Toolchain nécessaire pour compiler better-sqlite3 (bindings natifs).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g bun@1.3.3

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---------- runtime stage ----------
# Reste sur debian/glibc pour rester ABI-compatible avec better-sqlite3.
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends nginx supervisor ca-certificates tzdata \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /etc/nginx/sites-enabled/default

# Fuseau horaire — par défaut Europe/Paris, surchargeable via TZ.
ENV TZ=Europe/Paris
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/5sproject.db
ENV PORT=3000
ENV HOST=127.0.0.1

# Bundle SSR node-server (vite build → .output/).
COPY --from=build /app/.output ./.output
COPY scripts ./scripts

# nginx + supervisor configs.
COPY nginx.conf /etc/nginx/conf.d/5sproject.conf
COPY supervisord.conf /etc/supervisord.conf

# Volume persistant pour la base SQLite.
RUN mkdir -p /data && chmod 777 /data
VOLUME ["/data"]
EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisord.conf"]

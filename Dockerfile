# syntax=docker/dockerfile:1.7

# ---------- build stage ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN npm install -g bun@1.3.3

# Variables VITE_ injectées au build (bakées dans le bundle client).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---------- runtime stage ----------
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
ENV PORT=3000
ENV HOST=127.0.0.1

# Bundle SSR node-server généré par vite build (.output/).
COPY --from=build /app/.output ./.output

# nginx + supervisor configs.
COPY nginx.conf /etc/nginx/conf.d/5sproject.conf
COPY supervisord.conf /etc/supervisord.conf

# Volume pour données persistantes (logs applicatifs, exports, cache).
RUN mkdir -p /data && chmod 777 /data
VOLUME ["/data"]
EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisord.conf"]

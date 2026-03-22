# ─────────────────────────────────────────────────────────────────────────────
# Empy TV — Multi-stage Docker build
#
# Stage 1: Build the Vite/React app
# Stage 2: Serve with nginx + reverse proxy for Bunny Storage API
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cached unless package.json changes)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source
COPY . .

# Build-time env vars for the client bundle (only CDN + YouTube key)
ARG VITE_YOUTUBE_API_KEY
ARG VITE_BUNNY_MOVIES_CDN

ENV VITE_YOUTUBE_API_KEY=$VITE_YOUTUBE_API_KEY
ENV VITE_BUNNY_MOVIES_CDN=$VITE_BUNNY_MOVIES_CDN

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Serve with nginx + Bunny Storage proxy
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Storage zone credentials (injected into nginx.conf, never in client JS)
ARG BUNNY_STORAGE_ZONE=empy-movies
ARG BUNNY_STORAGE_HOST=storage.bunnycdn.com
ARG BUNNY_STORAGE_PASSWORD=96aacac3-b651-40c8-9cbc92c3b3d0-c79a-457e

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template and inject storage credentials
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|__BUNNY_ZONE__|${BUNNY_STORAGE_ZONE}|g" /etc/nginx/conf.d/default.conf && \
    sed -i "s|__BUNNY_HOST__|${BUNNY_STORAGE_HOST}|g" /etc/nginx/conf.d/default.conf && \
    sed -i "s|__BUNNY_PASS__|${BUNNY_STORAGE_PASSWORD}|g" /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

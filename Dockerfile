# ─────────────────────────────────────────────────────────────────────────────
# Empy TV — Multi-stage Docker build
#
# Stage 1: Build the Vite/React app (env vars baked in at build time)
# Stage 2: Serve with nginx (lightweight, no Node.js in production)
#
# Build command (fill in your actual values):
#   docker build \
#     --build-arg VITE_YOUTUBE_API_KEY=<key> \
#     --build-arg VITE_BUNNY_LIBRARY_ID=<id> \
#     --build-arg VITE_BUNNY_STREAM_API_KEY=<key> \
#     --build-arg VITE_BUNNY_CDN_HOSTNAME=<hostname> \
#     --build-arg VITE_BUNNY_EDGE_API_URL=https://api.empy.my/movies \
#     -t yourdockerhubuser/empy-tv:latest .
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cached unless package.json changes)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source
COPY . .

# Declare build-time env vars (VITE_ prefix = available in browser bundle)
ARG VITE_YOUTUBE_API_KEY
ARG VITE_BUNNY_LIBRARY_ID
ARG VITE_BUNNY_STREAM_API_KEY
ARG VITE_BUNNY_CDN_HOSTNAME
ARG VITE_BUNNY_EDGE_API_URL

# Expose them to Vite build
ENV VITE_YOUTUBE_API_KEY=$VITE_YOUTUBE_API_KEY
ENV VITE_BUNNY_LIBRARY_ID=$VITE_BUNNY_LIBRARY_ID
ENV VITE_BUNNY_STREAM_API_KEY=$VITE_BUNNY_STREAM_API_KEY
ENV VITE_BUNNY_CDN_HOSTNAME=$VITE_BUNNY_CDN_HOSTNAME
ENV VITE_BUNNY_EDGE_API_URL=$VITE_BUNNY_EDGE_API_URL

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Serve with nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

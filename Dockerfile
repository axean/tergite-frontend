# As adapted from https://github.com/vercel/next.js/tree/canary/examples/with-docker
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# If using npm comment out above and use below instead
RUN npm run build

# Use the alpine nginx image as a base
FROM nginx:alpine
# Copy the local nginx configuration folder
ENV WEBGUI_ENDPOINT="http://$host$request_uri"
ENV MSS_ENDPOINT="http://$host$request_uri"
ENV API_BASE_URL=https://example.com
ENV JWT_SECRET="some-secret"
ENV COOKIE_NAME=tergiteauth
ENV OAUTH_REDIRECT_URI=""
ENV JWT_AUDIENCE="fastapi-users:auth"
ENV JWT_ALGORITHM="HS256"

COPY nginx /etc/nginx
# Set the working directory to the default nginx html directory
WORKDIR /usr/share/nginx/html
# Remove the existing web files
RUN rm -rf ./*
# Copy the files from the static next export
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown nginx:nginx /usr/share/nginx/html/*

LABEL org.opencontainers.image.licenses=APACHE-2.0
LABEL org.opencontainers.image.description="Landing page for the QAL9000 project at Chalmers University"

EXPOSE 80


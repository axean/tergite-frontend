# As adapted from https://github.com/vercel/next.js/tree/canary/examples/with-docker
FROM node:18-alpine 

USER node

WORKDIR /app

# Final environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 80
ENV HOSTNAME "0.0.0.0"
ENV WEBGUI_ENDPOINT="/"
ENV MSS_ENDPOINT="/"
ENV API_BASE_URL=""
ENV JWT_SECRET="some-secret"
ENV COOKIE_NAME=tergiteauth
ENV OAUTH_REDIRECT_URI=""
ENV JWT_AUDIENCE="fastapi-users:auth"
ENV JWT_ALGORITHM="HS256"

COPY ./public ./public
COPY package*.json ./
COPY dist ./.next
COPY node_modules ./node_modules

EXPOSE 80

LABEL org.opencontainers.image.licenses=APACHE-2.0
LABEL org.opencontainers.image.description="Landing page for the QAL9000 project at Chalmers University"

ENTRYPOINT [ "node_modules/next/dist/bin/next" ]

CMD [ "start" ]



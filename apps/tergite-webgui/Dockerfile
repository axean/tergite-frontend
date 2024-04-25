# As adapted from https://github.com/vercel/next.js/tree/canary/examples/with-docker
FROM node:18-alpine 

WORKDIR /app

# Final environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV API_BASE_URL "http://0.0.0.0:8002/v2"
ENV LANDING_ENDPOINT "https://www.example.com"
ENV WEBGUI_ENDPOINT "https://gui.example.com"
# ENV CONFIG_FILE 

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY ./public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

USER nextjs

EXPOSE 3000

LABEL org.opencontainers.image.licenses=APACHE-2.0
LABEL org.opencontainers.image.description="Dashboard for Quantum Computers in Chalmers University"

CMD ["node", "server.js"]

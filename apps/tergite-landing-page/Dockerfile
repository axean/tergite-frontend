# As adapted from https://github.com/vercel/next.js/tree/canary/examples/with-docker
FROM node:18-alpine 

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY ./public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static/ ./.next/static/

USER nextjs

# Final environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 80
ENV HOSTNAME "0.0.0.0"
ENV WEBGUI_ENDPOINT "/"
ENV MSS_ENDPOINT "/"
ENV API_BASE_URL ""
ENV OAUTH_REDIRECT_URI ""
# ENV CONFIG_FILE 

EXPOSE 80

LABEL org.opencontainers.image.licenses=APACHE-2.0
LABEL org.opencontainers.image.description="Landing page for the QAL9000 project at Chalmers University"

ENTRYPOINT [ "node" ]

CMD ["server.js"]



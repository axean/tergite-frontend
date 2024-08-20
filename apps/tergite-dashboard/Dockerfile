#Building the react app
FROM node:20-alpine as build

WORKDIR /app
ARG MSS_CONFIG_FILE
ARG VITE_API_BASE_URL

COPY package*.json ./
COPY --from=parent-folder $MSS_CONFIG_FILE ./mss-config.toml

RUN npm ci

COPY . .

RUN apk --no-cache add curl

# Get a TOML reader CLI 'dasel'
RUN curl -sSLf "$(curl -sSLf https://api.github.com/repos/tomwright/dasel/releases/latest | grep browser_download_url | grep linux_amd64 | grep -v .gz | cut -d\" -f 4)" -L -o dasel && chmod +x dasel
RUN 

# read auth config
RUN VITE_COOKIE_DOMAIN=$(cat ./mss-config.toml | ./dasel -r toml 'auth.cookie_domain')
RUN VITE_COOKIE_NAME=$(cat ./mss-config.toml | ./dasel -r toml 'auth.cookie_name')

# create and fill the local production .env file
RUN if [ -n "$VITE_API_BASE_URL" ]; then echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" >> .env.production.local; else echo "VITE_API_BASE_URL is required"; exit 1; fi;
RUN if [ -n "$VITE_COOKIE_DOMAIN" ]; then echo "VITE_COOKIE_DOMAIN=$VITE_COOKIE_DOMAIN" >> .env.production.local; fi;
RUN if [ -n "$VITE_COOKIE_NAME" ]; then echo "VITE_COOKIE_NAME=$VITE_COOKIE_NAME" >> .env.production.local; fi;

RUN npm run build

# Building the final image
FROM nginx:1.27.1-alpine-slim as prod

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80/tcp

CMD ["/usr/sbin/nginx", "-g", "daemon off;"]
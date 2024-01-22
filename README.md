# tergite-landing-page

This is the static home page for the qal9000 project that will be the landing page for all qal9000-related projects

## Dependencies

-   [nodejs +v18.16.0](https://nodejs.org/en/download)
-   [nextjs +v13.4.19](https://nextjs.org/)

## Getting Started

-   Ensure you have [nodejs +v18.16.0](https://nodejs.org/en/download) installed

-   Clone the repo

```shell
git clone git@github.com:tergite/tergite-landing-page.git
```

-   Install dependencies

```shell
cd tergite-landing-page
npm install
```

-   Copy the `auth_config.example.toml` to `auth_config.toml` and update the configuration there.  
    Make sure it is the same being used by the [MSS](https://github.com/tergite/tergite-mss/src/main/)connected to this app

```shell
cp auth_config.example.toml auth_config.toml
```

-   To update the environment variables, you also need to copy the `.env` file to `.env.local` and
    update the environment variables therein.

```shell
cp .env .env.local
```

-   Run the development server

```shell
npm run dev
```

-   Checkout the site at [http://localhost:3000](http://localhost:3000) in your browser

## Publish Docker Manually

-   Ensure you have [docker](https://docs.docker.com/engine/install/) installed.

-   Clone the repo

```shell
git clone git@github.com:tergite/tergite-landing-page.git
```

-   Login to a hosted docker container registry e.g. one based on the [tergite-registry repo](https://github.com/tergite/tergite-registry)

```shell
# e.g. if container registry is hosted at example.com:8002
# and username is johndoe
# and password is password123
CONTAINER_REGISTRY=example.com:8002
DOCKER_USERNAME=johndoe
# feed in password when prompted
docker login ${CONTAINER_REGISTRY} -u $DOCKER_USERNAME
```

-   Create a multiplatform docker builder if you haven't already

```shell
docker buildx create --name multi-platform-builder --bootstrap --use
```

-   Build and push the docker image

```shell
cd tergite-landing-page
docker buildx build --platform linux/amd64,linux/arm64 -t ${CONTAINER_REGISTRY}/tergite-landing-page:local --push .
docker pull ${CONTAINER_REGISTRY}/tergite-landing-page:local
```

-   To run a container based on that image, do

```shell
docker run -p 3000:80 --name landing-page \
    -e WEBGUI_ENDPOINT="https://gui.example.com" \
    -e MSS_ENDPOINT="https://api.example.com" \
    -e API_BASE_URL="http://127.0.0.1:8002" \
    -e OAUTH_REDIRECT_URI="http://127.0.0.1:3000" \
    -e AUTH_CONFIG_FILE="/path/to/your/auth_config.toml"
    ${CONTAINER_REGISTRY}/tergite-landing-page:local
```

## TODO

-   [ ] Add autocomplete for projects when generating tokens
-   [ ] Implementation and tests for search capability on project list page
-   [ ] Implementation and tests for search capability on tokens list page
-   [ ] Implementation and tests for pagination on project list page
-   [ ] Implementation and tests for pagination on tokens list page

## License

Licensed under the [Apache 2.0 License](./LICENSE)
Contributors can be found in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.


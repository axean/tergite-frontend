# Contributing to tergite-landing-page

**This project is currently not accepting pull requests from the general public yet.**

**It is currently being developed by the core developers only.**

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

-   Reporting a bug
-   Discussing the current state of the code
-   Submitting a fix
-   Proposing new features
-   Becoming a maintainer

## Versioning

When versioning we follow the format `{year}.{month}.{patch_number}` e.g. `2023.12.0`.

## We Develop with Github

We use Github to host code, to track issues and feature requests, as well as accept pull requests.

But We Use [Github Flow](https://docs.github.com/en/get-started/quickstart/github-flow),
So All Code Changes Happen Through Pull Requests

Pull requests are the best way to propose changes to the codebase (we
use [Github Flow](https://docs.github.com/en/get-started/quickstart/github-flow)). We actively welcome your pull
requests:

1. Clone the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the Apache 2.0 Software Licenses

In short, when you submit code changes, your submissions are understood to be under the
same [Apache 2.0 License](./LICENSE) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/tergite/tergite-frontend/issues)

We use Github issues to track bugs. 
Report a bug by [opening a new issue](https://github.com/tergite/tergite-frontend/issues) and adding the label 'landing-page' to it; it's that easy!

## Write bug reports with detail, background, and sample code

[This is an example](http://stackoverflow.com/q/12488905/180626).
Here's [another example from Craig Hockenberry](http://www.openradar.me/11905408).

**Great Bug Reports** tend to have:

-   A quick summary and/or background
-   Steps to reproduce
    -   Be specific!
    -   Give sample code if you can.
-   What you expected would happen
-   What actually happens
-   Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

People _love_ thorough bug reports. I'm not even kidding.

## License

By contributing, you agree that your contributions will be licensed under its Apache 2.0 License.

## How to Test

-   Make sure you have [nodejs +18.16.0](https://nodejs.org/) installed.
-   Clone the repo and enter the `apps/tergite-landing-page` folder

```shell
git clone git@github.com:tergite/tergite-frontend.git
cd tergite-frontend/apps/tergite-landing-page
```

-   Install the dependencies

```shell
npm i
```

-   Lint

```shell
npm run lint
```

-   Run the tests command

```shell
npm run e2e
```

## Publish Docker Manually

-   Ensure you have [docker](https://docs.docker.com/engine/install/) installed.

-   Clone the repo

```shell
git clone git@github.com:tergite/tergite-frontend.git
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
cd tergite-frontend/apps/tergite-landing-page
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

## References

This document was adapted from [a gist by Brian A. Danielak](https://gist.github.com/briandk/3d2e8b3ec8daf5a27a62) which
was originally adapted from the open-source contribution guidelines
for [Facebook's Draft](https://github.com/facebook/draft-js/blob/a9316a723f9e918afde44dea68b5f9f39b7d9b00/CONTRIBUTING.md)


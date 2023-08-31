# Installation

## Prerequisites

* (optional) Use Anaconda environment. With Python 3.8.

## Package installation
* cd tergite-mss
* pip install -e .
* create .env file with MSS configuration. See dot-env-template

## Start
### To start the Main Service Server(MSS):
* ./start_mss.sh

### (optional) To start the web socket server for webgui:
* python3 ws_main.py

## Publish Docker Manually

- Ensure you have [docker](https://docs.docker.com/engine/install/) installed.

- Clone the repo

```shell
git clone git@github.com:tergite/tergite-mss.git
```

- Login to a hosted docker container registry e.g. one based on the [tergite-registry repo](https://github.com/tergite/tergite-registry)

```shell
# e.g. if container registry is hosted at example.com:8002
# and username is johndoe
# and password is password123
CONTAINER_REGISTRY=example.com:8002
DOCKER_USERNAME=johndoe
# feed in password when prompted
docker login ${CONTAINER_REGISTRY} -u $DOCKER_USERNAME
```

- Build the docker image

```shell
cd tergite-mss
docker build -t ${CONTAINER_REGISTRY}/tergite-mss:local-latest .
```

- Push the docker image

```shell
docker push ${CONTAINER_REGISTRY}/tergite-mss:local-latest
```

- To run a container based on that image, do

```shell
docker run -p 8002:80 \
  --name mss-local \
  -e BCC_MACHINE_ROOT_URL="http://0.0.0.0:8000" \
  -e DB_MACHINE_ROOT_URL="mongodb://production-db.se" \
  ${CONTAINER_REGISTRY}/tergite-mss:local-latest
```

- Open your browser at http://localhost:8002/docs and see the docs for mss running.

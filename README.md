# tergite-qal9000

This is the collection of services that collectively are made available via the qal9000.se domain

## Dependencies

- Linux kernel.

  - This app is expected to be run on linux because of the logging type required. [journald is only for Linux](https://forums.docker.com/t/docker-for-windows-logging-failed-to-initialize-logging-driver-journald-is-not-enabled-on-this-host/68690/4).
  - Using the default `json-file` logging driver would quickly fill up your disk space after some time. See [here](https://docs.docker.com/config/containers/logging/configure/).
  - While the `local` logging driver should not be used by external tools like promtail, our logging aggregator client. See [here](https://docs.docker.com/config/containers/logging/local/)

- [docker +v23.0.5](https://www.docker.com/products/docker-desktop/)

## Getting Started

- Ensure you have [docker](https://docs.docker.com/engine/install/) installed.

- Clone the repo

```shell
git clone git@github.com:tergite/tergite-qal9000.git
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

- Copy the `auth_config.example.toml` to `auth_config.toml` and update the configuration there.

```shell
cd tergite-qal9000
cp auth_config.example.toml auth_config.toml
```

- Create a `.env` file basing on the `.env.example` file.
  Update the variables therein appropriately.

```shell
cp .env.example .env
```

- Run the services

```shell
docker compose up -d
```

- Open your browser at

  - [http://localhost:8030](http://localhost:8030) to see the landing page
  - [http://localhost:8002](http://localhost:8002) to see the MSS service
  - [http://localhost:3000](http://localhost:3000) to see the webGUI application

- To ensure that the services start up even on server restarts, run:

```shell
sudo systemctl enable docker
```

- To stop the services, run:

```shell
docker compose stop
```

- To remove stop the services and remove their containers also, run:

```shell
docker compose down
```

## How to Add a Basic Auth User

FOr the start, authentication is being done using [basic authentication via Nginx](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication/).

To add a new user, run the following steps.

- Clone the repo

```shell
git clone git@github.com:tergite/tergite-qal9000.git
```

- Make the add-auth-user script executable

```shell
cd tergite-qal9000
sudo chmod +x scripts/add-auth-user.sh
```

- Run the start script

```shell
# It will prompt you for a password
./scripts/add-auth-user.sh \
   --config-file /path/to/Nginx/config/for/domain/example.com \
   --username johndoe
```

Note: you might have to run this with sudo permissions.

-

## FAQ

### Why can't I access the service?

It could be an issue with your iptables. Check them.

- You could set qal9000 behind an nginx reverse proxy pointing ports 80,443 to the landing page URL (http://localhost:8030), but don't forget to open up your firewall to allow connections on 80,443 ports

```shell
sudo iptables -I INPUT -p tcp -m state --state NEW -m tcp -m multiport --dports 80,443 -j ACCEPT
```

You could add `-s nnn.nnn.n.n/nn ` arg to the above command to limit access to only a given subnet e.g. `-s 255.255.0.0/16`

### Why aren't rules set in ufw working?

When docker is installed, it adds its own `iptables` rules which open all ports by default to the entire world. See [this article](https://docs.docker.com/network/packet-filtering-firewalls/) for more information. In order to customize these rules, new rules have to be added to the DOCKER-USER chain.

You can add other rules in the same DOCKER-USER chain, carefully :-)

## License

Licensed under the [Apache 2.0 License](./LICENSE)
Contributors can be found in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

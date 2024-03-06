# Tergite Quantify Connector

![CI](https://github.com/tergite/tergite-mss/actions/workflows/ci.yml/badge.svg)

Translator of Qiskit Pulse schedules to Quantify schedules.

## Dependencies

- [Python 3.8](https://www.python.org/)
- [MongoDb](https://www.mongodb.com/)
- [Tergite BCC](https://github.com/tergite/tergite-bcc)

## Quick Start

- Ensure you have [conda](https://docs.anaconda.com/free/miniconda/index.html) installed. 
 (_You could simply have python +3.8 installed instead._)
- Ensure you have [tergite BCC](https://github.com/tergite/tergite-bcc) running.
- Clone the repo

```shell
git clone git@github.com:tergite/tergite-mss.git
```

- Create conda environment

```shell
conda create -n mss -y python=3.8
conda activate mss
```

- Install dependencies

```shell
cd tergite-mss
pip install -r requirements.txt
```

- Copy the `dot-env-template.txt` file to `.env` and 
  update the environment variables there appropriately.

```shell
cp dot-env-template.txt .env
```

- Run start script

```shell
./start_mss.sh
```

- You can optionally run the websocket server also in another terminal for [tergite WebGUI](https://github.com/tergite/tergite-webgui)

```shell
python ws_main.py
```

- Open your browser at [http://localhost:8002/docs](http://localhost:8002/docs) to see the interactive API docs

## Contribution Guidelines

If you would like to contribute, please have a look at our
[contribution guidelines](./CONTRIBUTING.md)

## Authors

This project is a work of
[many contributors](https://github.com/tergite/tergite-mss/graphs/contributors).

Special credit goes to the authors of this project as seen in the [CREDITS](./CREDITS.md) file.

## ChangeLog

To view the changelog for each version, have a look at
the [CHANGELOG.md](./CHANGELOG.md) file.

## License

[Apache 2.0 License](./LICENSE.txt)

## Acknowledgements

This project was sponsored by:

-   [Knut and Alice Wallenburg Foundation](https://kaw.wallenberg.org/en) under the [Wallenberg Center for Quantum Technology (WAQCT)](https://www.chalmers.se/en/centres/wacqt/) project at [Chalmers University of Technology](https://www.chalmers.se)
-   [Nordic e-Infrastructure Collaboration (NeIC)](https://neic.no) and [NordForsk](https://www.nordforsk.org/sv) under the [NordIQuEst](https://neic.no/nordiquest/) project
-   [European Union's Horizon Europe](https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en) under the [OpenSuperQ](https://cordis.europa.eu/project/id/820363) project
-   [European Union's Horizon Europe](https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en) under the [OpenSuperQPlus](https://opensuperqplus.eu/) project

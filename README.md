# Tergite WebGUI

![CI](https://github.com/tergite/tergite-webgui/actions/workflows/ci.yml/badge.svg)

The Visual Interface for the QAL 9000 quantum computers.

## Dependencies

-   [Nodejs +18.12](https://nodejs.org/)
-   [Nextjs 12.3.4](https://nextjs.org/)
-   [Tergite MSS](https://github.com/tergite/tergite-mss)

## Quick Start

-   Ensure you have [tergite MSS](https://github.com/tergite/tergite-mss) running.
-   Ensure you have [Nodejs +18.12](https://nodejs.org/) installed.
-   Clone the repo and enter its root folder

```shell
git clone git@github.com:tergite/tergite-webgui.git
cd tergite-webgui
```

-   Install the dependencies

```shell
npm i -g pnpm
pnpm i
```

-   Copy the `.env` file to `.env.local` file and update the variables in `.env.local` to the appropriate ones

```shell
cp .env .env.local
```

_Note: `NEXT_PUBLIC_API_BASE_URL` is the URL to the running [tergite MSS](https://github.com/tergite/tergite-mss)_

-   Run the app in development mode

```shell
pnpm run dev
```

-   Open your browser at [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Contribution Guidelines

If you would like to contribute to tergite-webgui, please have a look at our
[contribution guidelines](./CONTRIBUTING.md)

## Authors

This project is a work of
[many contributors](https://github.com/tergite/tergite-webgui/graphs/contributors).

Special credit goes to the authors of this project as seen in the [CREDITS](./CREDITS.md) file.

## ChangeLog

To view the changelog for each version, have a look at
the [CHANGELOG.md](./CHANGELOG.md) file.

## License

[Apache 2.0 License](./LICENSE)

## Acknowledgements

This project was sponsored by:

-   [Knut and Alice Wallenburg Foundation](https://kaw.wallenberg.org/en) under the [Wallenberg Center for Quantum Technology (WAQCT)](https://www.chalmers.se/en/centres/wacqt/) project at [Chalmers University of Technology](https://www.chalmers.se)
-   [Nordic e-Infrastructure Collaboration (NeIC)](https://neic.no) and [NordForsk](https://www.nordforsk.org/sv) under the [NordIQuEst](https://neic.no/nordiquest/) project
-   [European Union's Horizon Europe](https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en) under the [OpenSuperQ](https://cordis.europa.eu/project/id/820363) project
-   [European Union's Horizon Europe](https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en) under the [OpenSuperQPlus](https://opensuperqplus.eu/) project


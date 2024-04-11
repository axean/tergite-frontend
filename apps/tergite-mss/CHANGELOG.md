# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project follows versions of format `{year}.{month}.{patch_number}`.

## [Unreleased]

### Added

### Changed

- Moved tergite-mss to the tergite-frontend monorepo

### Fixed

## [2024.02.0] - 2024-03-07

This is part of the tergite release v2024.02 that introduces authentication, authorization and accounting to the
tergite stack

### Added

- Added authentication via JWT tokens in cookies
- Added authentication via JWT tokens in Authorization header
- Added role-based authorization via JWT tokens
- Added project-based authorization via app tokens saved in the database
- Added project-based tracking of QPU usage in terms of durations of experiments
- Integrated [Puhuri HPC/cloud allocation service](https://puhuri.io/)

### Changed

### Fixed

## [2023.12.0] - 2024-03-06

This is part of the tergite release v2023.12.0 that is the last to support [Labber](https://www.keysight.com/us/en/products/software/application-sw/labber-software.html).
Labber is being deprecated.

### Added

- Initial release of the tergite-mss server
- Added support for the [WebGUI](https://github.com/tergite/tergite-webgui)

### Changed

### Fixed

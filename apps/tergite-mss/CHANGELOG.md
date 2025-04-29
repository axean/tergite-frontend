# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project follows versions of format `{year}.{month}.{patch_number}`.

## [Unreleased]

### Changed

- Replaced `requirements.txt` with `pyproject.toml`
- Upgraded lowest version of python supported to python 3.12
- Upgraded Fastapi to 0.115.12
- Upgraded pydantic to the latest v2
- Removed the v1/auth, v1/backends and v1/jobs endpoints
- Changed creation of jobs to require a body with required fields 'device' and 'calibration_date'
- Disabled Mongo-style payloads when updating jobs to ensure more security by reducing capabilities exposed to HTTP
- Changed job update payloads to only accept the fields that are in the Job schema
- Changed the POST `/v2/calibrations` endpoint to receive only a single calibration result at a time
- Changed the GET `/v2/calibrations/` endpoint to return a paginated response of calibrations

### Added

- Add v2/jobs endpoints

## [2025.03.1] - 2025-03-18

No change

## [2025.03.0] - 2025-03-14

### Changed

- Renamed `quantum_jobs` to `jobs` service
- Removed the api routes, DTOs and service methods for the old WebGUI project.

## [2024.12.2] - 2025-01-22

### Changed

- Raise logging level to WARN when app settings are not production
- Remove NETWORK_MODE environment variable

### Fixed

- Fix auth openid errors when auth is disabled

## [2024.12.1] - 2024-12-20

No change

## [2024.12.0] - 2024-12-11

### Added

- Added GET `/v2/me` endpoint to get current user info
- Added DELETE `/v2/me/projects/{id}` endpoint to delete project current user administers
- Added GET `/v2/admin/qpu-time-requests` endpoint to get all user requests to increase QPU seconds on a project
- Added POST `/v2/admin/qpu-time-requests` endpoint for project members to request for more QPU seconds
- Added GET `/v2/admin/user-requests` endpoint for admins to retrieve a list of user requests
- Added PUT `/v2/admin/user-requests/{id}` endpoint for admins to update (e.g. approve/reject) as user request
- Added POST `/v2/admin/projects/` endpoint for admins to create a new project
  - Creates new empty user if non-existent emails are passed as user_emails or admin_email
- Added GET `/v2/admin/projects/` endpoint for admins to retireve a list of projects
- Added GET `/v2/admin/projects/{id}` endpoint for admins to view a project of given id
- Added PUT `/v2/admin/projects/{id}` endpoint for admins to update a project of given id
  - Creates new empty user if non-existent emails are passed as user_emails or admin_email
- Added DELETE `/v2/admin/projects/{id}` endpoint for admins to soft delete a project
- Added the PUT `/auth/me/app-tokens/{token_id}` endpoint for extending app token's lifetimes
- Added the PUT `/v2/me/tokens/{token_id}` endpoint for extending app token's lifetimes

### Fixed

- Fixed the not found error when deleting expired app tokens
- Fixed httpx version to 0.27.2 as 0.28.0 removes many deprecations that we were still dependent on in FastAPI testClient

## [2024.09.1] - 2024-09-24

### Added

- Added example scopes in the mss_config.example.toml
- Added units 'Hz' and 's' to calibration data schema

### Fixed

- Fixed CORS error when dashboard and MSS are on different domains or subdomains
- Fixed 'AttributeError: 'NoneType' object has no attribute 'resource_usage'' on GET /v2/me/jobs

### Changed

- Removed `archives` folder
- Removed `dev` folder
- Changed all calibration v2 properties optional

## [2024.09.0] - 2024-09-02

### Added

- Added v2 endpoints including
  - `/v2/me/projects/` to `GET`, `POST` current cookie user's projects
  - `/v2/me/projects/{project_id}` to `GET`, `PUT` current cookie user's single project
  - `/v2/me/tokens/` to `GET`, `POST` current cookie user's application tokens
  - `/v2/me/tokens/{token_id}` to `GET`, `PUT` current cookie user's application token
  - `/v2/me/jobs/` to `GET` current cookie user's jobs (with option of specifying project id)
  - `/v2/auth/providers` to `GET` the available Oauth2 provider corresponding to a given email domain
  - `/v2/auth/{provider}/authorize` to `POST` Oauth2 initialization request for given `provider`
  - `/v2/auth/{provider}/callback` to handle `GET` redirects from 3rd party Oauth2 providers after successful login
  - `/v2/auth/logout` to handle `POST` requests to logout the current user via cookies
  - `/v2/calibrations/` to `GET`, `POST` calibration data for all devices. `POST` is available for only system users.
  - `/v2/calibration/{device_name}` to `GET` calibration data for the device of the given `device_name`
  - `/v2/devices` to `GET`, `PUT` (upsert) all devices. `PUT` is available for only system users.
  - `/v2/devices/{name}` to `GET`, `PUT` the device of a given name. `PUT` is available for only system users.

## [2024.04.1] - 2024-05-28

### Added

- Added ability to handle multiple Tergite backends

### Changed

- Updated the contributions guidelines and the government model

### Fixed

## [2024.04.0] - 2024-04-16

### Added

### Changed

- Moved tergite-mss to the tergite-frontend monorepo
- Changed configuration control to use `mss-config.toml` not `.env`
- Removed the `auth_config.toml` file

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

# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project follows versions of format {year}.{month}.{patch_number}.

## [Unreleased]

### Added

- Added `run-nginx.sh` script to help initialize/update the variables like cookie names
  API urls and the like in docker prebuilt containers.

## [2024.12.0] - 2024-12-13

### Added

- Added the tokens list page for viewing, editing and deleting tokens of current user
- Added the projects list page for viewing, requesting QPU time and deleting projects for current user
- Added admin page for viewing, and approving user requests
- Added admin page for viewing, editing, deleting and creating new projects
- Added close button on the job detail drawer on the home page

### Changed

- Changed devices page to show 'no devices found' when no devices are available.
- Changed to show sidebar placeholder on admin user requests page when no user request is selected

### Fixed

## [2024.09.1] - 2024-09-24

### Added

- Added units 'Hz' and 's' to calibration data schema
- Changed all properites of calibration data to be optional
- Added normalizing calibration data to have frequencies in GHz and durations in microseconds

### Changed

### Fixed

## [2024.09.0] - 2024-09-02

### Added

- Initial version
- Device summary list on the dashboard home
- Jobs list on the dashboard home
- Jobs detail drawer on the dashboard home
- Device list page
- Device detail page
- Error page

### Changed

### Fixed

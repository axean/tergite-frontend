#!/bin/bash
# This code is part of Tergite
#
# (C) Copyright Chalmers Next Labs 2025
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
#
# Usage
# =====
#
# BACKEND_REPO="https://github.com/tergite/tergite-backend.git" \
#   BACKEND_BRANCH="main" \ # you can set a different backend branch; default is 'main'
#   DEBUG="True" \ # Set 'True' to avoid cleaning up the containers, env, and repos after test, default: ''
#   CYPRESS_IMAGE="cypress/base:20.17.0" \ # Set the docker image to run the tests. If not provided, it runs on the host machine
#   ./e2e_test.sh

set -e # exit if any step fails

# Global variables
TEMP_DIR="temp"
BACKEND_REPO="$BACKEND_REPO"
BACKEND_BRANCH="${BACKEND_BRANCH:-main}"
APP_TOKEN="pZTccp8F-8RLFvQie1AMM0ptfdkGNnH1wDEB4INUFqw"
ROOT_PATH="$(pwd)"
TEMP_DIR_PATH="$ROOT_PATH/$TEMP_DIR"
FIXTURES_PATH="$ROOT_PATH/apps/tergite-dashboard/cypress/fixtures"
CYPRESS_IMAGE="$CYPRESS_IMAGE"

# Logging function for errors
log_error() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - ERROR: $1" >&2
}

# exits the program with an error
exit_with_err() {
  log_error "$1";
  exit 1;
}

# Check that docker is available
docker --help || exit_with_err "docker is not running"

# Clean up any remaining docker things
echo "Cleaning up docker artefacts from previous runs"
docker compose -p tergite-frontend-e2e  down --rmi all --volumes 2>/dev/null
docker rmi -f tergite/tergite-mss 2>/dev/null
docker rmi -f tergite/tergite-dashboard 2>/dev/null
docker rmi -f tergite/tergite-backend-e2e:latest 2>/dev/null
docker system prune -f

# Create and navigating to temporary directory
echo "Creating up temp folder $TEMP_DIR_PATH"
rm -rf "$TEMP_DIR_PATH"
mkdir "$TEMP_DIR_PATH"
cd "$TEMP_DIR_PATH"

# Setting up the repositories
echo "Cloning repositories..."
rm -rf tergite-frontend
rm -rf tergite-backend
git clone "$ROOT_PATH" tergite-frontend
git clone --single-branch --branch "$BACKEND_BRANCH" "$BACKEND_REPO"

# Adding configuration files to tergite-frontend folder
echo "Adding configuration files"
cd tergite-frontend
cp "$FIXTURES_PATH/mongo-init.js" .
cp "$FIXTURES_PATH/e2e-docker-compose.yml" .
cp "$FIXTURES_PATH/qiskit_pulse_1q.toml" .
cp "$FIXTURES_PATH/qiskit_pulse_2q.toml" .
cp "$FIXTURES_PATH/e2e.env" .env
printf "\nMSS_APP_TOKEN=\"$APP_TOKEN\"" >> .env
cp "$FIXTURES_PATH/mss-config.toml" .


# Starting services in the tergite-frontend folder
echo "Starting all e2e services"
docker compose \
  -f fresh-docker-compose.yml\
  -f e2e-docker-compose.yml \
  -p tergite-frontend-e2e \
  up -d

# Run in python docker file if $CYPRESS_IMAGE is set
# or else run on host machine

if [[ -z "$CYPRESS_IMAGE" ]]; then
  # Starting the tests
  echo "Installing dependencies..."
  cd "$TEMP_DIR_PATH/tergite-frontend/apps/tergite-dashboard"
  npm ci --cache .npm --prefer-offline

  echo "Running end-to-end test suite..."
  if [[ -z "$TEST_THRESHOLD" ]]; then 
    echo "TEST_THRESHOLD=$TEST_THRESHOLD" >> .env.test; 
  fi

  echo "IS_FULL_END_TO_END=True" >> .env.test; 

  # set the dashboard URL to the URL of the dashboard service
  if [[ "$(uname -s)" = "Darwin" ]]; then
    sed -i "" "s|http://127.0.0.1:5173|http://127.0.0.1:3000|" cypress.config.ts;
  else 
    sed -i "s|http://127.0.0.1:5173|http://127.0.0.1:3000|" cypress.config.ts;
  fi

  npm run visual-cypress-only
else
  echo "Running e2e tests..."
  cd "$TEMP_DIR_PATH/tergite-frontend/apps/tergite-dashboard"
  cp "$FIXTURES_PATH/e2e-runner.sh" .
  docker run \
    --name tergite-frontend-e2e-runner \
    --network=host \
    -v "$PWD":/app -w /app \
    -e TEST_THRESHOLD="$TEST_THRESHOLD" \
    -e VITE_API_BASE_URL="http://127.0.0.1:8002/v2" \
    -e DASHBOARD_URL="http://127.0.0.1:3000" \
    -e IS_FULL_END_TO_END="True" \
    "$CYPRESS_IMAGE" bash ./e2e-runner.sh;

  # FIXME: the cookies depend on the URL of the dashboard and mss.
  #   We might need a reverse-proxy that uses the network urls in the back
fi

# Cleanup
# In order to debug the containers and the repos,
# set the env variable "DEBUG" to True
if [[ $(echo "${DEBUG}" | tr '[:lower:]' '[:upper:]') != "TRUE" ]]; then
  echo "Cleaning up..."
  docker compose -p tergite-frontend-e2e down --rmi all --volumes
  docker rm tergite-frontend-e2e-runner 2>/dev/null
  rm -rf "$TEMP_DIR_PATH"
  rm "$ROOT_PATH/apps/tergite-dashboard/e2e-runner.sh"
else
  echo "Not deleting the containers and repositories because DEBUG=$DEBUG"
fi

echo "Script completed."

#!/bin/bash
# This is a small script that is used to run the e2e tests after
# the dependent services are set up

set -e  # Exit on error


npm ci --cache .npm --prefer-offline

echo "Running end-to-end test suite..."
if [ -z "$TEST_THRESHOLD" ]; then 
  echo "TEST_THRESHOLD=$TEST_THRESHOLD" >> .env.test; 
fi

npm run cypress-only
#!/bin/bash
# This is a small script that is used to run the e2e tests after
# the dependent services are set up

set -e  # Exit on error


npm ci --cache .npm --prefer-offline

echo "Running end-to-end test suite..."
if [[ -n "$TEST_THRESHOLD" ]]; then 
  printf "\nTEST_THRESHOLD=$TEST_THRESHOLD" >> .env.test; 
fi

if [[ -n "$IS_FULL_END_TO_END" ]]; then 
  printf "\nIS_FULL_END_TO_END=$IS_FULL_END_TO_END" >> .env.test; 
fi

# replace base url in cypress.config.ts
if [[ -n "$DASHBOARD_URL" ]]; then
  sed -i "s|http://127.0.0.1:5173|$DASHBOARD_URL|" cypress.config.ts;
fi

npm run cypress-only
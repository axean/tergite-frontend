#!/bin/sh

# rest-api
uvicorn --host 0.0.0.0 --port 5000 rest_api:app --reload

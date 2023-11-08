#!/bin/bash

exit_with_error () {
    echo "Port configuration failed. Use MSS_PORT=<num> in the .env file."
    exit 1
}

# port handling
PORT_CONFIG=$(grep MSS_PORT= .env)               # eg: MSS_PORT=5000
PORT_NUMBER="${PORT_CONFIG#*=}"                  # extract the number
[[ -z "$PORT_NUMBER" ]]  &&  exit_with_error     # validation
[[ ! "$PORT_NUMBER" =~ ^[0-9]+$ ]]  &&  exit_with_error


# rest-api
uvicorn --host 0.0.0.0 --port "$PORT_NUMBER" api.rest:app  --proxy-headers --reload

# websocket server
# python3 ws_main.py &

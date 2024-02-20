#!/bin/bash

exit_with_error () {
  echo "$1"
  exit 1
}

extract_env_var () {
  local env_name="$1"
  local res=$(grep "^[[:space:]]*${env_name}=" .env | grep -v '^[[:space:]]*#' | sed "s/^[[:space:]]*${env_name}=//" | head -n 1)
  [[ -z "$res" ]]  &&  exit_with_error "Config Error: Use ${env_name}=<value> in the .env file."
  echo $res
}

set_sigterm_handler()
{
    unset child_pid
    unset term_needed
    trap 'handle_sigterm' TERM INT
}

handle_sigterm()
{
    if [ "${child_pid}" ]; then
        kill -TERM "${child_pid}" 2>/dev/null
    else
        term_needed="yes"
    fi
}

wait_for_process()
{
    child_pid=$1
    if [ "${term_needed}" ]; then
        kill -TERM "${child_pid}" 2>/dev/null
    fi

    wait ${child_pid} 2>/dev/null
    trap - TERM INT
    wait ${child_pid} 2>/dev/null
}

# port handling
PORT_NUMBER=$([[ "$MSS_PORT" ]] && echo $MSS_PORT || echo $(extract_env_var "MSS_PORT"))
[[ ! "$PORT_NUMBER" =~ ^[0-9]+$ ]]  &&  exit_with_error "Port configuration failed. Use MSS_PORT=<int> in the .env file."


set_sigterm_handler

# puhuri sync
python -m api.scripts.puhuri_sync --ignore-if-disabled &
puhuri_script=$!

# rest-api
extra_args=$([[ $APP_SETTINGS != "production" ]] && echo "--reload")
uvicorn --host 0.0.0.0 --port "$PORT_NUMBER" api.rest:app  --proxy-headers "$extra_args" &
uvicorn_script=$!

# websocket server
# python3 ws_main.py &

wait_for_process $puhuri_script
wait_for_process $uvicorn_script

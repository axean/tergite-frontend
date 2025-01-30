#!/bin/bash

MSS_CONFIG_FILE=$([[ -z "$MSS_CONFIG_FILE" ]] && echo "mss-config.toml" || echo "$MSS_CONFIG_FILE")

exit_with_error () {
  echo "$1"
  exit 1
}

extract_env_var () {
  local env_name="$1"
  local res=$(grep "^[[:space:]]*${env_name}[[:space:]]*=" "$MSS_CONFIG_FILE" | grep -v '^[[:space:]]*#' | sed "s/^[[:space:]]*${env_name}[[:space:]]*=[[:space:]]*//" | head -n 1)
  [[ -z "$res" ]]  &&  exit_with_error "Config Error: Use ${env_name}=<value> in the $MSS_CONFIG_FILE file."
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
PORT_NUMBER=$([[ "$MSS_PORT" ]] && echo $MSS_PORT || echo "8002"
[[ ! "$PORT_NUMBER" =~ ^[0-9]+$ ]]  &&  exit_with_error "Port configuration failed. Use mss_port=<int> in the $MSS_CONFIG_FILE file."

# app settings
APP_SETTINGS=$(echo $(extract_env_var "environment"))
[[ -z "$APP_SETTINGS" ]]  &&  exit_with_error "Port configuration failed. Use environment=<string> in the $MSS_CONFIG_FILE file."

set_sigterm_handler

# puhuri sync
python -m api.scripts.puhuri_sync --ignore-if-disabled &
puhuri_script=$!

# rest-api
extra_args=$([[ $APP_SETTINGS == "production" ]] && echo "" || echo " --reload")
python -m uvicorn --host 0.0.0.0 --port "$PORT_NUMBER" api.rest:app --proxy-headers$extra_args &
uvicorn_script=$!

wait_for_process $puhuri_script
wait_for_process $uvicorn_script

#!/bin/bash

# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

# Bash script to adds a basic authentication user to nginx installation
#
# Usage
# =====
# 
# Short version:
# --------------
# 
# ./scripts/add-auth-user.sh \
#   -c /etc/nginx/sites-available/example.com
#   -u johndoe
# 
# Long version:
# ------------
# 
# ./scripts/add-auth-user.sh \
#   --config-file /etc/nginx/sites-available/example.com
#   --username johndoe
#
# Options
# ------
# 
# - c/config-file: the path to the nginx config file for the given domain
# - u/username: the new username
#
# Prompts
# -------
# 
# - password: the password
#

# extract commandline args
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--config-file)
      CONFIG_FILE="$2"
      shift # past argument
      shift # past value
      ;;
    -u|--username)
      USERNAME="$2"
      shift # past argument
      shift # past value
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 2
      ;;
  esac
done

if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: nginx config file $CONFIG_FILE not found.";
    exit 2;
fi

if [ -z "$USERNAME" ]; then
  echo "username cannot be empty";
  exit 2;
fi

# install apache2-utils
apt-get install apache2-utils


# create the apache2 folder if it does not exist
APACHE2_DIR="/etc/apache2";
if [ ! -f "$APACHE2_DIR" ]; then 
    mkdir $APACHE2_DIR;
fi

# create the user. This prompts for a password
HTPASSWD_FILE="$APACHE2_DIR/.htpasswd";
if [ -f "$HTPASSWD_FILE" ]; then 
  htpasswd $HTPASSWD_FILE $USERNAME || exit 2;
else
  htpasswd -c $HTPASSWD_FILE $USERNAME || exit 2;
fi

# Update the NGINX config file
AUTH_CONFIG_EXISTS="`grep "auth_basic_user_file $HTPASSWD_FILE;" $CONFIG_FILE`";
if [ -z "$AUTH_CONFIG_EXISTS" ]; then
    echo "Updating $CONFIG_FILE. Note this works best on GNU Linux as it uses GNU sed.";
    AUTH_CONFIG="auth_basic "Authentication";\nauth_basic_user_file $HTPASSWD_FILE;";
    sed -i "/server\s*{/a $AUTH_CONFIG" $CONFIG_FILE;
else
    echo "Skipping update to config file as auth is already setup.";
fi

echo "User $USERNAME added";

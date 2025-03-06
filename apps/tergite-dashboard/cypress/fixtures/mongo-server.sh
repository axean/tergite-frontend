#!/bin/sh

# exit on error
set -e

# PORT=3001

echo "Starting HTTP server on port 3001"

socat TCP-LISTEN:3001,reuseaddr,fork EXEC:/usr/local/bin/router.sh

# mkdir -p /var/www;
# echo "hello world" >> /var/www/refreshed-db;

# Run a simple HTTP server
# busybox httpd -f -p 0.0.0.0:$PORT -h /var/www &

# # Listen for HTTP requests and rerun init.js
# while true; do
#   nc -l -p $PORT | while read line; do
#     # Check if we have a GET request to trigger the init script
#     if echo "$line" | grep -q "GET /refreshed-db"; then
#       echo "Triggering MongoDB init script...";
#       # Execute the MongoDB initialization script
#       mongosh /docker-entrypoint-initdb.d/init.js 2>&1;
#     fi
#   done
#   sleep 0.05
# done

# while true; do
#     # Listen for incoming connections
#     { 
#         echo -ne "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n"
        
#         # Read request line (ignore headers)
#         read request
        
#         # Extract command from URL (e.g., `http://localhost:8080/?ls`)
#         cmd=$(echo "$request" | awk '{print $2}' | cut -d'?' -f2)

#         # Execute command and send output
#         if [ -n "$cmd" ]; then
#             bash -c "$cmd" 2>&1
#         else
#             echo "No command provided. Use ?your_command in URL."
#         fi
#     } | nc -l -p "$PORT" -q 1;
# done
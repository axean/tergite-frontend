FROM mongo:latest

# Set up working directory
WORKDIR /docker-entrypoint-initdb.d/

# Copy the initialization script
COPY mongo-init.js /docker-entrypoint-initdb.d/init.js

# Copy the HTTP server script
COPY mongo-server.sh /usr/local/bin/http_server.sh
COPY mongo-router.sh /usr/local/bin/router.sh
RUN chmod +x /usr/local/bin/http_server.sh
RUN chmod +x /usr/local/bin/router.sh

# Install BusyBox for HTTP server
RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Expose MongoDB and HTTP server ports
EXPOSE 27017 3001

# Start MongoDB and HTTP server
CMD ["sh", "-c", "mongod --bind_ip_all & sleep 5 && nohup /usr/local/bin/http_server.sh & tail -f /dev/null"]

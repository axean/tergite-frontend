# Tergite MSS

Main Service Server (MSS) SW pack.


## Installation
You need to create a file called config.ini with this content:

[DATABASE]
DB_URI = mongodb://user@password@host

The application is started via gunicorn wsgi:app with a binded socket.

## Nohup help
# start gunicorn with mss app via nohup
nohup gunicorn --bind unix:mss_stable.sock wsgi:app &


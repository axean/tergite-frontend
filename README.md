# Installation

## Prerequisites
* Redis
* (optional) Use Anaconda environment. With Python 3.8.

## Package installation
* cd tergite-mss
* pip install -e .
* create .env file with MSS configuration. See dot-env-template.txt.

## Start
### To start the Main Service Server(MSS):
* ./start_mss.sh

### (optional) To strat the web socket server for webgui:
* python3 ws_main.py

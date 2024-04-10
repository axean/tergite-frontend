#!/bin/bash -e

echo "Loading conda tergite env"
eval "$(/mnt/extra_ssd/anaconda/anaconda3/bin/conda shell.bash hook)"
conda activate tergite

exec "$@"

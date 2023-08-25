FROM python:3.8-alpine

WORKDIR /code

# copy this only so as to increase the chances of the cache being used
# for the pip install step
COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app

LABEL org.opencontainers.image.licenses=APACHE-2.0
LABEL org.opencontainers.image.description="Public REST API for Quantum Computers in Chalmers University"

ENV MSS_PORT=80
ENV WS_PORT=6532

EXPOSE 80

CMD ["python", "start_mss.py"]

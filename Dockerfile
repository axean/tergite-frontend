FROM python:3.8-alpine

WORKDIR /code

# copy this only so as to increase the chances of the cache being used
# for the pip install step
COPY ./requirements.txt /code/requirements.txt

RUN apk update
RUN apk add python3-dev gcc libc-dev libffi-dev
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . /code/

LABEL org.opencontainers.image.licenses=APACHE-2.0
LABEL org.opencontainers.image.description="Public REST API for Quantum Computers in Chalmers University"

ENV DB_NAME=milestone1
ENV MSS_PORT=80
ENV WS_PORT=6532
ENV BCC_MACHINE_ROOT_URL="http://localhost:8000"
ENV DB_MACHINE_ROOT_URL="mongodb://localhost:27017"
ENV TERGITE_CLIENT_ID=""
ENV TERGITE_CLIENT_SECRET=""
ENV TERGITE_EMAIL_REGEX=".*"
ENV TERGITE_ROLES="admin,user"
# roles can be: "admin", "user", "researcher", "partner"

ENV CHALMERS_CLIENT_ID=""
ENV CHALMERS_CLIENT_SECRET=""
ENV CHALMERS_EMAIL_REGEX=".*"
ENV CHALMERS_ROLES="user"

ENV PUHURI_CLIENT_ID=""
ENV PUHURI_CLIENT_SECRET=""
ENV PUHURI_CONFIG_ENDPOINT=""
ENV PUHURI_EMAIL_REGEX=".*"
ENV PUHURI_ROLES="user"

ENV JWT_SECRET=""
ENV JWT_TTL=3600

# Some other optional variables can be set e.g.
# ENV COOKIE_DOMAIN
# ENV COOKIE_NAME
# ENV TERGITE_COOKIE_REDIRECT_URI
# ENV CHALMERS_COOKIE_REDIRECT_URI
# ENV PUHURI_COOKIE_REDIRECT_URI

EXPOSE 80

CMD uvicorn --host 0.0.0.0 --port $MSS_PORT api.rest:app --proxy-headers

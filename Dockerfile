FROM python:3.8-alpine

WORKDIR /code

# copy this only so as to increase the chances of the cache being used
# for the pip install step
COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app

ENV MSS_PORT = 80

EXPOSE 80

CMD ["python", "start_mss.py"]

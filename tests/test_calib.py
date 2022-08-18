import requests
import numpy as np

URL = "http://localhost:6789/calibrations"

content = {
    "dummy" : True,
    "calibration" : "Resonator spectroscopy",
    "qoi" : "Resonance frequency of resonator",
    "qoi_code" : "RFR",
    "unit" : "Hz",
    "uncertainty": 0,
    "dependencies": [],
    "fitting_model" : "some.quantify.model",
    "index" : 0,
    "job_id" : "ba9d5d96-7328-4efd-b02c-7f4cf07a0367",
    "tuid" : "ba9d5d96-00000",
    "averaged_over" : 1000,
    "value" : 6.8846834616273584e9 + np.random.rand()*1e3,
    "retrieved" : 0,
}

requests.post(URL, json = [content])

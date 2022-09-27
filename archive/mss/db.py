# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2019
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.


from flask import current_app, g
from werkzeug.local import LocalProxy
import json

from pymongo import MongoClient, DESCENDING


def get_db():
    db = getattr(g, "_database", None)
    DB_URI = current_app.config["DB_URI"]
    print("DB module: DB_URI:", DB_URI)
    print(">>>>>>>>>>")
    if db is None:
        print("Establishing DB connection")
        db = g._database = MongoClient(DB_URI)["milestone1"]

    return db


db = LocalProxy(get_db)

# db.t1_mon.find({}).sort({date:-1}).limit(3)


def get_t1(nlast=1):
    # return list(db.t1_mon.find({},{"_id:0"}).sort({"date": DESCENDING}).limit(nlast))
    cursor = db.t1_mon.find({}, {"_id": 0}).sort([("date", DESCENDING)]).limit(nlast)
    response = []
    for document in cursor:
        response.append(document)
    return response

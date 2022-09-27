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


from flask_cors import CORS
from flask import jsonify, Blueprint, current_app, g, request
from werkzeug.local import LocalProxy
from mss.db import get_t1

mss_routes = Blueprint("mss_routes", "mss_routes")
CORS(mss_routes)


@mss_routes.route("/t1", methods=["GET"])
def api_get_t1():
    nlast = int(request.args.get("nlast", 1))
    results = get_t1(nlast)
    print(results)
    return jsonify(results)

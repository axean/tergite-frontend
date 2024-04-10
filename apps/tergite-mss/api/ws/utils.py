# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import argparse
import logging


def get_polling_time(time: str) -> float:
    value = float(time[:-1]) * 60 if time[-1] == "m" else float(time)
    if value <= 0:
        raise ValueError("Time can't be 0 or less")
    return value


def parse_fileargs() -> argparse.Namespace:
    # Logging level
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-v",
        "--verbose",
        help="Be verbose",
        action="store_const",
        dest="loglevel",
        default=logging.WARNING,
        const=logging.INFO,
    )
    parser.add_argument(
        "--time",
        help="Default seconds, add m to value to change to minutes, 5m",
        default=str(60 * 5),
        type=str,
    )
    args = parser.parse_args()
    logging.basicConfig(level=args.loglevel)
    return args

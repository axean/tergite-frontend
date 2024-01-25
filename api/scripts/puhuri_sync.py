# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""A worker for synchronizing this application with Puhuri"""
import argparse
import asyncio
import sys
from typing import Optional, Sequence

import settings
from services.external import puhuri


def main(args: Optional[Sequence[str]]):
    """The main routine for running the puhuri synchronization

    Args:
        args: the commandline arguments to parse
    """
    parser = argparse.ArgumentParser(description="synchronize with Puhuri")

    parser.add_argument(
        "-i",
        "--ignore-if-disabled",
        action="store_true",
        help="don't raise any error if `IS_PUHURI_SYNC_ENABLED` enviroment variable is False",
    )
    parsed_args = parser.parse_args(args)

    if settings.IS_PUHURI_SYNC_ENABLED:
        asyncio.run(puhuri.synchronize())
    elif not parsed_args.ignore_if_disabled:
        raise ValueError("environment variable 'IS_PUHURI_SYNC_ENABLED' is False")


if __name__ == "__main__":
    main(sys.argv[1:])

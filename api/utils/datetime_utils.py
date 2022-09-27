# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.


from datetime import datetime, timezone
from fastapi import HTTPException


def parse_datetime_string(datetime_str: str) -> datetime:
    """
    Validates the given datetime string is a datetime string. Converts RFC3339 to ISO8601.
    """
    try:
        # Check if Z is on the end of the string. Replace with +00:00 to indicate UTC.
        # If Z is not on the end of the string, then it is assumed to be in the local timezone.
        # RFC3339 standard specifies Z appended on the timestring. ISO8601 uses offset from UTC.
        return datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
    except:
        raise HTTPException(
            status_code=400, detail=f'"{datetime_str}" is not a valid date.'
        )


def datetime_to_zulu(d: datetime) -> str:
    """
    Returns the given datetime object in string format with an ending Z.
    """

    return d.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

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
"""Data Transfer Objects for random_numbers service"""
from typing import List

from typing_extensions import TypedDict


class Rng(TypedDict):
    """Schema for RNG collection"""

    job_id: str  # id of the job, queued by the user
    numbers: List[int]  # the random integers
    N: int  # how many integers did the user request
    width: int  # how many bits is the integer, 32, 64, etc.

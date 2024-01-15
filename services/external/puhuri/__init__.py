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
"""Entry point for the puhuri external service"""

from .service import on_startup, register_background_tasks, save_job_resource_usage
from .utils import get_client

__all__ = [
    get_client,
    save_job_resource_usage,
    register_background_tasks,
    on_startup,
]

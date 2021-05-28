# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2021
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.


from setuptools import setup, find_packages

REQUIREMENTS = [
    "fastapi>=0.65.1",
    "motor>=2.4.0",
    "python-multipart>=0.0.5",
    "redis>=3.5.3",
    "requests>=2.25.1",
    "rq>=1.8.1",
    "uvicorn>=0.13.4",
]

setup(
    name="tergite-mss",
    author_emails="dobsicek@chalmers.se",
    license="Apache 2.0",
    packages=find_packages(),
    install_requires=REQUIREMENTS,
    python_requires=">=3.8",
)

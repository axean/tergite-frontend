# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2021
# (C) Copyright Abdullah-Al Amin 2021
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.


from setuptools import setup, find_packages


with open("requirements.txt", mode="r") as _file:
    REQUIREMENTS = _file.readlines()

setup(
    name="tergite-mss",
    author_emails="dobsicek@chalmers.se",
    license="Apache 2.0",
    packages=find_packages(),
    install_requires=REQUIREMENTS,
    python_requires=">=3.8",
)

# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Abdullah-Al Amin 2022
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.


from functools import reduce
from typing import List, Union

from ..dto.Coupler import Coupler
from ..dto.Device import DeviceData
from ..dto.FilteredDeviceData import FilteredComponent, FilteredDeviceData
from ..dto.Gate import Gate
from ..dto.Qubit import Qubit
from ..dto.Resonator import Resonator
from ..dto.VisualisationType import VisualisationType


def filter_device_data_by_type(
    device_data: DeviceData, type: VisualisationType
) -> FilteredDeviceData:
    """
    Returns a filtered device data object containing all properties of the given
    device_data that have the specified type.
    """

    # Each list of components will be reduced to a list of FilteredComponents
    # using this function.
    def filter_components(
        filtered_list: "list[FilteredComponent]", component
    ) -> "list[FilteredComponent]":
        filtered_component = filter_component_by_type(component, type)

        if filtered_component is None:
            return filtered_list

        return [*filtered_list, filtered_component]

    qubits = reduce(filter_components, device_data.qubits, [])
    couplers = reduce(filter_components, device_data.couplers, [])
    gates = reduce(filter_components, device_data.gates, [])
    resonators = reduce(filter_components, device_data.resonators, [])

    return FilteredDeviceData(
        qubits=qubits,
        couplers=couplers,
        resonators=resonators,
        gates=gates,
    )


def filter_component_by_type(
    component: Union[Qubit, Coupler, Resonator, Gate],
    type: VisualisationType,
) -> Union[FilteredComponent, None]:
    """
    Returns a FilteredComponent with the properties of the given component that
    have the specified type. Returns None if no properties of the given type were
    found.
    """
    all_props = [
        *component.dynamic_properties,
        *component.static_properties,
    ]
    filtered_component_obj = {}

    for prop in all_props:
        if type.value in prop.types:
            filtered_component_obj[prop.name] = [prop]

    if len(filtered_component_obj.keys()) == 0:
        return None

    filtered_component_obj["id"] = component.id
    return FilteredComponent.parse_obj(filtered_component_obj)


def join_filtered_device_data(
    device_data0: FilteredDeviceData,
    device_data1: FilteredDeviceData,
):
    """
    Takes two FilteredDeviceData objects representing the same backend at different time ranges and
    combines them into one object which is returned. Throws a ValueError if the given objects do
    not represent the same backend and cannot be joined.
    """

    data0_dict = dict(device_data0)
    data1_dict = dict(device_data1)

    joined_dict = {}

    for component_key in data0_dict.keys():
        device0_components: List[FilteredComponent] = data0_dict[component_key]
        device1_components: List[FilteredComponent] = data1_dict[component_key]
        joined_components: List[FilteredComponent] = []

        for component0 in device0_components:
            # component0 and component1 hold the values of the same component
            # at different time ranges.
            component1 = next(
                c
                for c in device1_components
                if c.__root__["id"] == component0.__root__["id"]
            )

            if component1 is None:
                raise ValueError(
                    f"The given FilteredDevices do not contain the same {component_key}."
                )

            joined_components.append(join_filtered_components(component0, component1))

        joined_dict[component_key] = joined_components

    return FilteredDeviceData.parse_obj(joined_dict)


def join_filtered_components(
    comp0: FilteredComponent,
    comp1: FilteredComponent,
) -> FilteredComponent:
    """
    Takes two FilteredComponents representing the same component at different times and combines them
    into one object. The result is returned. Throws a ValueError if the given objects do not represent
    the same components and cannot be joined.
    """

    comp_dict0 = comp0.__root__
    comp_dict1 = comp1.__root__

    if comp_dict0["id"] != comp_dict1["id"]:
        raise ValueError(
            "The ids of the given components were different. Only FilteredComponents representing the same component can be joined."
        )

    if comp_dict0.keys() != comp_dict1.keys():
        raise ValueError(
            "Only FilteredComponents with the same properties can be joined"
        )

    joined_dict = {"id": comp_dict0["id"]}

    for key, properties in comp_dict0.items():
        if key == "id":
            continue

        joined_properties = [*properties, *comp_dict1[key]]

        # This function is used to reduce joined_properties to a duplicate
        # free list.
        def remove_duplicates(result_list, prop):
            if any(p.date == prop.date for p in result_list):
                return result_list
            return [*result_list, prop]

        joined_properties = reduce(remove_duplicates, joined_properties, [])
        joined_dict[key] = joined_properties

    return FilteredComponent.parse_obj(joined_dict)

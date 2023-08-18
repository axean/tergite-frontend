from datetime import datetime
from typing import Any, Dict, List, Tuple


def pop_field(records: List[Dict[str, Any]], field: str) -> List[Any]:
    """Pops a given field from the list of records and returns the list of popped values.

    Note that it mutates the items in the record list

    Args:
        records: the list of records
        field: the key to pop from the records

    Returns:
        a new list containing the values of the given field in the original records
    """
    results = []
    for item in records:
        results.append(item.pop(field))

    return results


def order_by(
    data: List[Dict[str, Any]], field: str, is_descending: bool = False
) -> List[Dict[str, Any]]:
    """Orders the data by given field

    Args:
        data: the list of records to sort
        field: the field to order by
        is_descending: whether to sort in descending order

    Returns:
        the ordered list of records
    """
    return sorted(data, key=lambda x: x[field], reverse=is_descending)


def distinct_on(data: List[Dict[str, Any]], field: str) -> List[Dict[str, Any]]:
    """Returns the list of unique records basing on the field passed

    It picks the first record for a given unique value and ignores any duplicates.

    Args:
        data: the list of records that is to be filtered
        field: the field that distinguishes unique records from one another

    Returns:
        the list of unique records
    """
    items = {}

    for item in data:
        unique_value = item[field]

        # FIXME: Treat datetime special as mongodb reduces their precision
        if isinstance(unique_value, datetime):
            unique_value = unique_value.isoformat(timespec="milliseconds")

        if unique_value not in items:
            items[unique_value] = item

    return list(items.values())


def get_record(data: List[Dict[str, Any]], _filter: Dict[str, Any]) -> Dict[str, Any]:
    """Gets the first record in data which matches the given filter

    Args:
        data: list of records to get the record from
        _filter: partial dict that the given record should contain

    Returns:
        the first record that matches the given filter

    Raises:
        KeyError: {key}
    """
    try:
        return next(
            filter(lambda x: all([x[k] == v for k, v in _filter.items()]), data)
        )
    except StopIteration:
        raise KeyError(f"no match found for filter {_filter}")


def get_many_records(
    data: List[Dict[str, Any]], _filter: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Gets all records in data that match the given filter

    Args:
        data: list of records to get the record from
        _filter: partial dict that the given record should contain

    Returns:
        the records that match the given filter

    Raises:
        KeyError: {key}
    """
    try:
        return list(
            filter(lambda x: all([x[k] == v for k, v in _filter.items()]), data)
        )
    except IndexError:
        raise KeyError(f"no match found for filter {_filter}")


def get_range(
    data: List[Dict[str, Any]], field: str, from_: Any, to: Any
) -> List[Dict[str, Any]]:
    """Gets the list of records whose `field` value is between `from_` and `to` inclusive

    Args:
        data: list of records to get the records from
        field: the dict property to filter by
        from_: the lower inclusive boundary for the given field
        to: the upper inclusive boundary for the given field

    Returns:
        the list of records that have their values for the given field lying in the given range

    Raises:
        KeyError: {field}
    """
    return [v for v in data if from_ <= v[field] <= to]


def group_by(
    data: List[Dict[str, Any]], unique_keys: Tuple[str, ...]
) -> Dict[str, Any]:
    """Groups the props by the given unique keys

    Args:
        data: the list to group
        unique_keys: the keys to group by

    Returns:
        a nested dictionary each level representing a different unique_key
    """
    result = {}
    non_terminal_keys = unique_keys[:-1]
    terminal_key = unique_keys[-1]

    for prop in data:
        current_group = result

        for k in non_terminal_keys:
            unique_value = prop[k]
            group = current_group.setdefault(unique_value, {})
            current_group = group

        terminal_value = prop[terminal_key]
        try:
            current_group[terminal_value].append(prop)
        except KeyError:
            current_group[terminal_value] = [prop]

    return result

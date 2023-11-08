from datetime import datetime, timedelta, timezone

from utils import date_time


def is_not_older_than(timestamp_str: str, seconds: int) -> bool:
    """Checks that the timestamp string is not older than the given number of seconds

    Args:
        timestamp_str: the timestamp string
        seconds: the number of seconds that timestamp should not be older than

    Returns:
        True if timestamp str is not older than the given seconds
    """
    return date_time.parse_datetime_string(timestamp_str) - datetime.now(
        tz=timezone.utc
    ) <= timedelta(seconds=seconds)

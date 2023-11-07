"""Test utilities for numbers"""
from typing import Any


def is_even(number: Any) -> bool:
    """Checks if number is even

    Args:
        number: the number ot check

    Returns:
        True if number is even, False otherwise
    """
    return number % 2 == 0

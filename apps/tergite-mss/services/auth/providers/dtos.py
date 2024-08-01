"""Data Transfer Objects for the auth providers"""
from pydantic import BaseModel


class AuthProvider(BaseModel):
    """The schema for all auth providers"""

    name: str
    email_domain: str

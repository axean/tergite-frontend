"""Data Transfer Objects for the auth providers"""
from pydantic import BaseModel


class AuthProviderRead(BaseModel):
    """The public view of an auth provider"""

    name: str
    url: str


class AuthProvider(AuthProviderRead):
    """The internal schema for all auth providers"""

    email_domain: str

from typing import List

import settings

from .dtos import AuthProvider, AuthProviderRead

_ALL_AUTH_PROVIDERS = [
    AuthProvider(
        name=client.name,
        email_domain=client.email_domain,
        url=client.redirect_url_v2.replace("/callback", "/authorize"),
    )
    for client in settings.CONFIG.auth.clients
]


def get_many_by_domain(email_domain: str) -> List[AuthProvider]:
    """Gets the auth providers that correspond to the given email domain

    Args:
        email_domain: the email domain to filter by

    Returns:
        list of matched auth providers
    """
    return [item for item in _ALL_AUTH_PROVIDERS if item.email_domain == email_domain]

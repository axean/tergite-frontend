"""Test utils for aiohttp"""


class MockResponse:
    def __init__(self, status: int, text: str = ""):
        self._text = text
        self.status = status

    async def text(self):
        return self._text

    async def __aexit__(self, exc_type, exc, tb):
        pass

    async def __aenter__(self):
        return self

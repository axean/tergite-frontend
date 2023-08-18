import json
from typing import Dict, Any


class MockWebsocket:
    """Mock websocket connection that returns the given text when recv is called"""

    def __init__(self, result_map: Dict[str, Any], default: Any = None):
        self._result_map = result_map
        self._text = ""
        self._default = default

    async def send(self, payload: str):
        data = json.loads(payload)
        device_name = data.get("value")

        if device_name is None:
            self._text = self._result_map
        else:
            self._text = self._result_map.get(device_name, self._default)

    async def recv(self):
        return json.dumps({"data": self._text, "response": self._text})

    async def __aexit__(self, exc_type, exc, tb):
        self._text = ""

    async def __aenter__(self):
        return self

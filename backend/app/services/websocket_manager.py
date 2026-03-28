"""
WebSocket Connection Manager (Observer Pattern - Subject).

Maintains a registry of active WebSocket connections keyed by file_hash.
When a scan completes, `broadcast()` pushes the result to every client
that subscribed to that particular hash.
"""

import json
from fastapi import WebSocket


class ConnectionManager:
    """Singleton that tracks WebSocket connections per file-hash topic."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # topic -> list of websocket connections (observers)
            cls._instance.active_connections: dict[str, list[WebSocket]] = {}
        return cls._instance

    async def connect(self, file_hash: str, websocket: WebSocket):
        """Accept and register a new observer for the given file_hash topic."""
        await websocket.accept()
        if file_hash not in self.active_connections:
            self.active_connections[file_hash] = []
        self.active_connections[file_hash].append(websocket)

    def disconnect(self, file_hash: str, websocket: WebSocket):
        """Remove an observer when the client disconnects."""
        if file_hash in self.active_connections:
            self.active_connections[file_hash] = [
                ws for ws in self.active_connections[file_hash] if ws is not websocket
            ]
            if not self.active_connections[file_hash]:
                del self.active_connections[file_hash]

    async def broadcast(self, file_hash: str, data: dict):
        """Notify all observers subscribed to a specific file_hash."""
        if file_hash not in self.active_connections:
            return

        message = json.dumps(data)
        stale: list[WebSocket] = []

        for ws in self.active_connections[file_hash]:
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(ws)

        # Clean up any broken connections
        for ws in stale:
            self.disconnect(file_hash, ws)

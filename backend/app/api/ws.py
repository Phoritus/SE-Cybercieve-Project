"""
WebSocket route for real-time scan status updates.

Clients connect to /api/ws/scans/{file_hash} and receive a JSON message
the moment the scan finishes.  Heartbeat pings keep the connection alive.
"""

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/scans/{file_hash}")
async def scan_status_ws(websocket: WebSocket, file_hash: str):
    """
    Observer endpoint — the frontend subscribes here to watch a file_hash.
    The connection stays open until the client disconnects or the server
    pushes a 'completed' event via ConnectionManager.broadcast().
    """
    await manager.connect(file_hash, websocket)
    try:
        while True:
            # Keep connection alive; also lets us detect client-side close.
            # The client can optionally send "ping" messages; we just ignore them.
            await asyncio.wait_for(websocket.receive_text(), timeout=30)
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(file_hash, websocket)

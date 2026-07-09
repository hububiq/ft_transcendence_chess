from typing import Dict
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    """
    Manages active WebSocket connections.
    In the future, this will support rooms (game_id → list of sockets).
    """

    def __init__(self):
        # game_id → WebSocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, game_id: int, websocket: WebSocket):
        """
        Accepts a WebSocket connection and registers it under a game_id.
        """
        await websocket.accept()
        self.active_connections[game_id] = websocket
        print(f"[WS] Game {game_id} connected")

    async def disconnect(self, game_id: int):
        """
        Removes a WebSocket connection for a given game_id.
        """
        websocket = self.active_connections.pop(game_id, None)
        if websocket:
            await websocket.close()
            print(f"[WS] Game {game_id} disconnected")

    async def send_to_user(self, game_id: int, message: dict):
        """
        Sends a JSON message to a specific user.
        """
        websocket = self.active_connections.get(game_id)
        if websocket:
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """
        Sends a JSON message to all connected users.
        """
        for game_id, websocket in self.active_connections.items():
            await websocket.send_json(message)

    # ---------------------------------------------------------
    # FUTURE FEATURE: ROOM SUPPORT
    # ---------------------------------------------------------
    # rooms: Dict[int, List[int]] = {}  # game_id → list[user_ids]
    #
    # async def send_to_room(self, game_id: int, message: dict):
    #     for user_id in self.rooms.get(game_id, []):
    #         await self.send_to_user(user_id, message)


# Global instance used by main.py
manager = ConnectionManager()

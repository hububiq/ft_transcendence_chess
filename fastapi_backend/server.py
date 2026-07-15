from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections.
    """
    def __init__(self):
        # game_id -> List of WebSockets
        self.rooms: Dict[int, List[WebSocket]] = {}

    async def connect(self, game_id: int, websocket: WebSocket):
        """
        Accepts a WebSocket connection and registers it under a game_id.
        """
        await websocket.accept()
        if game_id not in self.rooms:
            self.rooms[game_id] = []

        self.rooms[game_id].append(websocket)
        print(f"[WS] User connected to Game {game_id}")

    async def disconnect(self, game_id: int, websocket: WebSocket):
        """
        Removes a WebSocket connection for a given game_id.
        """
        if game_id in self.rooms:
            self.rooms[game_id].remove(websocket)
        if len(self.rooms[game_id]) == 0:
                del self.rooms[game_id]
        print(f"[WS] User disconnected from Game {game_id}")

    async def broadcast_to_game(self, game_id: int, message: dict):
        """
        Sends a JSON message to both players in a room.
        """
        if game_id in self.rooms:
            for connection in self.rooms[game_id]:
                await connection.send_json(message)

# this is supposed to be for chat
    # async def broadcast(self, message: dict):
    #     """
    #     Sends a JSON message to all connected users.
    #     """
    #     for game_id, websocket in self.active_connections.items():
    #         await websocket.send_json(message)

# global instance used by main.py
manager = ConnectionManager()

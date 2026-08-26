from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections.
    """
    def __init__(self):
        # game_id -> List[WebSocket]
        self.rooms: Dict[int, List[WebSocket]] = {}

        # NEW: user_id -> WebSocket
        self.user_sockets: Dict[int, WebSocket] = {}

    async def connect(self, game_id: int, websocket: WebSocket, user_id: int):
        """
        Registers an accepted WebSocket under a game_id and authenticated user_id.
        """
        # Register game room
        if game_id not in self.rooms:
            self.rooms[game_id] = []
        self.rooms[game_id].append(websocket)

        # Register user socket
        self.user_sockets[user_id] = websocket

        print(f"[WS] User {user_id} connected to Game {game_id}")

    async def disconnect(self, game_id: int, websocket: WebSocket, user_id: int):
        """
        Removes a WebSocket connection for a given game_id and user_id.
        """
        # Remove from game room
        if game_id in self.rooms:
            if websocket in self.rooms[game_id]:
                self.rooms[game_id].remove(websocket)
            if len(self.rooms[game_id]) == 0:
                del self.rooms[game_id]

        # Remove user socket
        if user_id in self.user_sockets:
            if self.user_sockets[user_id] == websocket:
                del self.user_sockets[user_id]

        print(f"[WS] User {user_id} disconnected from Game {game_id}")

    async def broadcast_to_game(self, game_id: int, message: dict):
        """
        Sends a JSON message to all players in a game room.
        """
        if game_id in self.rooms:
            for connection in self.rooms[game_id]:
                await connection.send_json(message)

    # Send message to a specific user (for tournament progression)
    async def send_to_user(self, user_id: int, message: dict):
        """
        Sends a JSON message to a specific user.
        Used for tournament match_start, tournament_won, etc.
        """
        if user_id in self.user_sockets:
            await self.user_sockets[user_id].send_json(message)
        else:
            print(f"[WS] User {user_id} not connected (cannot send message).")

    async def connect_lobby(self, user_id: int, websocket: WebSocket):
        """
        Accepts a WebSocket connection for the Lobby and ONLY adds them to the global phonebook.
        Does NOT put them in a game room!
        """
        await websocket.accept()
        self.user_sockets[user_id] = websocket
        print(f"[WS] User {user_id} connected to Lobby")

    async def disconnect_lobby(self, user_id: int, websocket: WebSocket):
        """
        Removes a Lobby WebSocket connection from the global phonebook.
        """
        if user_id in self.user_sockets:
            if self.user_sockets[user_id] == websocket:
                del self.user_sockets[user_id]
        print(f"[WS] User {user_id} disconnected from Lobby")

    async def broadcast_to_all(self, message: dict):
        """Sends a message to EVERY user currently connected to the global lobby."""
        for user_id, websocket in self.user_sockets.items():
            try:
                await websocket.send_json(message)
            except Exception:
                pass

# global instance used by main.py
manager = ConnectionManager()

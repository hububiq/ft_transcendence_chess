# Later in the future we will add here Redis so it will be creating rooms for the players by game ID.

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, 
from typing import List

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: Websocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
    
manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: Websocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnet:
        manager.disconnect(websocket)
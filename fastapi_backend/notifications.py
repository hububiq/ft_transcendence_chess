import json
import asyncio
from redis_client import get_pubsub
from server import manager

async def friendship_notifications_loop():
    print("[NOTIFICATIONS] Listening for friendship events...")
    
    while True:
        try:
            async for message in get_pubsub("friendship_events"):
                try:
                    data = json.loads(message)
                    
                    if data.get("type") == "friends_changed":
                        user_ids = data.get("user_ids", [])
                        
                        # Notify EVERY user involved in the friendship change
                        for uid in user_ids:
                            await manager.send_to_user(uid, {
                                "type": "notification",
                                "message": "Someone added or removed you as a friend!"
                            })
                            
                except Exception as e:
                    print(f"[NOTIFICATIONS PARSE ERROR] {e}")
                    
        except Exception as e:
            print(f"[NOTIFICATIONS FATAL ERROR] Redis connection lost: {e}")
            print("[NOTIFICATIONS] Reconnecting in 3 seconds...")
            await asyncio.sleep(3)
            # In production, you'd want a while True loop around this to restart it if it crashes!
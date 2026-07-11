## What is FastAPI sending to React during an AI game?

### When the game starts:
FastAPI sends the initial board layout.
```
{"type": "board_state", "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
```

### When the human moves:
FastAPI confirms the move was legal and sends the updated board.
```
{"type": "move", "move": "e2e4", "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"}
```

### Instantly after the human moves (The Bot Reaction):
FastAPI sends the Bot's move to React.
```
{"type": "move", "move": "e7e5", "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"}
```

### When someone gets Checkmate:
```
{"type": "game_over", "winner_id": 1, "pgn": "1. e4 e5..."}
```

## What JSON does React send to FastAPI? (The Move Payload)

```
{
  "type": "move",
  "move": "e2e4",
  "player_id": 5,          // The Django ID of the human moving
  "opponent_id": 26,       // The Django ID of the Bot 
  "is_vs_bot": true        // this is what triggers the AI to reply
}
```
FastAPI needs player_id and opponent_id so that if the game ends on this exact turn, it knows exactly which IDs to send to Django for the ELO update

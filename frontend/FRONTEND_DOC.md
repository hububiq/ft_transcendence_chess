# Frontend Developer Documentation

Here is the streamlined documentation containing only the information, setup steps, and architectural notes relevant to frontend development. 

---

### 1. Environment Setup
Before starting the development server, configure your local environment variables.
* Navigate to the root of the `frontend` directory.
* Duplicate the `.env.example` file and rename it to `.env`. 
* **Note:** This `.env` file is heavily utilized inside `frontend/src/api/axios.ts` to keep asynchronous API calls modular, organized, and secure.

### 2. Accessing the Application
Once the containers are running, the frontend environment is served via Vite and TypeScript. 
* **Local Development Server:** Access the UI at `http://localhost:3000`.

---

### 3. Frontend Architecture: The "Two-Avatar" System
Because the application supports both local image uploads and GitHub OAuth logins, the Profile JSON returned by the backend contains **two** distinct avatar fields. 

When building the UI, apply this strict conditional rendering logic:
1. **Primary Check (`avatar`):** First, check for a local uploaded file URL (e.g., `/media/avatars/me.jpg`). If it exists, render it.
2. **Fallback Check (`oauth_avatar_url`):** If the local avatar is `null`, fallback to the external OAuth link (e.g., `https://github.com/...`).
3. **Default:** If both fields are `null`, display a default blank "grey silhouette" placeholder picture.

---

### 4. API Integration Reference (Django)
The Django backend acts as the core Authentication and Profile microservice. Below are the endpoints the frontend needs to interact with.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/login/` | Send `email` and `password`. Returns JWT `access` and `refresh` tokens. | No |
| **POST** | `/api/token/refresh/` | Send the `refresh` token to receive a new active access token. | No |
| **POST** | `/api/register/` | Send `email`, `username`, and `password` to generate a blank profile. | No |
| **GET** | `/api/users/` | Fetches a JSON list of all registered users and their leaderboard stats. | No |
| **GET** | `/api/me/` | Retrieves the profile data for the currently logged-in user. | Yes (Bearer) |
| **PUT** | `/api/me/update/` | Send a JSON payload (e.g., `{"bio": "hello"}`) to edit the active profile. | Yes (Bearer) |
| **POST** | `/api/me/avatar/` | Send `multipart/form-data` with an image file named `avatar` to upload. | Yes (Bearer) |

#### Example cURL Requests for Reference
**Login (Retrieving the JWT):**
```bash
curl -X POST http://localhost:8000/api/login/ \
-H "Content-Type: application/json" \
-d '{"email":"h@test.com","password":"123"}'
```

**Updating Profile Data:**
```bash
curl -X PUT http://localhost:8000/api/me/update/ \
-H "Authorization: Bearer PASTE_YOUR_ACCESS_TOKEN_HERE" \
-H "Content-Type: application/json" \
-d '{"bio":"I just updated this!","location":"Poland"}'
```

**Uploading an Avatar:**
```bash
curl -X POST http://localhost:8000/api/me/avatar/ \
-H "Authorization: Bearer PASTE_YOUR_ACCESS_TOKEN_HERE" \
-F "avatar=@test.jpg"
```

---

### 5. Remote / 1v1 Network Testing
If the backend developer has configured the server machine to accept remote connections across the campus network:
* The joining frontend player simply needs to open the server machine's IP address on port 3000 in their browser (e.g., `http://<HOST_IP>:3000`).

---

### 6. WebSocket Payloads (FastAPI Game Engine)

#### What is FastAPI sending to React during an AI game?

**When the game starts:**
FastAPI sends the initial board layout.
```json
{"type": "board_state", "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
```

**When the human moves:**
FastAPI confirms the move was legal and sends the updated board.
```json
{"type": "move", "move": "e2e4", "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"}
```

**Instantly after the human moves (The Bot Reaction):**
FastAPI sends the Bot's move to React.
```json
{"type": "move", "move": "e7e5", "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"}
```

**When someone gets Checkmate:**
```json
{"type": "game_over", "winner_id": 1, "pgn": "1. e4 e5..."}
```

#### What JSON does React send to FastAPI? (The Move Payload)

```json
{
  "type": "move",
  "move": "e2e4",
  "player_id": 5,          // The Django ID of the human moving
  "opponent_id": 26,       // The Django ID of the Bot 
  "is_vs_bot": true        // this is what triggers the AI to reply
}
```
*FastAPI needs `player_id` and `opponent_id` so that if the game ends on this exact turn, it knows exactly which IDs to send to Django for the ELO update.*

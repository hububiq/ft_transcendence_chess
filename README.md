**_This project has been created as part
of the 42 curriculum by hhurnik, wzielins, jkalinow, mmitkovi, hgatarek_**

# Chess42

# Description

Team-based, final Core Curriculum project in 42 Warsaw coding academy. Assignment was about creating single page application which transcend members more into full-stack developers. While having modular approach and key architectural decisions to make, it also demonstrates technical depth and big-picture-creativity. Our team decided to go with **web chess platform** with 1vs1, multiplayer with spectators mode, AI opponent and more. We attempted to build enterprise-grade, easy scalable architecture with the code as robust and clean as we possibly could develop.

### 1v1 Multiplayer

The multiplayer mode is a real-time chess arena built on WebSockets. It handles live moves, timers, and player interactions (draws, rematches, resignations) without HTTP polling.

- **Real-Time Communication (WebSockets):** The frontend uses a custom React hook  (`useGameReconnectSocket`) to maintain a persistent connection, but the heavy lifting is handled by FastAPI and Redis Pub/Sub. When a move is made, FastAPI instantly broadcasts the JSON payload through Redis to the opponent's WebSocket, completely bypassing slow HTTP polling. The server pushes JSON events (`move`, `board_state`, `draw_offer`), and the frontend updates the React state (FEN string, timers, move history) to trigger instant UI re-renders.

- **Move Validation** (The "Source of Truth"): While the frontend uses chess.js for visual drag-and-drop feedback, our FastAPI backend acts as the impenetrable Referee. Using python-chess, the backend strictly recalculates and validates every incoming move. If a move is illegal, the server rejects it and forces the frontend board to snap back to the true Server State, making cheating impossible.

- **Chess Clocks & The Arbiter**: the frontend visualizes the timer via a 1-second `setInterval`, but the actual time is securely tracked in Redis RAM using server-side timestamps. When a player's clock hits zero and the frontend sends a claim_timeout payload, our backend "Arbiter" function mathematically verifies the elapsed time before officially declaring a winner.

- **Event-Driven Tournaments**: The backend engine reads the game state to enforce strict tournament rules (e.g., disabling mutual draws). When a tournament game ends, an event-driven progression system (advance_tournament) checks the PostgreSQL bracket, automatically generates the next round of matches, and pushes a WebSocket redirect to the surviving players. From the frontend perspective, the component reads the initial server payload to check if the match is part of a tournament, dynamically hiding UI elements (like the "Offer Draw" button) to enforce strict tournament rules.

- **Post-Game Architecture**: Upon checkmate or surrender, FastAPI generates the official PGN history, asynchronously commits the game to its PostgreSQL database (fastapi_db), and makes a secure internal REST API call to Django (django_db) to recalculate and update the players' ELO ratings. From the frontend perspective, actions like offering a draw, resigning, or requesting a rematch send specific string payloads over the socket, triggering modal popups on the opponent's screen.


### Single-Player vs. AI

The single-player mode delivers a stable, low-latency chess match against a custom-built, server-side AI that survives unexpected browser interruptions.

- **The AI Engine (Minimax)**: Our AI is not a 3rd-party library. It is a custom-built recursive Minimax algorithm with Alpha-Beta pruning. It evaluates millions of board states by analyzing material point values and positional heuristics (e.g., prioritizing center-board control and penalizing edge-knights). We restricted it to Depth 4 to simulate challenging, human-like, imperfect play.

- **CPU Isolation**: Because calculating chess trees is highly CPU-bound, the AI logic runs entirely inside the FastAPI microservice. This guarantees that heavy bot computations never block the Django Auth server from serving other users.

- **Session Survival (Redis State)**: If a user accidentally closes their laptop or refreshes the page mid-match, the game is not lost. While React uses sessionStorage to trigger a reconnect, the true game state (FEN strings and move history) is safely frozen in Redis. The exact millisecond the WebSocket re-establishes, FastAPI fetches the data from Redis and flawlessly restores the board to its exact previous state.

- **Game Board (`chess.js`):** The visual chessboard uses the `chess.js` library to act as a real-time local referee. It instantly blocks illegal moves, highlights legal destinations/captures, and flashes a red warning on the King during check.
- **Real-Time AI Connection:** Gameplay runs over a continuous WebSocket connection. As soon as you make a legal move, the backend engine calculates its response and instantly pushes the updated FEN string back to the UI without loading lag.


## Database scheme

![Application Screenshot](docs/transcendence-db-scheme.png)

# Architecture summary and technology justification

For this project, we have chosen a **loosely-coupled microservices architecture**, separating our backend into two distinct services: an Authentication/Admin service and a Real-Time Game/AI service. This design ensures fault isolation, allows parallel team development and adheres strictly to the "Single Responsibility" principle. Entire project is built around microservices idea, which takes application to enterprise level, allows scalability while being immune to big breakdowns.

### 1. Django (Auth & Core Data Microservice)

Handles user management, OAuth2 authentication, profile CRUD operations, and serves the REST API.
Django is a "batteries-included" framework. For standard I/O-bound web tasks (like querying users or verifying passwords), it is unparalleled. It provides a highly secure, built-in admin panel and a robust ORM out-of-the-box, saving us weeks of development time on user permissions and security.

### 2. FastAPI (Game Engine & AI Microservice)

Handles real-time WebSockets, live multiplayer matchmaking, and CPU-intensive Artificial Intelligence (Minimax/Machine Learning).
Traditional web frameworks struggle with real-time, heavy-computation tasks. FastAPI is natively asynchronous and incredibly lightweight. By isolating our CPU-bound AI math and persistent WebSocket connections here, we ensure that a heavy chess calculation will never freeze the main Django server or prevent other users from logging into the website.

### 3. PostgreSQL (The Persistence Layer)

The central, relational database storing users, match histories, and tournament brackets.
A chess platform requires strict data integrity (e.g., a game cannot exist without two valid users). PostgreSQL is the industry standard for ACID-compliant (Atomicity, Consistency, Isolation, Durability), relational data.
To maintain strict microservice separation without overloading the host machine's RAM, we will run a single PostgreSQL Docker container, but initialize it with two separate logical databases (django_db and fastapi_db). This guarantees that our microservices remain completely independent at the data level.

### 4. Redis (The Message Broker, Matchmaking and Board State Fallback)

The "central nervous system" connecting the microservices.
Because Django and FastAPI have separate databases and run in different containers, they communicate asynchronously via Redis Pub/Sub. It also acts as an ultra-fast, in-memory queue for our matchmaking system and temporarily stores live game states to protect against sudden user disconnections.

### 5. React (The Client-Side Application)

The frontend is a Single Page Application (SPA) that splits network logic from visual components.

- **Secure Authentication & Token Rotation:** An Axios network interceptor acts as a gatekeeper. It automatically injects JWT Bearer tokens into secure requests and invisibly refreshes expired sessions in the background without interrupting the user.
- **Global State Memory:** A custom Context Provider (`AuthProvider`) holds the application's active memory, instantly broadcasting the user's login status to the navigation bar, game lobbies, and router guards.
- **Strict Routing Guards:** Dedicated React Router wrapper components block unauthenticated users from accessing active game pages and redirect logged-in users away from redundant login screens.

# Libraries used

**Backend Core & Architecture**

- Django REST Framework (DRF) & SimpleJWT**: Used to rapidly build the JSON API endpoints and provide stateless, mathematically verifiable JWT tokens.

- django-allauth & dj-rest-auth: Handled the complex OAuth2 callback flow for GitHub login, bridging the gap between social authentication and our React SPA.

- SQLModel / SQLAlchemy: To fulfill "Use an ORM" module, we used Django's built-in ORM for the Auth microservice, and SQLModel (an async SQLAlchemy wrapper) for the FastAPI microservice.

- Uvicorn: The high-performance ASGI (Asynchronous Server Gateway Interface) web server that powers FastAPI. Unlike traditional WSGI servers, Uvicorn natively supports the asynchronous event loop required to keep our live multiplayer WebSockets open simultaneously.


**Game Logic & Data Flow**

- python-chess: The absolute "Source of Truth" referee inside FastAPI. It validates legal moves, calculates checkmates, and generates the official PGN histories.

- Pydantic & pydantic-settings: Provides rigorous, C-like type checking and data validation for incoming JSON payloads in FastAPI (protecting the server from bad frontend data). Also handles strict, type-safe loading of our .env variables to prevent startup crashes.
 
- HTTPX (Async): An asynchronous HTTP client. When a match ends, FastAPI uses httpx.AsyncClient() to send a non-blocking REST API request to Django to update player ELO ratings, ensuring the real-time game engine never freezes.

- Redis Client (redis.asyncio & redis): The Python interface for our message broker. Used asynchronously in FastAPI for matchmaking queues and caching live FEN board states. Used synchronously in Django to broadcast social events (like friendship updates) across the microservice boundary.

**Frontend**

- React & Vite (TypeScript): The core framework and build tool, providing a fast, component-based UI with strict type safety.

- Tailwind CSS: Used for all styling, allowing for a rapid, custom dark-mode design system without bloated CSS files.

- chess.js: The local chess engine referee. Used client-side to instantly validate moves, calculate check states, and generate legal move hints before sending data to the server.

- react-chessboard: A highly customizable React wrapper for the chessboard visual interface, seamlessly integrating with `chess.js`.

- Axios: Handles all synchronous REST API HTTP requests, featuring custom interceptors for automatic JWT token rotation.

- React Router: Manages client-side navigation and route protection (`ProtectedRoute` / `PublicOnlyRoute`) to secure private game lobbies.

**Utilities**

- Pillow: Required by Django's ImageField to securely validate, process, and save user-uploaded avatar files directly into our Docker media volume.

- Faker: Used to write our seed_db.py script, allowing us to rapidly generate 50+ realistic test users, ELO ratings, and bots to unblock frontend UI development.

- cryptography: A highly secure, C-based encryption library required by django-allauth to safely parse, validate, and decrypt external OpenID Connect (OIDC) and OAuth tokens (like Google and GitHub).

- python-dotenv: A lightweight tool that reads key-value pairs from a .env file and loads them into the system environment. This works seamlessly with Pydantic in FastAPI to ensure our application secrets are safely loaded into memory without hardcoding them.

# Instruction

**Prerequisites**

Project is fully containerized. No need to install Python, Node.js, or PostgreSQL. Only tools needed:

- Git 
- Docker Engine with Docker Compose
- Make 

**Step-by-step installation**

1. Clone the repository
```
git clone <repository_url> chess42
cd chess42
```

2. Setup the Environment Variables

Create two .env files based on the provided templates.
- *Backend Secrets*: In the root directory, copy .env.example to .env. Generate a random 50-character string for the SECRET_KEY, and ensure the POSTGRES_PASSWORD perfectly matches the password inside the DATABASE_URL string.
- *Frontend URLs*: In the frontend/ directory, copy .env.example to .env. Add your GitHub Client ID (see Step 3 below).

3.  Configure GitHub OAuth2 (Mandatory for GitHub Login)

To enable the social login module:
- Go to your GitHub account: Settings > Developer Settings > OAuth Apps > New OAuth App.
- Set the Homepage URL to your frontend URL (e.g., http://localhost:3000).
- Set the Authorization callback URL to http://localhost:3000/auth/github/callback.
- Copy the generated Client ID and Client Secret into the root .env file (GITHUB_CLIENT_ID and GITHUB_SECRET).
- Also place the Client ID in the frontend/.env file (VITE_GITHUB_CLIENT_ID).

4. Build and Run the Project

We have automated the database migrations and OAuth injections into a single command. From the root directory, run:
```
make
```

5. Access the platform 
- Frontend (Play the Game): http://localhost:3000
- Django Admin (Manage Users): http://localhost:8000/admin/
- FastAPI Docs (Game Engine Swagger API): http://localhost:8001/docs


# How to test Remore Multiplayer (LAN)

To satisfy the Remote Players major module, two players on the same network can play together.
- Find the Host IP: On the machine running Docker, find the local IP address (hostname -I command).
- Update Django Settings: Open django_backend/core/settings.py and add the Host IP to both ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS.
- Update React Environment: Open frontend/.env and replace all localhost instances with the Host IP (e.g., VITE_BASE_API_URL="http://10.11.12.13:8000").
- Update fastapi_backend/main.py. Right below imports, in this sections after colon add host IP:
```
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://10.18.200.89:3000",  # for campus 1vs1 2 machines testing - add your own IP
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.13.9.2:3000",
        "http://172.29.45.254:3000",
		"http://10.13.5.3:3000",
    ],
```

- Update GitHub OAuth: Temporarily update your GitHub OAuth App's Authorization Callback URL to use the Host IP instead of localhost.
- Rebuild the Frontend Container: Run docker-compose up -d --build frontend to bake the new IP into the React code.
- Play. The second player simply opens their web browser, navigates to http://<Host-IP>:3000, logs in, and clicks "Find Match" at the same time as the host!



(software,
tools, versions, configuration like .env setup, etc.), and step-by-step instructions to
run the project

# Resources

# Roles

**Product Owner** (PO) Milos (mmitkovi)

**Project Manager** (PM)  Hubert, (hgatarek)

**Technical Lead / Architect**: Hubert, Mios

**Developers** - Honorata, Weronika, Jacek (hhurnik, wzielins, jkalinow)

Roles were rather fluid, with Honorata doing remarkable job in every role, at the end of the project becoming full Technical Lead.

# Project Management
### Tools & Workflow
- GitHub Issues (Task Tracking): We used GitHub Issues as our central vision board. Every feature, bug, and module from the 42 subject was translated into a dedicated Issue, tagged by category (Frontend, Backend, DevOps, AI), and assigned to specific team members to ensure total accountability.
= Branching Strategy: We utilized a strict Feature-Branch workflow. Developers worked on isolated branches (e.g., feat/user-management-django, fix/websocket-reconnect). We used conventional commits methodology.
- Code Reviews & Pull Requests: Code was never pushed directly to main. Every feature required a Pull Request (PR) and a code review to ensure that API contracts between the React frontend and the Python microservices were respected before merging.
- Knowledge base and extended documentation was hosted on GoogleDocs
- Daily Contributions: The team maintained a high velocity with code commits pushed daily. We prioritized continuous integration, ensuring that the docker-compose environment was always buildable and stable at the end of every day.

### Communication
- Slack (Daily Operations): Slack served as our primary communication hub. We used it for daily asynchronous updates, sharing server logs, rapidly debugging cross-container network errors (CORS, WebSocket drops), and documenting API JSON payload structures.
- Weekly Meetings (Architecture Syncs): We held mandatory weekly voice/video meetings. These sessions were dedicated to "Big Picture" sprint planning, resolving severe blockers, and making core architectural decisions (such as splitting the backend into Django and FastAPI, or designing the database schema).
### Task Distribution
Work was strictly modularized to fit the strengths of the team:
Frontend (React/Vite): Focused on UI/UX, state management, WebSocket integration, and building reusable design components.
- Backend & DevOps (Django/FastAPI/Docker): Focused on container orchestration, database schema design, REST API routing, JWT security, and implementing the Minimax chess AI.
- API Contracts: Whenever a new feature was planned (like Matchmaking or Tournaments), the Frontend and Backend leads would first agree on the exact JSON payload and HTTP/WebSocket endpoints, allowing both sides to develop their halves simultaneously.

# Features List

# Individual Contributions

# known limitations
test are not developed enough

# AI usage

# anything-else section
maybe some trello or some more from Agile development would be nice to use not only github issues



# Modules (total 21pts)

**_Major_**: Use a framework for both the frontend and backend. (2 pts)

Implementation: React (Vite/TypeScript) for the frontend, Django and FastAPI for the backend.

**_Major_**: Implement a complete web-based game where users can play against each
other. (2 pts)

Implementation: Fully functional 1v1 Chess game with strict move validation, checkmate/draw detection, and legal chess rules enforced by the backend referee.

**_Major_**: Implement real-time features using WebSockets. (2 pts)

Implementation: FastAPI WebSockets provide sub-millisecond game state updates, global social hub alerts, matchmaking under-the-hood notifications (match_start, tournament_updated, etc.), and global basic chat.

**_Major_**: Remote players — Enable two players on separate computers to play the
same game in real-time. (2 pts)

Implementation: Two players on completely separate computers can play in real-time over the network.

**_Major_**: Backend as microservices. (2 pts)

Implementation: Strict separation of concerns. As in modern architecture, we divide microservices by Technology Requirements (I/O vs Real-Time).

- Django's Responsibility: Traditional HTTP Auth/User data in Request/Response cycle. It handles the heavy database querying, security, and static REST APIs (synchronous)

- FastAPI's Responsibility: High-speed, persistent Real-Time WebSocket Connections - game loops and AI logic. (asynchronous)

**_Major_**: Standard user management and authentication. (2 pts)

Implementation: Users can register, edit bios/locations, upload custom avatars, add/remove friends, and see real-time online status via WebSocket presence.

**_Major_**: Introduce an AI Opponent for games (2 pts)

Implementation: A custom-built recursive Minimax algorithm with Alpha-Beta pruning and positional heuristics (fighting for center control), running entirely on the FastAPI backend.

### Bonus Modules

**_Major_**: Allow users to interact with other users. (2pts)

Implementation:

- Profile System: Built a comprehensive public profile system where users can view avatars, ELO ratings, and bios.
- Friends System: Implemented a strict Many-To-Many relationship in the Django database allowing users to add/remove friends, integrated with a live WebSocket presence system (green dots) to show who is currently online.
- Global Chat: requires a persistent, powered by bi-directional WebSocket connection to broadcast messages instantly to X number of different people and Redis Pub/Sub message broker. Lives in FastAPI. If put to Django, it would block Django's HTTP threads and crash the site.

**_Minor_**: Game statistics and match history. (1 pt)

Implementation: Tracks ELO ratings, win/loss/draw counts, win streaksm leaderbord and more advanced statistics.

**_Minor_**: Implement a tournament system. (1 pt)

Implementation: An event-driven, real-time 4-to-8 player bracket system. Includes automatic progression, byes, and spectator UI for eliminated players.

**_Minor_**: Implement remote authentication with OAuth 2.0. (1 pt)

Implementation: Integrated GitHub login using dj-rest-auth, automatically fetching GitHub avatars and bypassing standard registration.

**_Minor_**: Use an ORM for the database. (1 pt)

Implementation: Django ORM for the django_db and SQLModel/SQLAlchemy for the fastapi_db

**_Minor_**: Custom-made design system with reusable components, including a proper
color palette, typography, and icons.

Implementation: Project follows strictly unified rules for UI:

- Design: Implemented a strict dark-mode color palette (#0a0a0a backgrounds, neutral-900 borders, and blue/purple accents) with uniform typography and lucide-react iconography.

- Providing reusable components, such us:

1. Card Family: Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
2. Dialog Family: Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger

**_This project has been created as part
of the 42 curriculum by hhurnik, wzielins, jkalinow, mmitkovi, hgatarek_**

# Chess42

## Description

Team-based, final Core Curriculum project in 42 Warsaw coding academy. Assignment is about creating single page application which transcend members more into full-stack developers. While having modular approach and key architectural decisions to make, it also demonstrates technical depth and big-picture-creativity. Our team decided to go with **web chess platform** with 1vs1, multiplayer with spectators mode, AI opponent and more.

### 1v1 Multiplayer

The multiplayer mode is a real-time chess arena built on WebSockets. It handles live moves, timers, and player interactions (draws, rematches, resignations) without HTTP polling.

- **Real-Time Communication (WebSockets):** Uses a custom React hook (`useGameReconnectSocket`) to maintain a persistent connection to the backend. The server pushes JSON events (`move`, `board_state`, `draw_offer`), and the frontend updates the React state (FEN string, timers, move history) to trigger instant UI re-renders.
- **Move Validation (`chess.js`):** Reuses the `<ChessBoard/>` component. When a player moves a piece, a local `chess.js` instance checks if the move is legal. If it is, the frontend sends the move via the WebSocket. This prevents illegal moves from ever hitting the server.
- **Chess Clocks (`setInterval`):** Time management is handled via a 1-second interval. It checks the FEN string to see whose turn it is and ticks down their respective timer. If a clock hits 0, the client immediately sends a `claim_timeout` WebSocket payload to the server.
- **Player Interactions:** Actions like offering a draw, resigning, or requesting a rematch send specific string payloads over the socket, triggering modal popups on the opponent's screen.
- **Tournament Context:** The component reads the initial server payload to check if the match is part of a tournament, dynamically hiding UI elements (like the "Offer Draw" button) to enforce strict tournament rules.

### Single-Player vs. AI

The single-player mode delivers a stable, low-latency chess match against a server-side AI, that survives unexpected browser interruptions.

- **Game Board (`chess.js`):** The visual chessboard uses the `chess.js` library to act as a real-time local referee. It instantly blocks illegal moves, highlights legal destinations/captures, and flashes a red warning on the King during check.
- **Real-Time AI Connection:** Gameplay runs over a continuous WebSocket connection. As soon as you make a legal move, the backend engine calculates its response and instantly pushes the updated FEN string back to the UI without loading lag.
- **Human-Like Opponent:** The interface tracks the engine's computation time, triggering a "bot thinking" visual state, and logging all moves in Standard Algebraic Notation (SAN).
- **Session Survival:** To protect against accidental page refreshes, the app ties into browser `sessionStorage`. If reloaded mid-match, the game instantly reconnects, feeds the saved FEN string back into `chess.js`, and flawlessly restores the exact board state.

## Database scheme

![Application Screenshot](docs/transcendence-db-scheme.png)

## Architecture summary and technology justification

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

## Libraries used

### Backend

**python-chess**: The absolute "Source of Truth" referee inside FastAPI. It validates legal moves, calculates checkmates, and generates the official PGN histories.

**Django REST Framework (DRF) & SimpleJWT**: Used to rapidly build the JSON API endpoints and provide stateless, mathematically verifiable JWT tokens.

**django-allauth & dj-rest-auth**: Handled the complex OAuth2 callback flow for GitHub login.

**SQLModel / SQLAlchemy**: To fulfill "Use an ORM" module, we used Django's built-in ORM for the Auth microservice, and SQLModel (an async SQLAlchemy wrapper) for the FastAPI microservice.

### Frontend

**React & Vite (TypeScript):** The core framework and build tool, providing a fast, component-based UI with strict type safety.
**Tailwind CSS:** Used for all styling, allowing for a rapid, custom dark-mode design system without bloated CSS files.
**chess.js:** The local chess engine referee. Used client-side to instantly validate moves, calculate check states, and generate legal move hints before sending data to the server.
**react-chessboard:** A highly customizable React wrapper for the chessboard visual interface, seamlessly integrating with `chess.js`.
**Axios:** Handles all synchronous REST API HTTP requests, featuring custom interceptors for automatic JWT token rotation.
**React Router:** Manages client-side navigation and route protection (`ProtectedRoute` / `PublicOnlyRoute`) to secure private game lobbies.

# Instructions TO BE ADDED !!

(software,
tools, versions, configuration like .env setup, etc.), and step-by-step instructions to
run the project

# Resources TO BE ADDED !!

## Roles, Project Management, Features List, Individual Contributions TO BE ADDED !!

## Mandatory Modules

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

**Bonus Modules**

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

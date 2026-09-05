***This project has been created as part
of the 42 curriculum by hhurnik, wzielins, jkalinow, mmitkovi, hgatarek***

# 42Chess

## Description 

Team-based, final Core Curriculum project in 42 Warsaw coding academy. Assignment is about creating single page application which transcend members more into full-stack developers. While having modular approach and key architectural decisions to make, it also demonstrates technical depth and big-picture-creativity. Our team decided to go with **web chess platform** with 1vs1, multiplayer with spectators mode, AI opponent and more.


***!!! MORE ABOUT THE GAME - TO BE ADDED !!!***

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

### 5. React (To be added)

## Libraries used 

### Backend

**python-chess**: The absolute "Source of Truth" referee inside FastAPI. It validates legal moves, calculates checkmates, and generates the official PGN histories.

**Django REST Framework (DRF) & SimpleJWT**: Used to rapidly build the JSON API endpoints and provide stateless, mathematically verifiable JWT tokens.

**django-allauth & dj-rest-auth**: Handled the complex OAuth2 callback flow for GitHub login.

**SQLModel / SQLAlchemy**: To fulfill "Use an ORM" module, we used Django's built-in ORM for the Auth microservice, and SQLModel (an async SQLAlchemy wrapper) for the FastAPI microservice.

### Frontend (To ba added)

# Instructions TO BE ADDED !!
(software,
tools, versions, configuration like .env setup, etc.), and step-by-step instructions to
run the project

# Resources TO BE ADDED !!

## Roles,  Project Management, Features List, Individual Contributions TO BE ADDED !!

## Mandatory Modules
***Major***: Use a framework for both the frontend and backend. (2 pts)

Implementation: React (Vite/TypeScript) for the frontend, Django and FastAPI for the backend.

***Major***: Implement a complete web-based game where users can play against each
other. (2 pts)

Implementation: Fully functional 1v1 Chess game with strict move validation, checkmate/draw detection, and legal chess rules enforced by the backend referee.

***Major***: Implement real-time features using WebSockets. (2 pts)

Implementation: FastAPI WebSockets provide sub-millisecond game state updates, global social hub alerts, matchmaking under-the-hood notifications (match_start, tournament_updated, etc.), and global basic chat.

***Major***: Remote players — Enable two players on separate computers to play the
same game in real-time. (2 pts)

Implementation: Two players on completely separate computers can play in real-time over the network.

***Major***: Backend as microservices. (2 pts)

Implementation: Strict separation of concerns. As in modern architecture, we divide microservices by Technology Requirements (I/O vs Real-Time).

- Django's Responsibility: Traditional HTTP Auth/User data in Request/Response cycle. It handles the heavy database querying, security, and static REST APIs (synchronous)

- FastAPI's Responsibility: High-speed, persistent Real-Time WebSocket Connections - game loops and AI logic. (asynchronous)

***Major***: Standard user management and authentication. (2 pts)

Implementation: Users can register, edit bios/locations, upload custom avatars, add/remove friends, and see real-time online status via WebSocket presence.

***Major***: Introduce an AI Opponent for games (2 pts)

Implementation: A custom-built recursive Minimax algorithm with Alpha-Beta pruning and positional heuristics (fighting for center control), running entirely on the FastAPI backend.

**Bonus Modules**

***Major***: Allow users to interact with other users. (2pts)

Implementation:
- Profile System: Built a comprehensive public profile system where users can view avatars, ELO ratings, and bios.
- Friends System: Implemented a strict Many-To-Many relationship in the Django database allowing users to add/remove friends, integrated with a live WebSocket presence system (green dots) to show who is currently online.
- Global Chat: requires a persistent, powered by bi-directional WebSocket connection to broadcast messages instantly to X number of different people and Redis Pub/Sub message broker. Lives in FastAPI. If put to Django, it  would block Django's HTTP threads and crash the site.


***Minor***: Game statistics and match history. (1 pt)

Implementation: Tracks ELO ratings, win/loss/draw counts, win streaksm leaderbord and more advanced statistics.

***Minor***: Implement a tournament system. (1 pt)

Implementation: An event-driven, real-time 4-to-8 player bracket system. Includes automatic progression, byes, and spectator UI for eliminated players.

***Minor***: Implement remote authentication with OAuth 2.0. (1 pt)

Implementation: Integrated GitHub login using dj-rest-auth, automatically fetching GitHub avatars and bypassing standard registration.

***Minor***: Use an ORM for the database. (1 pt) 

Implementation: Django ORM for the django_db and SQLModel/SQLAlchemy for the fastapi_db

***Minor***: Custom-made design system with reusable components, including a proper
color palette, typography, and icons.

Implementation: Project follows strictly unified rules for UI: 
- Design: Implemented a strict dark-mode color palette (#0a0a0a backgrounds, neutral-900 borders, and blue/purple accents) with uniform typography and lucide-react iconography. 

- Providing reusable components, such us:
1) Card Family: Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
2) Dialog Family: Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
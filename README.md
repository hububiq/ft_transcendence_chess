# ft_transcendence


Team-based, final Core Curriculum project in 42 Warsaw coding academy. Assignment is about creating single page application which transcend members more into full-stack developers. While having modular approach and key architectural decisions to make, it also demonstrates technical depth and big-picture-creativity. Our team decided to go with **web chess platform** with 1vs1, multiplayer with spectators mode, AI opponent and more.

## Database scheme
![Application Screenshot](docs/transcendence-db-scheme.png)

## Architecture summary and technology justification

For this project, we have chosen a **loosely-coupled microservices architecture**, separating our backend into two distinct services: an Authentication/Admin service and a Real-Time Game/AI service. This design ensures fault isolation, allows parallel team development and adheres strictly to the "Single Responsibility" principle.

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
### 4. Redis (The Message Broker)
The "central nervous system" connecting the microservices.
Because Django and FastAPI have separate databases and run in different containers, they communicate asynchronously via Redis Pub/Sub. It also acts as an ultra-fast, in-memory queue for our matchmaking system and temporarily stores live game states to protect against sudden user disconnections.

# Developer cheat sheet

## 1. Start the Project

## 0. FIRST TIME SETUP (do this immediately after cloning repo)
**Step A: Configure Environment Variables (.env)**
1. Copy the `.env.example` file and rename it to `.env`.

2. **PASSWORD COMPLIANCE:** You must ensure the password defined in `POSTGRES_PASSWORD` perfectly matches the password written inside the `DATABASE_URL` string. If they do not match, PostgreSQL will lock Django out.
**Django project SECRET_KEY** you can generate at https://djecrety.ir/ and copy paste to your own .env.
   ```env
    # Example: 'supersecret42' MUST be exactly the same in both places!
   POSTGRES_USER=admin
   POSTGRES_PASSWORD=supersecret42
   DATABASE_URL=postgres://admin:supersecret42@postgres_db:5432/django_db

   SECRET_KEY = <paste_a_random_50_character_string_here>
   ```

**Step B: Build and Boot Containers**
Start the project in the background:
```
make up (or docker-compose up -d --build)
```


**IMPORTANT-----WSL / Linux Permission Fix-----**

Because Docker runs as the root user, any files it generates (like Python cache or migrations) will be locked. If you get a "Permission Denied" error when trying to save settings.py in VS Code, run this command in your WSL terminal (in Makefile root directory) to take ownership of the files back from Docker:
```
sudo chown -R $USER:$USER .
```

## Test the Localhost
Run make re (to restart with the new commands). Open your browser:
 * Django: http://localhost:8000 (You should see {"message": "Django is running"})
 * FastAPI: http://localhost:8001 (You should see {"message": "FastAPI is running!"})
 * FastAPI Docs: http://localhost:8001/docs (Auto-generated API Swagger docs!)
 * Django users database in json format through RestAPI: http://localhost:8000/api/users/
 * Django Admin panel (CRUD): http://localhost:8000/admin/
 * Our frontend mockup website with Typescript on Vite server: http://localhost:3000
## 1. Initialize/Sync the Database (Migrations)
Now that Django knows about PostgreSQL and our custom users, generate the SQL tables:

*(Do this also after git pull! If someone changed `models.py`, you must update your local database)*

Just type `make migrate`- below commands are for pro.

* `docker exec -it django_backend python manage.py makemigrations`
* `docker exec -it django_backend python manage.py migrate`



Migrations has own history. If you are not pulling for the first time, they will add on the top of your local database changes that have been done before

## 2. Share and manage the Database State

In our setup, it's better to load the data which is in django_backend/fixtures/mock_db_json so we are all synchronized. (type point nr 3 from below (loaddata))

*  **Mock: To generate fake test data (Users, Bots, ELOs):**
    `docker exec -it django_backend python seed_db.py`
*   **To EXPORT your database to a file (so others can use it):**
    `docker exec -it django_backend bash -c "mkdir -p fixtures && python manage.py dumpdata users > fixtures/mock_db.json"`
    You can git push it to repo for everybody to use and be on the same page with most up-to-date database.
*   **To IMPORT a database file your teammate pushed to Git:**
    `docker exec -it django_backend python manage.py loaddata fixtures/mock_db.json`

## 3. Add new Python Libraries
If you need a new library (like `requests`):
1. Add it to `requirements.txt` manually.
2. Run `make up` to rebuild the container with the new library.
*If you are pro: To freeze exact versions of what is currently installed locally at your machine, use `docker exec -it django_backend pip freeze > requirements.txt`* 
This one-liner will basically rewrite dependencies with your new ones and sum it up in requirements.txt file.

## 4. Add new apps to Django/FastApi
If you add a new app directory (like Django/users) you need to change settings.py accordingly and push it to the GitHub repository for everybody to use.
```bash
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'users', 
    'rest_framework',
    #<your_new_app,>
]
```

After pushing new requirements or settings.py, anyone pulling must remember to migrate models to update one's local database and **setup OAuth infrastructure (requires client ID and secret github key - ask superuser for that)**
```bash
sudo docker exec -it django_backend python setup_oauth.py
```
 
### How to create superuser to manage CRUD
If you wanna create new super user with terminal CLI, you should type:
```python
docker exec -it django_backend python manage.py createsuperuser
```
It will prompt you to type in email, username and password (min 8 characters). Write your credentials down.

## 
## DJANGO API CHEAT SHEET (For Frontend & FastAPI)

Our Django backend acts as the core Auth & Profile microservice. Here are the endpoints currently available:

### Authentication (JWT)
*   **POST** `/api/login/` -> Send `email` and `password` of one of the database profiles. Returns JWT `access` and `refresh` tokens.
```bash
curl -X POST http://localhost:8000/api/login/ \
-H "Content-Type: application/json" \
-d '{"email":"h@test.com","password":"123"}'
```
* Copy the long string next to "access": .Will be used in the next commands.
*   **POST** `/api/token/refresh/` -> Send `refresh` token to get a new access token.
*   **POST** `/api/register/` -> Send `email`, `username`, and `password`. Automatically generates a blank Profile.

### Public Data (Leaderboards)
*   **GET** `/api/users/` -> Returns a JSON list of all users and their stats.

### Protected Actions (Requires `Authorization: Bearer <token>` Header)
*   **GET** `/api/me/` -> Returns the logged-in user's profile.
```bash
curl -X GET http://localhost:8000/api/me/ \
-H "Authorization: Bearer PASTE_YOUR_ACCESS_TOKEN_HERE"
```
*   **PUT** `/api/me/update/` -> Send JSON (e.g. `{"bio": "hello", "location": "Poland"}`) to edit your profile.
```bash
curl -X PUT http://localhost:8000/api/me/update/ \
-H "Authorization: Bearer PASTE_YOUR_ACCESS_TOKEN_HERE" \
-H "Content-Type: application/json" \
-d '{"bio":"I just updated this via cURL!","location":"Poland"}'
```
*   **POST** `/api/me/avatar/` -> Send `multipart/form-data` with an image file named `avatar` to upload a local picture.
```bash
curl -X POST http://localhost:8000/api/me/avatar/ \
-H "Authorization: Bearer PASTE_YOUR_ACCESS_TOKEN_HERE" \
-F "avatar=@test.jpg"
```

### Microservice Internal APIs (For FastAPI)
*   **POST** `/api/update-elo/` -> (FastAPI use only) Send `winner_id` and `loser_id` to mathematically update ELO ratings after a match.

### Frontend Architecture Note: The "Two-Avatar" System
Milos (React): Because we allow both local uploads and GitHub OAuth logins, the Profile JSON contains TWO avatar fields:
1. `avatar` (Local uploaded file URL, like `/media/avatars/me.jpg`)
2. `oauth_avatar_url` (External link, like `https://github.com/...`)
When building the UI, check if `avatar` exists first. If it is null, fallback to `oauth_avatar_url`. If both are null, show a default blank picture "grey silhouette"



### Useful commands

* To check if avatars are uploading to volumes, we can run this command which will create temporary apline container, list files of the volume directory from given path, close container and delete it leaving no trace after it
```bash
docker run --rm -v transcendence_media_data:/media alpine ls -R /media
```

* To check it by running the particular container:
```bash
docker exec -it <name_of_container> ls -la /app/media
```
In this case, to check avatars on the backend. placeholder should be replaced with "django_backend"

---
## How to set-up frontend
Inside the root of the frontend folder duplicate `.env.example` and rename it `.env`. This (`.env`) file is used inside `frontend/src/api/axios.ts` to make `async` call modulare and less crowded.

## How to sneak-peek database table "Game"

To check if consecutive games data was correctly saved to database, after the game you can type:
```
sudo docker exec -it postgres_db psql -U admin -d fastapi_db -c "SELECT id, white_player_id, black_player_id, status, winner_id FROM game ORDER BY id DESC LIMIT 1;"
```

```
sudo docker exec -it postgres_db psql -U admin -d fastapi_db -c "SELECT id, status, winner_id, moves_pgn FROM game ORDER BY id DESC LIMIT 1;"
```
We should think of writting bash scripts to automatically fetch this data.

## How to test if Redis holds the game FEN

```
sudo docker exect -it redis_broker redis-cli
```
Go and type "GET game:x:fen" with X being the number of game you are trying to track.
"Exit" to leave redis-cli.

## How to test 1vs game

### If you wanna create a game server
First, you need to know IPv4 of the machine running the server (our app). 
Then, insert this IP  to ALLOWED_HOSTS =  and CORS_ALLOWED_ORIGINS = ,
all inside django_backend/core/settings.py

### If you wanna join a game from remote machine on the same network (campus)
Now, player connecting to the game just needs to open <this_IP>:3000 in his browser.


## Adminer setup

At http://localhost:8080 you can log in using:
1. System: PostgreSQL
2. Server: postgres_db
3. Username: --> POSTGRES_USER from yours .env file
4. Password: --> POSTGRES_PASSWORD from yours .env file
5. Database: django_db or fastapi_db

Use Adminer 4.8.1 (not 5.5.0).

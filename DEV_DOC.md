# Developer cheat sheet

## 1. Start the Project

## 0. FIRST TIME SETUP (do this immediately after cloning repo)
**Step A: Configure Environment Variables (.env)**
1. Copy the `.env.example` file and rename it to `.env`.

2. **PASSWORD COMPLIANCE:** You must ensure the password defined in `POSTGRES_PASSWORD` perfectly matches the password written inside the `DATABASE_URL` string. If they do not match, PostgreSQL will lock Django out
   ```env
    # Example: 'supersecret42' MUST be exactly the same in both places!
   POSTGRES_USER=admin
   POSTGRES_PASSWORD=supersecret42
   DATABASE_URL=postgres://admin:supersecret42@postgres_db:5432/django_db

**Step B: Build and Boot Containers**
Start the project in the background:
```
make up (or docker-compose up -d --build)
```

Because our Git repository starts without any Django or FastAPI files, the containers will crash if they try to run `manage.py` or `main.py` immediately. Here is how to initialize the project for the very first time:

**Step A. Initialize FastAPI:**
1. Create a file named `main.py` inside `fastapi_backend/`.
2. Paste the basic "Hello World" code:
   ```python
   from fastapi import FastAPI
   app = FastAPI()
   @app.get("/")
   def read_root():
       return {"message": "FastAPI Microservice is running!"}
To build and start all containers in the background:
`make up` (or `docker-compose up -d --build`)

**Step C. Initialize Django:**
1. Open `django_backend/Dockerfile` and temporarily change the last line to:
   `CMD ["tail", "-f", "/dev/null"]` *(This keeps the empty container awake)*
2. Run `make up`.
3. Generate the Django project files inside the container:
   `docker exec -it django_backend django-admin startproject core .`
   *(Notice the dot `.` at the end! It puts the files in our current mapped folder).*
4. Change the `Dockerfile` last line back to normal:
   `CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]`


**Step D: Manually Configure settings.py**

1. Open django_backend/core/settings.py and make these 4 mandatory changes to connect our Microservices architecture:
At the very top of the file, add these imports:
```python
import os
import dj_database_url
```

Scroll to INSTALLED_APPS and add our custom users app to the bottom:
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    # ...
    'django.contrib.staticfiles',
    'users', # <-- ADD THIS LINE
]
```
Scroll to DATABASES, delete the default SQLite configuration, and replace it with this:
```python
DATABASES = {
    'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'))
}
```
At the very bottom of the file, add this line to enable our custom email-based user model:
```python
AUTH_USER_MODEL = 'users.User'
```

*Save the file.*

**IMPORTANT-----WSL / Linux Permission Fix-----**

Because Docker runs as the root user, any files it generates (like Python cache or migrations) will be locked. If you get a "Permission Denied" error when trying to save settings.py in VS Code, run this command in your WSL terminal (in Makefile root directory) to take ownership of the files back from Docker:
```
sudo chown -R $USER:$USER .
```


## Test the Localhost
Run make re (to restart with the new commands). Open your browser:
 Django: http://localhost:8000 (You should see the Django page!)
 FastAPI: http://localhost:8001 (You should see {"message": "FastAPI is running!"})
 FastAPI Docs: http://localhost:8001/docs (Auto-generated API Swagger docs!)

## 1. Initialize/Sync the Database (Migrations)
Now that Django knows about PostgreSQL and our custom users, generate the SQL tables:

*(Do this also after git pull! If someone changed `models.py`, you must update your local database)*
* `docker exec -it django_backend python manage.py makemigrations`
* `docker exec -it django_backend python manage.py migrate`

Migrations has own history. If you are not pulling for the first time, they will add on the top of your local database changes that have been done before

## 3. Share and manage the Database State
*  **Mock: To generate fake test data (Users, Bots, ELOs):**
    `docker exec -it django_backend python seed_db.py`
*   **To EXPORT your database to a file (so others can use it):**
    `docker exec -it django_backend python manage.py dumpdata users > mock_db.json`
    You can git push it to repo for everybody to use and be on the same page with most up-to-date database.
*   **To IMPORT a database file your teammate pushed to Git:**
    `docker exec -it django_backend python manage.py loaddata mock_db.json`

## 4. Add new Python Libraries
If you need a new library (like `requests`):
1. Add it to `requirements.txt` manually.
2. Run `make up` to rebuild the container with the new library.
*If you are pro: To freeze exact versions of what is currently installed, use `docker exec -it django_backend pip freeze > requirements.txt`* 
This one-liner will basically rewrite dependencies with your new ones and sum it up in requirements.txt file.

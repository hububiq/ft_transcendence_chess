# Developer cheat sheet

## 1. Start the Project

## 0. FIRST TIME SETUP (Day 1 Initialization)
Because our Git repository starts without any Django or FastAPI files, the containers will crash if they try to run `manage.py` or `main.py` immediately. Here is how to initialize the project for the very first time:

**A. Initialize Django:**
1. Open `django_backend/Dockerfile` and temporarily change the last line to:
   `CMD ["tail", "-f", "/dev/null"]` *(This keeps the empty container awake)*
2. Run `make up`.
3. Generate the Django project files inside the container:
   `docker exec -it django_backend django-admin startproject core .`
   *(Notice the dot `.` at the end! It puts the files in our current mapped folder).*
4. Change the `Dockerfile` last line back to normal:
   `CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]`

**B. Initialize FastAPI:**
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

## C.  Test the Localhost
Run make re (to restart with the new commands). Open your browser:
 Django: http://localhost:8000 (You should see the Django page!)
 FastAPI: http://localhost:8001 (You should see {"message": "FastAPI is running!"})
 FastAPI Docs: http://localhost:8001/docs (Auto-generated API Swagger docs!)

## 2. Sync the Database (Do this after git pull!)
If someone changed `models.py`, you must update your local database:
`docker exec -it django_backend python manage.py makemigrations`
`docker exec -it django_backend python manage.py migrate`

Migrations has own history, they will add on the top of your local database changes that has been done by somebody else.

## 3. Share the Database State
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

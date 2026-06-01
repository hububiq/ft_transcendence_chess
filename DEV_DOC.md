# Developer cheat sheet

## 1. Start the Project
To build and start all containers in the background:
`make up` (or `docker-compose up -d --build`)

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
*If you are pro: To freeze exact versions of what is currently installed, use `docker exec -it django_backend pip freeze > current_reqs.txt`* 
This one-liner will basically add rewrite dependencies with your new ones and sum it up in requirements.txt file.

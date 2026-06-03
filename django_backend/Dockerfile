FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc files and force stdout logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run the Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]


#  !!!!!!!!!! NOTE !!!!!!!!!!!

# on first run uncomment line below
# CMD ["tail", "-f", "/dev/null"]

# and paste this to terminal to download django package
# sudo docker exec -it django_backend django-admin startproject core .

# then, rebuild infrastructure
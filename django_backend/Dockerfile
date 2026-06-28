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


# FROM python:3.12-slim# 

# WORKDIR /app# 

# # System deps
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     libpq-dev \
#     && rm -rf /var/lib/apt/lists/*# 

# # Install Python deps
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt# 

# # Copy project
# COPY . .# 

# # Expose Django port
# EXPOSE 8000# 

# # Run Django dev server (ASGI for WebSockets if needed)
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]


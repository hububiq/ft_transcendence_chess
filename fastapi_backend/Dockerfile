FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run the FastAPI server using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]


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

# EXPOSE 8001# 

# # Run FastAPI with uvicorn
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI Microservice is running!"}

#just for now to show connection. without it container is crushing.
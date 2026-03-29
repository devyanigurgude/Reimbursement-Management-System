import uvicorn

if __name__ == "__main__":
    # Use 8001 by default to avoid collisions with other local services.
    uvicorn.run("app.main:app", host="localhost", port=8001, reload=True)

from fastapi import FastAPI

from app.database import Base, engine
from app import models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def raiz():
    return {"status": "funcionando"}
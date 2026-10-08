from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def raiz():
    return {"status": "funcionando"}


@app.post("/categorias", response_model=schemas.CategoriaOut, status_code=201)
def criar_categoria(dados: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    existente = db.scalar(select(models.Categoria).where(models.Categoria.nome == dados.nome))
    if existente:
        raise HTTPException(status_code=400, detail="Categoria já existe")
    categoria = models.Categoria(nome=dados.nome)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@app.get("/categorias", response_model=list[schemas.CategoriaOut])
def listar_categorias(db: Session = Depends(get_db)):
    return db.scalars(select(models.Categoria)).all()
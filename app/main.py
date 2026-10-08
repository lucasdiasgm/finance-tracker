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


@app.post("/transacoes", response_model=schemas.TransacaoOut, status_code=201)
def criar_transacao(dados: schemas.TransacaoCreate, db: Session = Depends(get_db)):
    categoria = db.get(models.Categoria, dados.categoria_id)
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    transacao = models.Transacao(**dados.model_dump())
    db.add(transacao)
    db.commit()
    db.refresh(transacao)
    return transacao


@app.get("/transacoes", response_model=list[schemas.TransacaoOut])
def listar_transacoes(db: Session = Depends(get_db)):
    return db.scalars(select(models.Transacao)).all()

@app.delete("/transacoes/{transacao_id}", status_code=204)
def excluir_transacao(transacao_id: int, db: Session = Depends(get_db)):
    transacao = db.get(models.Transacao, transacao_id)
    if transacao is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    db.delete(transacao)
    db.commit()

@app.put("/transacoes/{transacao_id}", response_model=schemas.TransacaoOut)
def atualizar_transacao(
    transacao_id: int, dados: schemas.TransacaoCreate, db: Session = Depends(get_db)
):
    transacao = db.get(models.Transacao, transacao_id)
    if transacao is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    categoria = db.get(models.Categoria, dados.categoria_id)
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    for campo, valor in dados.model_dump().items():
        setattr(transacao, campo, valor)
    db.commit()
    db.refresh(transacao)
    return transacao
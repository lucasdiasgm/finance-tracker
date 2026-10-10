from datetime import date
from fastapi.middleware.cors import CORSMiddleware

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
def listar_transacoes(
    mes: int | None = Query(default=None, ge=1, le=12),
    ano: int | None = Query(default=None, ge=2000, le=2100),
    categoria_id: int | None = None,
    db: Session = Depends(get_db),
):
    consulta = select(models.Transacao)
    if categoria_id is not None:
        consulta = consulta.where(models.Transacao.categoria_id == categoria_id)
    if ano is not None:
        consulta = consulta.where(
            models.Transacao.data >= date(ano, 1, 1),
            models.Transacao.data < date(ano + 1, 1, 1),
        )
    if mes is not None:
        if ano is None:
            raise HTTPException(status_code=400, detail="Informe o ano junto com o mês")
        inicio = date(ano, mes, 1)
        fim = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)
        consulta = consulta.where(
            models.Transacao.data >= inicio, models.Transacao.data < fim
        )
    return db.scalars(consulta.order_by(models.Transacao.data)).all()

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

@app.get("/resumo")
def resumo_mensal(
    mes: int = Query(ge=1, le=12),
    ano: int = Query(ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    inicio = date(ano, mes, 1)
    fim = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)
    linhas = db.execute(
        select(models.Categoria.nome, func.sum(models.Transacao.valor))
        .join(models.Transacao, models.Transacao.categoria_id == models.Categoria.id)
        .where(models.Transacao.data >= inicio, models.Transacao.data < fim)
        .group_by(models.Categoria.nome)
    ).all()
    por_categoria = {nome: str(total) for nome, total in linhas}
    total_geral = sum((total for _, total in linhas), start=0)
    return {
        "mes": mes,
        "ano": ano,
        "total": str(total_geral),
        "por_categoria": por_categoria,
    }
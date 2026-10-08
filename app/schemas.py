from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CategoriaCreate(BaseModel):
    nome: str


class CategoriaOut(BaseModel):
    id: int
    nome: str

    model_config = ConfigDict(from_attributes=True)


class TransacaoCreate(BaseModel):
    descricao: str
    valor: Decimal
    data: date
    categoria_id: int


class TransacaoOut(BaseModel):
    id: int
    descricao: str
    valor: Decimal
    data: date
    categoria_id: int

    model_config = ConfigDict(from_attributes=True)
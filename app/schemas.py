from pydantic import BaseModel, ConfigDict


class CategoriaCreate(BaseModel):
    nome: str


class CategoriaOut(BaseModel):
    id: int
    nome: str

    model_config = ConfigDict(from_attributes=True)

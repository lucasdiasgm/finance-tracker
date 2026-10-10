# Finance Tracker

API REST para controle de finanças pessoais, construída para praticar
desenvolvimento back-end com Python.

## Status
Back-end concluído e testado. Interface web em planejamento.

## Stack
Python 3.13, FastAPI, SQLAlchemy 2.0 (ORM), SQLite, Pydantic v2, Uvicorn,
pytest, httpx, Git.

## Funcionalidades
- [FEITO] Cadastro e listagem de categorias, com bloqueio de duplicatas (400)
- [FEITO] CRUD completo de transações (criar, listar, editar, excluir)
- [FEITO] Integridade referencial: transação só é criada ou editada se a
  categoria existir (404 caso contrário)
- [FEITO] Valores monetários com Decimal, evitando erros de arredondamento
- [FEITO] Filtros na listagem por mês, ano e categoria
- [FEITO] Resumo mensal: total gasto e total por categoria
- [FEITO] Testes automatizados com pytest (6 testes, banco em memória)
- [PLANEJADO] Interface web com formulários e gráficos
- [PLANEJADO] Autenticação

## Endpoints
| Método | Rota | Descrição |
|---|---|---|
| GET | /categorias | Lista categorias |
| POST | /categorias | Cria categoria |
| GET | /transacoes | Lista transações (filtros: mes, ano, categoria_id) |
| POST | /transacoes | Cria transação |
| PUT | /transacoes/{id} | Edita transação |
| DELETE | /transacoes/{id} | Exclui transação |
| GET | /resumo?mes=&ano= | Total do mês e total por categoria |

## Decisões técnicas
- **Separação em camadas**: `database.py` (conexão), `models.py` (tabelas),
  `schemas.py` (contratos de entrada e saída), `main.py` (rotas).
- **Schemas separados para entrada e saída** (`Create` e `Out`), para o
  cliente nunca definir o `id`.
- **Sessão por requisição** via dependência `get_db`, sempre fechada no `finally`.
- **Relacionamento 1:N** entre categorias e transações (`ForeignKey` e
  `relationship`).
- **Filtros por intervalo** (`>= início` e `< próximo mês`), que dispensam
  calcular o número de dias de cada mês.
- **Agregação no banco** (`SUM` com `GROUP BY`), e não em Python.
- **Testes isolados**: banco SQLite em memória por teste, trocando o `get_db`
  real via `dependency_overrides`; o `finance.db` nunca é tocado.

## Como rodar
```
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
Documentação interativa em http://127.0.0.1:8000/docs

## Testes
```
python -m pytest -v
```

## Estrutura
```
app/
├── database.py
├── models.py
├── schemas.py
└── main.py
tests/
├── conftest.py
└── test_api.py
```

## Aprendizados
Ambiente virtual e dependências, ORM, chaves primária e estrangeira, ciclo de
sessão e commit, códigos HTTP, parâmetros de consulta e de caminho, testes
automatizados, leitura de tracebacks, versionamento com Git e diagnóstico de
bloqueios de segurança do Windows (Smart App Control e Device Guard).
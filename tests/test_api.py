def criar_categoria(client, nome="Alimentação"):
    return client.post("/categorias", json={"nome": nome})


def test_criar_categoria(client):
    resp = criar_categoria(client)
    assert resp.status_code == 201
    assert resp.json()["nome"] == "Alimentação"


def test_categoria_duplicada(client):
    criar_categoria(client)
    resp = criar_categoria(client)
    assert resp.status_code == 400


def test_transacao_categoria_inexistente(client):
    resp = client.post(
        "/transacoes",
        json={"descricao": "X", "valor": 10, "data": "2026-10-07", "categoria_id": 99},
    )
    assert resp.status_code == 404


def test_crud_transacao(client):
    criar_categoria(client)
    dados = {"descricao": "Mercado", "valor": 150, "data": "2026-10-07", "categoria_id": 1}
    resp = client.post("/transacoes", json=dados)
    assert resp.status_code == 201
    tid = resp.json()["id"]

    dados["descricao"] = "Mercado do mês"
    resp = client.put(f"/transacoes/{tid}", json=dados)
    assert resp.json()["descricao"] == "Mercado do mês"

    assert client.delete(f"/transacoes/{tid}").status_code == 204
    assert client.delete(f"/transacoes/{tid}").status_code == 404


def test_resumo_mensal(client):
    criar_categoria(client, "Alimentação")
    criar_categoria(client, "Transporte")
    base = {"descricao": "x", "data": "2026-10-07"}
    client.post("/transacoes", json={**base, "valor": 150, "categoria_id": 1})
    client.post("/transacoes", json={**base, "valor": 4.5, "categoria_id": 2})
    client.post("/transacoes", json={**base, "valor": 80, "categoria_id": 1, "data": "2026-09-20"})

    resp = client.get("/resumo", params={"mes": 10, "ano": 2026})
    assert resp.status_code == 200
    corpo = resp.json()
    assert float(corpo["total"]) == 154.5
    assert float(corpo["por_categoria"]["Alimentação"]) == 150


def test_filtro_por_mes(client):
    criar_categoria(client)
    client.post("/transacoes", json={"descricao": "a", "valor": 1, "data": "2026-10-07", "categoria_id": 1})
    client.post("/transacoes", json={"descricao": "b", "valor": 1, "data": "2026-09-07", "categoria_id": 1})
    resp = client.get("/transacoes", params={"mes": 10, "ano": 2026})
    assert len(resp.json()) == 1
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";
const FORM_VAZIO = { descricao: "", valor: "", data: "", categoria_id: "" };

export default function App() {
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [resumo, setResumo] = useState(null);

  async function carregar() {
    try {
      const [resCat, resTr, resRes] = await Promise.all([
        fetch(`${API}/categorias`),
        fetch(`${API}/transacoes?mes=${mes}&ano=${ano}`),
        fetch(`${API}/resumo?mes=${mes}&ano=${ano}`),
      ]);
      setCategorias(await resCat.json());
      setTransacoes(await resTr.json());
      setResumo(await resRes.json());
    } catch {
      setErro("Não foi possível falar com a API. O servidor está rodando?");
    }
  }

  useEffect(() => {
    carregar();
  }, [mes, ano]);

  function nomeCategoria(id) {
    const categoria = categorias.find((c) => c.id === id);
    return categoria ? categoria.nome : "Sem categoria";
  }

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function iniciarEdicao(t) {
    setEditandoId(t.id);
    setForm({
      descricao: t.descricao,
      valor: t.valor,
      data: t.data,
      categoria_id: String(t.categoria_id),
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
  }

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    const url = editandoId
      ? `${API}/transacoes/${editandoId}`
      : `${API}/transacoes`;
    const resposta = await fetch(url, {
      method: editandoId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        valor: Number(form.valor),
        categoria_id: Number(form.categoria_id),
      }),
    });
    if (!resposta.ok) {
      setErro("Não foi possível salvar a transação.");
      return;
    }
    cancelarEdicao();
    carregar();
  }

  async function excluir(id) {
    if (!window.confirm("Excluir esta transação?")) return;
    setErro("");
    const resposta = await fetch(`${API}/transacoes/${id}`, {
      method: "DELETE",
    });
    if (!resposta.ok) {
      setErro("Não foi possível excluir a transação.");
      return;
    }
    if (id === editandoId) cancelarEdicao();
    carregar();
  }

  return (
    <div
      style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "sans-serif" }}
    >
      <h1>Finance Tracker</h1>
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <h2>{editandoId ? "Editar transação" : "Nova transação"}</h2>
      <form onSubmit={enviar} style={{ display: "grid", gap: 8 }}>
        <input
          name="descricao"
          placeholder="Descrição"
          value={form.descricao}
          onChange={mudar}
          required
        />
        <input
          name="valor"
          type="number"
          step="0.01"
          placeholder="Valor"
          value={form.valor}
          onChange={mudar}
          required
        />
        <input
          name="data"
          type="date"
          value={form.data}
          onChange={mudar}
          required
        />
        <select
          name="categoria_id"
          value={form.categoria_id}
          onChange={mudar}
          required
        >
          <option value="">Categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <button type="submit">{editandoId ? "Atualizar" : "Salvar"}</button>
        {editandoId && (
          <button type="button" onClick={cancelarEdicao}>
            Cancelar
          </button>
        )}
      </form>
      <h2>Período</h2>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          style={{ width: 70, textAlign: "center" }}
        />
      </div>

      {resumo && (
        <div>
          <h2>Resumo do mês: R$ {resumo.total}</h2>
          <ul>
            {Object.entries(resumo.por_categoria).map(([nome, total]) => (
              <li key={nome}>
                {nome}: R$ {total}
              </li>
            ))}
          </ul>
        </div>
      )}
      <h2>Transações</h2>
      <ul>
        {transacoes.map((t) => (
          <li key={t.id} style={{ marginBottom: 6 }}>
            {t.data} - {t.descricao} ({nomeCategoria(t.categoria_id)}): R${" "}
            {t.valor} <button onClick={() => iniciarEdicao(t)}>Editar</button>{" "}
            <button onClick={() => excluir(t.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

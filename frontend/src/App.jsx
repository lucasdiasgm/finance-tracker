import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const [resCat, resTr] = await Promise.all([
          fetch(`${API}/categorias`),
          fetch(`${API}/transacoes`),
        ]);
        setCategorias(await resCat.json());
        setTransacoes(await resTr.json());
      } catch {
        setErro("Não foi possível falar com a API. O servidor está rodando?");
      }
    }
    carregar();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Finance Tracker</h1>
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <h2>Categorias</h2>
      <ul>
        {categorias.map((c) => (
          <li key={c.id}>{c.nome}</li>
        ))}
      </ul>

      <h2>Transações</h2>
      <ul>
        {transacoes.map((t) => (
          <li key={t.id}>
            {t.data} - {t.descricao}: R$ {t.valor}
          </li>
        ))}
      </ul>
    </div>
  );
}
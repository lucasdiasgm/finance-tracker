import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const API = "http://127.0.0.1:8000";
const FORM_VAZIO = { descricao: "", valor: "", data: "", categoria_id: "" };
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CAMPO =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-tinta focus:border-lagoa-700 focus:outline-none focus:ring-2 focus:ring-lagoa-100";

function formatarValor(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

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
    const url = editandoId ? `${API}/transacoes/${editandoId}` : `${API}/transacoes`;
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
    const resposta = await fetch(`${API}/transacoes/${id}`, { method: "DELETE" });
    if (!resposta.ok) {
      setErro("Não foi possível excluir a transação.");
      return;
    }
    if (id === editandoId) cancelarEdicao();
    carregar();
  }

  const dadosGrafico = resumo?.por_categoria
    ? Object.entries(resumo.por_categoria).map(([nome, total]) => ({
        nome,
        total: Number(total),
      }))
    : [];

  return (
    <div className="min-h-screen bg-areia text-tinta">
      <header className="bg-lagoa-700 text-white shadow">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold">Finance Tracker</h1>
          <p className="text-sm text-lagoa-100">Controle simples das suas finanças pessoais</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              {editandoId ? "Editar transação" : "Nova transação"}
            </h2>
            <form onSubmit={enviar} className="space-y-3">
              <input name="descricao" placeholder="Descrição" value={form.descricao} onChange={mudar} required className={CAMPO} />
              <input name="valor" type="number" step="0.01" placeholder="Valor" value={form.valor} onChange={mudar} required className={CAMPO} />
              <input name="data" type="date" value={form.data} onChange={mudar} required className={CAMPO} />
              <select name="categoria_id" value={form.categoria_id} onChange={mudar} required className={CAMPO}>
                <option value="">Categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-md bg-lagoa-700 py-2 text-sm font-medium text-white hover:bg-lagoa-800"
              >
                {editandoId ? "Atualizar" : "Salvar"}
              </button>
              {editandoId && (
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  className="w-full rounded-md border border-stone-300 py-2 text-sm hover:bg-stone-50"
                >
                  Cancelar
                </button>
              )}
            </form>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Resumo do mês</h2>
              <div className="flex gap-2">
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="rounded-md border border-stone-300 px-2 py-1 text-sm"
                >
                  {MESES.map((nome, i) => (
                    <option key={nome} value={i + 1}>{nome}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="w-20 rounded-md border border-stone-300 px-2 py-1 text-center text-sm"
                />
              </div>
            </div>

            <p className="text-sm text-stone-500">Total gasto</p>
            <p className="mb-4 text-3xl font-bold text-terracota-700">
              {formatarValor(resumo?.total ?? 0)}
            </p>

            {dadosGrafico.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer>
                  <BarChart data={dadosGrafico}>
                    <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(valor) => formatarValor(valor)} />
                    <Bar dataKey="total" fill="#e07a5f" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-stone-400">Sem transações neste mês.</p>
            )}
          </section>
        </div>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Transações</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2">Data</th>
                  <th className="py-2">Descrição</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2 text-right">Valor</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-stone-400">
                      Nenhuma transação neste período.
                    </td>
                  </tr>
                )}
                {transacoes.map((t) => (
                  <tr key={t.id} className="border-b border-stone-100 hover:bg-lagoa-50">
                    <td className="py-2">{formatarData(t.data)}</td>
                    <td className="py-2">{t.descricao}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-lagoa-100 px-2 py-0.5 text-xs text-lagoa-800">
                        {nomeCategoria(t.categoria_id)}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums">{formatarValor(t.valor)}</td>
                    <td className="space-x-3 py-2 text-right">
                      <button onClick={() => iniciarEdicao(t)} className="text-lagoa-700 hover:underline">
                        Editar
                      </button>
                      <button onClick={() => excluir(t.id)} className="text-red-700 hover:underline">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
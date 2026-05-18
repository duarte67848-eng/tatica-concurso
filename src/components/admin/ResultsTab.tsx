import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Result, DetalheQuestao } from "../../lib/adminTypes";
import { c, card, btnBlue, btnRed } from "../../styles/admin";

export default function ResultsTab({ results, setResults }: {
  results: Result[]; setResults: (r: Result[]) => void;
}) {
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  async function deleteResult(id: number) {
    if (confirm("Excluir resultado?")) {
      await supabase.from("resultado").delete().eq("id", id);
      setResults(results.filter(r => r.id !== id));
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>
        Histórico de Resultados ({results.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: c.textSecondary }}>Nenhum resultado ainda</div>
        ) : (
          results.map((r) => (
            <div key={r.id} style={{ ...card() }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: c.text, fontWeight: "bold" }}>{r.nome_usuario || r.email_usuario}</span>
                <span style={{ color: c.gold, fontWeight: "bold", fontSize: "1.25rem" }}>PF: {r.pf.toFixed(2)}</span>
              </div>
              <p style={{ marginBottom: "0.5rem", color: c.textSecondary }}>
                Acertos: {r.acertos} | Erros: {r.erros} | Questões: {r.total_questoes}
              </p>
              <p style={{ marginBottom: "0.5rem", color: c.blue, fontSize: "0.875rem" }}>
                📅 {r.criado_em ? new Date(r.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' }) : 'Sem data'}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => setExpandedResult(expandedResult === r.id ? null : r.id)} style={btnBlue()}>
                  {expandedResult === r.id ? "OCULTAR DETALHES" : "VER DETALHES"}
                </button>
                <button onClick={() => deleteResult(r.id)} style={btnRed()}>EXCLUIR</button>
              </div>

              {expandedResult === r.id && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: c.background, borderRadius: "4px" }}>
                  {!r.detalhes ? (
                    <div style={{ color: c.textSecondary, textAlign: "center", padding: "2rem" }}>
                      Este resultado não possui detalhes salvos.<br />Faça um novo simulado para ver os detalhes.
                    </div>
                  ) : (() => {
                    try {
                      const raw = typeof r.detalhes === "string" ? JSON.parse(r.detalhes) : r.detalhes;
                      const blocos = ["CLPAP", "CPJM", "CLIPM", "CP"];

                      if (Array.isArray(raw)) {
                        const detalhes: DetalheQuestao[] = raw;
                        const discip = blocos.map(d => ({ nome: d, itens: detalhes.filter((x: DetalheQuestao) => x.disciplina === d) }));
                        return (
                          <>
                            <h3 style={{ color: c.gold, marginBottom: "0.75rem" }}>Acertos por Disciplina</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                              {discip.map(({ nome, itens }) => {
                                const acertos = itens.filter(x => x.acertou).length;
                                return (
                                  <div key={nome} style={{ background: c.backgroundSecondary, padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                                    <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>{nome}</div>
                                    <div style={{ color: c.green, fontSize: "1.25rem", fontWeight: "bold" }}>{acertos}/{itens.length}</div>
                                  </div>
                                );
                              })}
                            </div>
                            <h3 style={{ color: c.gold, marginBottom: "0.5rem" }}>Detalhamento por Questão</h3>
                            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                              {detalhes.map((d, idx) => (
                                <div key={idx} style={{ padding: "8px", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <span style={{ color: c.textSecondary, fontSize: "0.75rem" }}>{d.disciplina}</span>
                                    <span style={{ marginLeft: "8px", color: c.text }}>Q{idx + 1}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: c.text, marginRight: "8px" }}>
                                      Sua: <strong style={{ color: d.acertou ? c.green : c.red }}>{d.resposta_usuario}</strong>
                                    </span>
                                    <span style={{ color: c.textSecondary }}>
                                      Certa: <strong style={{ color: c.green }}>{d.resposta_correta}</strong>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      } else {
                        const obj = raw as Record<string, { acertos: number; total: number }>;
                        return (
                          <>
                            <h3 style={{ color: c.gold, marginBottom: "0.75rem" }}>Acertos por Disciplina</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                              {blocos.map(d => {
                                const stats = obj[d] || { acertos: 0, total: 0 };
                                return (
                                  <div key={d} style={{ background: c.backgroundSecondary, padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                                    <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>{d}</div>
                                    <div style={{ color: c.green, fontSize: "1.25rem", fontWeight: "bold" }}>{stats.acertos}/{stats.total}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      }
                    } catch {
                      return <div style={{ color: c.red }}>Erro ao carregar detalhes</div>;
                    }
                  })()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

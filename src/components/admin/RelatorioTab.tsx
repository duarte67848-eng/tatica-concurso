import { useState } from "react";
import { User, Result } from "../../lib/adminTypes";
import { c, card } from "../../styles/admin";
import { supabase } from "../../lib/supabase";

function parseDetalhes(detalhes: any): { acertos: number; total: number }[] | null {
  if (!detalhes) return null;
  try {
    const data = typeof detalhes === "string" ? JSON.parse(detalhes) : detalhes;
    if (Array.isArray(data)) return data;
    if (typeof data === "object") {
      const result: { acertos: number; total: number }[] = [];
      const pesos: Record<string, number> = { CLPAP: 1.0, CPJM: 1.25, CLIPM: 1.75, CP: 2.0 };
      for (const [disciplina, stats] of Object.entries(data)) {
        const s = stats as any;
        if (s.acertos !== undefined || s.total !== undefined) {
          result.push({ acertos: s.acertos || 0, total: s.total || 0 });
        }
      }
      return result.length > 0 ? result : null;
    }
  } catch {}
  return null;
}

function parseDetalhesObj(detalhes: any): Record<string, { acertos: number; total: number }> {
  if (!detalhes) return {};
  try {
    const data = typeof detalhes === "string" ? JSON.parse(detalhes) : detalhes;
    if (typeof data === "object" && !Array.isArray(data)) return data;
  } catch {}
  return {};
}

export default function RelatorioTab({ users, results }: {
  users: User[]; results: Result[];
}) {
  const [direcionamentoInput, setDirecionamentoInput] = useState<Record<string, string>>({});

  async function salvarDirecionamento(email: string) {
    const msg = direcionamentoInput[email]?.trim();
    if (!msg) return;
    await supabase.from("usuario").update({ direcionamento: msg }).eq("email", email);
    alert("Direcionamento salvo!");
    setDirecionamentoInput(prev => ({ ...prev, [email]: "" }));
  }

  const blocoColors: Record<string, string> = { CLPAP: c.blue, CPJM: c.purple, CLIPM: c.red, CP: c.gold };
  const blocos = ["CLPAP", "CPJM", "CLIPM", "CP"];

  function getPerfMedio(results: Result[], email: string) {
    const r = results.filter(x => x.email_usuario === email);
    if (r.length === 0) return null;
    const perf: Record<string, { acertos: number; total: number }> = {};
    r.forEach(res => {
      const det = parseDetalhesObj(res.detalhes);
      for (const disc of blocos) {
        if (det[disc] && det[disc].total > 0) {
          if (!perf[disc]) perf[disc] = { acertos: 0, total: 0 };
          perf[disc].acertos += det[disc].acertos;
          perf[disc].total += det[disc].total;
        }
      }
    });
    return perf;
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>
        📊 RELATÓRIO DE DESEMPENHO - DIREcionAMENTO INDIVIDUAL
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: c.textSecondary }}>Nenhum aluno cadastrado</div>
        ) : (
          users.map((user) => {
            const userResults = results.filter(r => r.email_usuario === user.email)
              .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
            const last5 = userResults.slice(0, 5);
            const pfValues = last5.map(r => r.pf);
            const pfTrend = pfValues.length >= 2 ? pfValues[0] - pfValues[pfValues.length - 1] : 0;

            let pesoPerdido = 0, errosAltoPeso = 0, totalAcertos = 0, totalQuestoes = 0;
            const errosPorDisciplina: Record<string, number> = {};
            const acertosPorDisciplina: Record<string, number> = {};
            const questoesPorDisciplina: Record<string, number> = {};
            
            const detalhesPorSimulado: { simulado: number; pf: number; perf: Record<string, { acertos: number; total: number }> }[] = [];

            const perfMedio = getPerfMedio(results, user.email);

            userResults.forEach((r, idx) => {
              const idxRev = userResults.length - idx;
              const detObj = parseDetalhesObj(r.detalhes);
              detalhesPorSimulado.push({ simulado: idxRev, pf: r.pf, perf: detObj });
              totalAcertos += r.acertos;
              totalQuestoes += r.total_questoes;
              for (const disc of blocos) {
                if (detObj[disc] && detObj[disc].total > 0) {
                  const peso = disc === "CP" ? 2.0 : disc === "CLIPM" ? 1.75 : disc === "CPJM" ? 1.25 : 1.0;
                  questoesPorDisciplina[disc] = (questoesPorDisciplina[disc] || 0) + detObj[disc].total;
                  acertosPorDisciplina[disc] = (acertosPorDisciplina[disc] || 0) + detObj[disc].acertos;
                  const erros = detObj[disc].total - detObj[disc].acertos;
                  errosPorDisciplina[disc] = (errosPorDisciplina[disc] || 0) + erros;
                  if (peso >= 1.75) {
                    errosAltoPeso += erros;
                    pesoPerdido += erros * peso;
                  }
                }
              }
            });

            const pior = Object.entries(errosPorDisciplina).sort((a, b) => b[1] - a[1]);
            const melhor = Object.entries(acertosPorDisciplina)
              .map(([d, a]) => ({ disc: d, pct: questoesPorDisciplina[d] > 0 ? (a / questoesPorDisciplina[d]) * 100 : 0 }))
              .sort((a, b) => b.pct - a.pct);

            const pctGeral = totalQuestoes > 0 ? ((totalAcertos / totalQuestoes) * 100).toFixed(1) : "0.0";

            return (
              <div key={user.id} style={{ ...card(), marginBottom: "1rem" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ color: c.text, fontWeight: "bold", fontSize: "1.25rem" }}>{user.nome}</span>
                    <span style={{ color: c.textSecondary, marginLeft: "1rem", fontSize: "0.875rem" }}>{user.email}</span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span style={{ color: c.gold, fontWeight: "bold", fontSize: "1.25rem" }}>
                      PF: {pfValues[0]?.toFixed(2) || "N/A"}
                    </span>
                    <span style={{ color: pfTrend >= 0 ? c.green : c.red, fontWeight: "bold" }}>
                      {pfTrend >= 0 ? "▲" : "▼"} {Math.abs(pfTrend).toFixed(2)}
                    </span>
                    <span style={{ color: c.textSecondary, fontSize: "0.875rem" }}>
                      {userResults.length} simulado{userResults.length !== 1 ? "s" : ""}
                    </span>
                    <span style={{ color: pctGeral >= "70" ? c.green : pctGeral >= "50" ? c.gold : c.red, fontWeight: "bold" }}>
                      {pctGeral}% geral
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ background: c.background, padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.7rem" }}>SIMULADOS</div>
                    <div style={{ color: c.blue, fontSize: "1.5rem", fontWeight: "bold" }}>{userResults.length}</div>
                  </div>
                  <div style={{ background: c.background, padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.7rem" }}>PESO PERDIDO (CP+CLIPM)</div>
                    <div style={{ color: c.red, fontSize: "1.5rem", fontWeight: "bold" }}>{pesoPerdido.toFixed(1)}</div>
                  </div>
                  <div style={{ background: c.background, padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.7rem" }}>MELHOR PF</div>
                    <div style={{ color: c.green, fontSize: "1.5rem", fontWeight: "bold" }}>{pfValues.length > 0 ? Math.max(...pfValues).toFixed(2) : "N/A"}</div>
                  </div>
                  <div style={{ background: c.background, padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.7rem" }}>PIOR PF</div>
                    <div style={{ color: c.red, fontSize: "1.5rem", fontWeight: "bold" }}>{pfValues.length > 0 ? Math.min(...pfValues).toFixed(2) : "N/A"}</div>
                  </div>
                  <div style={{ background: c.background, padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.7rem" }}>ÚLTIMA PF</div>
                    <div style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{pfValues[0]?.toFixed(2) || "N/A"}</div>
                  </div>
                </div>

                {/* Per-Discipline Performance */}
                {perfMedio && Object.keys(perfMedio).length > 0 && (
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
                    <div style={{ color: c.gold, fontWeight: "bold", marginBottom: "0.75rem" }}>📊 DESEMPENHO POR DISCIPLINA (Geral)</div>
                    {blocos.map(disc => {
                      const d = perfMedio[disc];
                      if (!d || d.total === 0) return null;
                      const pct = (d.acertos / d.total) * 100;
                      const erros = d.total - d.acertos;
                      return (
                        <div key={disc} style={{ marginBottom: "0.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <span style={{ color: blocoColors[disc], fontWeight: "bold", fontSize: "0.875rem" }}>{disc}</span>
                            <span style={{ color: c.textSecondary, fontSize: "0.8rem" }}>
                              {d.acertos}/{d.total} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                          <div style={{ display: "flex", height: "20px", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, background: pct >= 70 ? c.green : pct >= 50 ? c.gold : c.red, minWidth: d.acertos > 0 ? "4px" : 0 }} />
                            {erros > 0 && <div style={{ width: `${100 - pct}%`, background: "#333" }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PF Evolution Chart */}
                {last5.length > 1 && (
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
                    <div style={{ color: c.textSecondary, fontWeight: "bold", marginBottom: "0.75rem" }}>📈 EVOLUÇÃO PF (Últimos {last5.length})</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "80px" }}>
                      {[...last5].reverse().map((r, idx) => (
                        <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{
                            height: `${(r.pf / 10) * 100}%`,
                            background: `linear-gradient(180deg, ${c.gold} 0%, ${c.goldHover} 100%)`,
                            borderRadius: "4px 4px 0 0",
                            marginBottom: "0.25rem"
                          }} />
                          <div style={{ color: c.textSecondary, fontSize: "0.6rem" }}>{r.pf.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-Simulation Detail */}
                {detalhesPorSimulado.length > 0 && (
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
                    <div style={{ color: c.textSecondary, fontWeight: "bold", marginBottom: "0.75rem" }}>📋 DETALHES POR SIMULADO</div>
                    {detalhesPorSimulado.slice(0, 5).map((s, idx) => (
                      <div key={idx} style={{ borderBottom: idx < Math.min(4, detalhesPorSimulado.length - 1) ? `1px solid ${c.border}` : "none", padding: "0.5rem 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <span style={{ color: c.textSecondary, fontSize: "0.8rem" }}>Simulado #{s.simulado}</span>
                          <span style={{ color: c.gold, fontWeight: "bold", fontSize: "0.875rem" }}>PF: {s.pf.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                          {blocos.map(disc => {
                            const d = s.perf[disc];
                            if (!d || d.total === 0) return null;
                            return (
                              <span key={disc} style={{ fontSize: "0.75rem", color: c.textSecondary }}>
                                {disc}: {d.acertos}/{d.total}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Blind Spots */}
                {pior.length > 0 && (
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
                    <div style={{ color: c.red, fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ PONTOS DE CEGUEIRA (Mais Erros)</div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {pior.map(([disc, count]) => (
                        <div key={disc} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: `${c.red}20`, padding: "4px 12px", borderRadius: "12px" }}>
                          <span style={{ color: blocoColors[disc] || c.text, fontWeight: "bold", fontSize: "0.875rem" }}>{disc}</span>
                          <span style={{ color: c.red, fontSize: "0.875rem" }}>{count} erros</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {melhor.length > 0 && (
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
                    <div style={{ color: c.green, fontWeight: "bold", marginBottom: "0.5rem" }}>✅ PONTOS FORTES (Melhor Aproveitamento)</div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {melhor.map(m => (
                        <div key={m.disc} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: `${c.green}20`, padding: "4px 12px", borderRadius: "12px" }}>
                          <span style={{ color: blocoColors[m.disc] || c.text, fontWeight: "bold", fontSize: "0.875rem" }}>{m.disc}</span>
                          <span style={{ color: c.green, fontSize: "0.875rem" }}>{m.pct.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direcionamento */}
                <div style={{ background: c.background, padding: "1rem", borderRadius: "4px" }}>
                  <div style={{ color: c.gold, fontWeight: "bold", marginBottom: "0.5rem" }}>📝 DIRECIONAMENTO DO INSTRUTOR</div>
                  {user.direcionamento && (
                    <div style={{ color: c.text, fontSize: "0.875rem", marginBottom: "0.5rem", padding: "0.5rem", background: `${c.gold}10`, borderRadius: "4px", borderLeft: `3px solid ${c.gold}` }}>
                      {user.direcionamento}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <textarea
                      placeholder="Escreva orientações para este aluno..."
                      value={direcionamentoInput[user.email] || ""}
                      onChange={(e) => setDirecionamentoInput(prev => ({ ...prev, [user.email]: e.target.value }))}
                      style={{ flex: 1, padding: "0.5rem", background: c.backgroundSecondary, color: c.text, border: `1px solid ${c.border}`, borderRadius: "4px", fontSize: "0.875rem", minHeight: "60px", resize: "vertical" }}
                    />
                    <button
                      onClick={() => salvarDirecionamento(user.email)}
                      style={{ background: c.gold, color: "#000", border: "none", borderRadius: "4px", padding: "8px 16px", fontWeight: "bold", cursor: "pointer", alignSelf: "flex-end" }}
                    >
                      ENVIAR
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { User, Result } from "../../lib/adminTypes";
import { c, card } from "../../styles/admin";

export default function RelatorioTab({ users, results }: {
  users: User[]; results: Result[];
}) {
  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>
        📊 RELATÓRIO DE COMANDO - DESEMPENHO POR ALUNO
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: c.textSecondary }}>Nenhum aluno cadastrado</div>
        ) : (
          users.map((user) => {
            const userResults = results.filter(r => r.email_usuario === user.email)
              .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
            const last3 = userResults.slice(0, 3);
            const pfValues = last3.map(r => r.pf);
            const pfTrend = pfValues.length >= 2 ? pfValues[0] - pfValues[pfValues.length - 1] : 0;

            let pesoPerdido = 0, totalQuestoesAltoPeso = 0, errosAltoPeso = 0;
            const errosPorDisciplina: Record<string, number> = {};

            userResults.forEach(r => {
              try {
                const detalhes = typeof r.detalhes === 'string' ? JSON.parse(r.detalhes) : r.detalhes;
                if (Array.isArray(detalhes)) {
                  detalhes.forEach((d: any) => {
                    const peso = d.disciplina === "CP" ? 2.0 : d.disciplina === "CLIPM" ? 1.75 : d.disciplina === "CPJM" ? 1.25 : 1.0;
                    if (peso >= 1.75) {
                      totalQuestoesAltoPeso++;
                      if (!d.acertou) { errosAltoPeso++; pesoPerdido += peso; }
                    }
                    if (!d.acertou) errosPorDisciplina[d.disciplina] = (errosPorDisciplina[d.disciplina] || 0) + 1;
                  });
                }
              } catch (_) { }
            });

            const vicios = Object.entries(errosPorDisciplina).sort((a, b) => b[1] - a[1]).slice(0, 3);

            return (
              <div key={user.id} style={{ ...card() }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ color: c.text, fontWeight: "bold", fontSize: "1.25rem" }}>{user.nome}</span>
                    <span style={{ color: c.textSecondary, marginLeft: "1rem", fontSize: "0.875rem" }}>{user.email}</span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span style={{ color: c.gold, fontWeight: "bold" }}>PF Atual: {pfValues[0]?.toFixed(2) || "N/A"}</span>
                    <span style={{ color: pfTrend >= 0 ? c.green : c.red, fontWeight: "bold" }}>
                      {pfTrend >= 0 ? "▲" : "▼"} {Math.abs(pfTrend).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>SIMULADOS REALIZADOS</div>
                    <div style={{ color: c.blue, fontSize: "1.5rem", fontWeight: "bold" }}>{userResults.length}</div>
                  </div>
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>PESO PERDIDO (CP+CLIPM)</div>
                    <div style={{ color: c.red, fontSize: "1.5rem", fontWeight: "bold" }}>{pesoPerdido.toFixed(1)}</div>
                  </div>
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", textAlign: "center" }}>
                    <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>ERROS ALTO PESO</div>
                    <div style={{ color: c.red, fontSize: "1.5rem", fontWeight: "bold" }}>{errosAltoPeso}</div>
                  </div>
                </div>

                {vicios.length > 0 && (
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
                    <div style={{ color: c.red, fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ PONTOS DE CEGUEIRA (Mais Erros)</div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {vicios.map(([disc, count]) => (
                        <span key={disc} style={{ background: c.backgroundSecondary, color: c.text, padding: "4px 12px", borderRadius: "12px", fontSize: "0.875rem" }}>
                          {disc}: {count} erros
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {last3.length > 0 && (
                  <div style={{ background: c.background, padding: "1rem", borderRadius: "4px" }}>
                    <div style={{ color: c.textSecondary, fontWeight: "bold", marginBottom: "0.5rem" }}>📈 EVOLUÇÃO (Últimos 3)</div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      {last3.map((r, idx) => (
                        <div key={idx} style={{ textAlign: "center" }}>
                          <div style={{ color: c.gold, fontWeight: "bold" }}>{r.pf.toFixed(2)}</div>
                          <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>#{idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

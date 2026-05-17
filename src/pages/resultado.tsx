import { useEffect, useState } from "react";
import Link from "next/link";

function getFeedbackEstrategico(res: any) {
  if (!res || !res.detalhes) return "Continue treinando!";
  
  const pioresBlocos = Object.entries(res.detalhes as Record<string, {acertos: number, total: number}>)
    .map(([nome, dados]) => ({ nome, taxa: dados.total > 0 ? (dados.acertos / dados.total) * 100 : 0 }))
    .sort((a, b) => a.taxa - b.taxa);

  const pior = pioresBlocos[0];
  const pf = parseFloat(res.pf);

  if (pf < 5) {
    return `⚠️ **Alerta Estratégico:** Priorize o bloco **${pior.nome}** (${pior.taxa.toFixed(0)}% de acerto). Foque em revisar a teoria básica antes de novos exercícios.`;
  } else if (pf < 7) {
    return `📈 **Caminho da Aprovação:** O bloco **${pior.nome}** está puxando sua nota para baixo. Dedique 70% do seu tempo de estudo hoje para resolver questões específicas deste bloco.`;
  } else {
    return `🔥 **Nível Elite:** Você está muito bem! Refine os detalhes no bloco **${pior.nome}**. Você está pronto para aumentar a carga de simulados semanais.`;
  }
}

export default function Resultado() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ultimoResultado");
    if (saved) {
      setResult(JSON.parse(saved));
    }
  }, []);

  if (!result) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ color: "#9ca3af", marginBottom: "1rem" }}>Nenhum resultado encontrado</div>
        <Link href="/simulado">
          <button style={{ background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>
            INICIAR SIMULADO
          </button>
        </Link>
      </div>
    );
  }

  const percentage = ((result.acertos / result.questions) * 100).toFixed(1);
  
  const getClassification = (pf: number) => {
    const pct = pf * 100 / 10;
    if (pct >= 90) return { text: "COMANDO ELITE", color: "#ffd700", rank: "⭐⭐⭐" };
    if (pct >= 80) return { text: "OPERADOR ESTRATÉGICO", color: "#22c55e", rank: "⭐⭐" };
    if (pct >= 70) return { text: "TROPA TÁTICA", color: "#3b82f6", rank: "⭐" };
    if (pct >= 60) return { text: "LINHA OPERACIONAL", color: "#9ca3af", rank: "" };
    return { text: "EM TREINAMENTO", color: "#ef4444", rank: "" };
  };

  const classification = getClassification(parseFloat(result.pf));

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#ffd700", textAlign: "center", marginBottom: "2rem" }}>
        RESULTADO DO SIMULADO
      </h1>

      <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "2rem", textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>CLASSIFICAÇÃO</div>
        <div style={{ fontSize: "2.25rem", fontWeight: "bold", marginBottom: "0.5rem", color: classification.color }}>
          {classification.text}
        </div>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{classification.rank}</div>
        
        <div style={{ background: "linear-gradient(90deg, transparent, #ffd700, transparent)", height: "2px", margin: "1.5rem 0" }}></div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#22c55e" }}>{result.acertos}</div>
            <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>ACERTOS</div>
          </div>
          <div>
            <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#ef4444" }}>{result.erros}</div>
            <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>ERROS</div>
          </div>
          <div>
            <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#ffd700" }}>{percentage}%</div>
            <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>PERCENTUAL</div>
          </div>
        </div>

        <div style={{ background: "linear-gradient(90deg, transparent, #ffd700, transparent)", height: "2px", margin: "1.5rem 0" }}></div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>PONTUAÇÃO FINAL (PF)</div>
          <div style={{ fontSize: "3.75rem", fontWeight: "bold", color: "#ffd700" }}>{result.pf}</div>
        </div>

        <div style={{ background: "#262626", padding: "1rem", borderRadius: "8px", color: "#e5e7eb", fontSize: "0.95rem", lineHeight: "1.5", textAlign: "left", marginBottom: "1rem" }}>
          {getFeedbackEstrategico(result)}
        </div>

        <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          Fórmula: PF = ((CLPAP × 1) + (CPJM × 1.25) + (CLIPM × 1.75) + (CP × 2)) / 12
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link href="/simulado">
          <button style={{ background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>
            NOVO SIMULADO
          </button>
        </Link>
        <Link href="/dashboard">
          <button style={{ padding: "12px 24px", border: "1px solid #b8860b", color: "#ffd700", borderRadius: "4px", background: "transparent", cursor: "pointer" }}>
            VER DASHBOARD
          </button>
        </Link>
      </div>
    </div>
  );
}
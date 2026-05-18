const TUTORIALS = [
  {
    q: "O que é PF?",
    r: "PF = Pontuação Final. É sua nota ponderada no simulado, calculada assim: ((CLPAP × 1.0) + (CPJM × 1.25) + (CLIPM × 1.75) + (CP × 2.0)) / 12. O peso de cada disciplina reflete sua importância no concurso.",
  },
  {
    q: "O que é Ranking?",
    r: "O ranking mostra os 20 melhores alunos pela maior PF já alcançada. Se você fizer vários simulados, vale a melhor nota. O ranking é atualizado automaticamente.",
  },
  {
    q: "Diferença entre Simulado e Exercício?",
    r: "Simulado: 80 questões, 4 horas, valendo nota (PF). Simula o dia da prova. Exercício: treino livre por disciplina ou modo inteligente, sem limite de tempo, focado em aprender.",
  },
  {
    q: "Como funciona a Revisão Inteligente?",
    r: "Questões que você erra no simulado ou exercício vão para a fila de revisão. Quando você acerta uma revisão, ela sai da fila. O objetivo é zerar a fila dominando todos os conteúdos.",
  },
  {
    q: "O que são os pesos das disciplinas?",
    r: "CLPAP = peso 1.0 | CPJM = peso 1.25 | CLIPM = peso 1.75 | CP = peso 2.0. Quanto maior o peso, mais a disciplina impacta sua PF. Por isso errar questões de CP ou CLIPM 'pesa' mais na nota.",
  },
  {
    q: "Como funciona o modo Inteligente?",
    r: "Nos exercícios, o modo Inteligente prioriza as questões que você mais errou. Ele busca na sua fila de revisão e monta um treino focado nos seus pontos fracos.",
  },
  {
    q: "O que é Tendência no Relatório?",
    r: "A tendência (▲/▼) mostra se sua PF está subindo ou caindo comparando seus últimos simulados. ▲ significa evolução, ▼ significa que precisa revisar.",
  },
  {
    q: "Posso refazer um simulado?",
    r: "Sim. Cada novo simulado gera um resultado independente. No ranking vale sua melhor PF. No relatório do admin, todos os resultados são registrados para acompanhamento.",
  },
  {
    q: "O que é a Biblioteca de PDFs?",
    r: "Na página 📚 Biblioteca você encontra materiais de estudo organizados por disciplina e categoria (apostilas, resumos, questões, provas anteriores). Clique em um PDF para abrir o visualizador. Disponível apenas para alunos autorizados.",
  },
  {
    q: "O que é Direcionamento?",
    r: "Direcionamento é um recado que o administrador envia para você. Aparece no topo do seu Dashboard. Pode conter orientações de estudo, feedback ou instruções específicas do seu professor/tutor.",
  },
  {
    q: "Pra que servem Favoritos e Difíceis?",
    r: "⭐ Favoritos: marque questões importantes para revisar depois. 🎯 Difíceis: questões que você errou e pode consultar separadamente. Ambas as listas ficam acessíveis no menu do cabeçalho.",
  },
  {
    q: "O que significam as Classificações? E as Graduações?",
    r: "CLASSIFICAÇÃO (aparece no resultado do simulado): Comando Elite ⭐⭐⭐ | Operador Estratégico ⭐⭐ | Tropa Tática ⭐ | Linha Operacional | Em Treinamento.\n\nGRADUAÇÕES (automáticas, o sistema promove pela PF): 🪖 Aluno Soldado (0-1.25) → ⭐ Soldado (1.26-2.5) → ⭐⭐ Cabo (2.51-3.75) → ⭐⭐⭐ Aluno a Sargento (3.76-5) → 🔰 3° Sargento (5.01-6) → 💎 2° Sargento (6.01-7) → 👑 1° Sargento (7.01-8.5) → ⚜️ Sub Tenente (8.51-10).",
  },
  {
    q: "Como funciona o modo Bloco?",
    r: "No modo Bloco dos exercícios, você escolhe UMA disciplina específica (CLPAP, CPJM, CLIPM ou CP) e treina só questões daquela matéria. Ideal para focar nos pontos fracos.",
  },
  {
    q: "O que é o Relatório de Comando?",
    r: "Disponível apenas para o admin. Mostra o desempenho individual de cada aluno: PF atual, tendência, peso perdido em questões de alto peso, pontos de cegueira (disciplinas com mais erros) e evolução dos últimos 3 simulados.",
  },
];

export default function TutorialModal({ colors, onClose }: { colors: any; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        background: colors.backgroundSecondary, border: `1px solid ${colors.border}`,
        borderRadius: "12px", padding: "2rem", maxWidth: "600px", width: "90%",
        maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: colors.gold, margin: 0, fontSize: "1.5rem" }}>📖 Central de Ajuda</h2>
          <button onClick={onClose} style={{
            background: colors.red, color: "#fff", border: "none",
            borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontWeight: "bold",
          }}>✕ FECHAR</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {TUTORIALS.map((item, idx) => (
            <details key={idx} style={{
              background: colors.background, border: `1px solid ${colors.border}`,
              borderRadius: "8px", padding: "1rem", cursor: "pointer",
            }}>
              <summary style={{ color: colors.gold, fontWeight: "bold", fontSize: "0.95rem" }}>
                {item.q}
              </summary>
              <p style={{ color: colors.text, fontSize: "0.9rem", lineHeight: "1.5", marginTop: "0.75rem" }}>
                {item.r}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

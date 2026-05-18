import { useState, useEffect } from "react";

interface Step {
  target: string;
  title: string;
  text: string;
  position: "top" | "bottom" | "left" | "right";
}

const STEPS: Step[] = [
  {
    target: "",
    title: "👋 Bem-vindo ao TÁTICA CONCURSO!",
    text: "Vou te mostrar os principais recursos em 4 passos rápidos.",
    position: "bottom",
  },
  {
    target: "btn-simulado",
    title: "📝 Simulado",
    text: "Aqui você faz simulados completos de 80 questões com 4 horas de duração. As notas são calculadas com pesos por disciplina (PF).",
    position: "bottom",
  },
  {
    target: "btn-exercicios",
    title: "📋 Exercícios",
    text: "Treine por disciplina, no modo livre, bloco, rápido ou inteligente (foca nas questões que você mais erra).",
    position: "bottom",
  },
  {
    target: "btn-revisao",
    title: "🔄 Revisão Inteligente",
    text: "Questões que você errou voltam aqui para você revisar. Acertando, elas saem da fila.",
    position: "bottom",
  },
  {
    target: "btn-ranking",
    title: "🏆 Ranking",
    text: "Compare seu desempenho com outros alunos. O ranking mostra a melhor PF de cada um.",
    position: "left",
  },
];

export default function OnboardingTour({ colors, onComplete }: { colors: any; onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  if (!current) return null;

  const isWelcome = step === 0;
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  }

  function handleSkip() {
    onComplete();
  }

  const overlay: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)", zIndex: 9998,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  const balloon: React.CSSProperties = {
    background: colors.backgroundSecondary,
    border: `1px solid ${colors.gold}`,
    borderRadius: "12px",
    padding: "2rem",
    maxWidth: "420px",
    width: "90%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  };

  return (
    <div style={overlay} onClick={handleSkip}>
      <div style={balloon} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: colors.gold, marginBottom: "0.75rem" }}>
          {current.title}
        </div>
        <div style={{ color: colors.text, fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
          {current.text}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: colors.textSecondary, fontSize: "0.8rem" }}>
            {isWelcome ? "" : `${step}/${STEPS.length - 1}`}
          </span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleSkip} style={{
              background: "transparent", border: `1px solid ${colors.border}`,
              color: colors.textSecondary, padding: "8px 16px", borderRadius: "4px",
              cursor: "pointer", fontSize: "0.875rem",
            }}>
              PULAR
            </button>
            <button onClick={handleNext} style={{
              background: colors.gold, color: "#000", fontWeight: "bold",
              padding: "8px 24px", borderRadius: "4px", border: "none",
              cursor: "pointer", fontSize: "0.875rem",
            }}>
              {isLast ? "✅ ENTENDI" : "PRÓXIMO →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

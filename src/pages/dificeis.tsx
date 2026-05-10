"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

interface Questao {
  id: number;
  texto: string;
  alternativas: string[];
  resposta_correta: number;
  materia: string;
  assunto?: string;
  dificuldade?: string;
}

export default function Dificeis({ colors }: { colors?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dificeis, setDificeis] = useState<any[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [mode, setMode] = useState<"lista" | "estudo">("lista");

  const c = colors || {
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
    red: "#ef4444",
    green: "#22c55e",
    blue: "#3b82f6"
  };

  useEffect(() => {
    const userData = window.sessionStorage.getItem("tatica_user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const userObj = JSON.parse(userData);
    loadDificeis(userObj.email);
  }, [router]);

  async function loadDificeis(email: string) {
    const { data: diff } = await supabase
      .from("questoes_dificeis")
      .select("questao_id, created_at")
      .eq("usuario_email", email)
      .order("created_at", { ascending: false });

    if (diff && diff.length > 0) {
      const ids = diff.map(f => f.questao_id);
      const { data: qs } = await supabase
        .from("questao")
        .select("id, texto, alternativas, resposta_correta, materia, assunto, dificuldade")
        .in("id", ids);
      if (qs) setQuestoes(qs as any);
    }
    setLoading(false);
  }

  async function removeDificil(questaoId: number) {
    const userData = JSON.parse(window.sessionStorage.getItem("tatica_user") || "{}");
    await supabase
      .from("questoes_dificeis")
      .delete()
      .eq("usuario_email", userData.email)
      .eq("questao_id", questaoId);
    
    setQuestoes(questoes.filter(q => q.id !== questaoId));
  }

  function handleAnswer(index: number) {
    setSelectedAnswer(index);
    setShowAnswer(true);
  }

  function nextQuestion() {
    setCurrentIndex(Math.min(currentIndex + 1, questoes.length - 1));
    setShowAnswer(false);
    setSelectedAnswer(null);
  }

  function prevQuestion() {
    setCurrentIndex(Math.max(currentIndex - 1, 0));
    setShowAnswer(false);
    setSelectedAnswer(null);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div style={{ color: c.gold }}>Carregando...</div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div>
        <h1 style={{ color: c.gold, marginBottom: "1rem" }}>🎯 Questões Difíceis</h1>
        <div style={{ background: c.backgroundSecondary, padding: "2rem", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ color: c.textSecondary }}>Nenhuma questão marcada como difícil ainda.</p>
          <p style={{ color: c.textSecondary, marginTop: "0.5rem" }}>
            Durante os exercícios, clique no ícone 🎯 para marcar uma questão difícil.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questoes[currentIndex];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ color: c.gold }}>🎯 Difíceis ({questoes.length})</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setMode("lista")}
            style={{
              padding: "8px 16px",
              background: mode === "lista" ? c.gold : c.backgroundTertiary,
              color: mode === "lista" ? "#000" : c.text,
              border: `1px solid ${c.border}`,
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Lista
          </button>
          <button
            onClick={() => setMode("estudo")}
            style={{
              padding: "8px 16px",
              background: mode === "estudo" ? c.gold : c.backgroundTertiary,
              color: mode === "estudo" ? "#000" : c.text,
              border: `1px solid ${c.border}`,
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Estudo
          </button>
        </div>
      </div>

      {mode === "lista" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {questoes.map((q) => (
            <div key={q.id} style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: c.gold, fontSize: "0.875rem" }}>{q.materia}</span>
                <button
                  onClick={() => removeDificil(q.id)}
                  style={{ background: c.red, color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}
                >
                  Remover
                </button>
              </div>
              <p style={{ color: c.text, marginBottom: "0.5rem" }}>{q.texto.substring(0, 150)}...</p>
              <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>
                {q.assunto && <span style={{ marginRight: "1rem" }}>📚 {q.assunto}</span>}
                {q.dificuldade && <span>⚠️ {q.dificuldade}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ color: c.gold }}>{currentQ.materia}</span>
              <span style={{ color: c.textSecondary }}>{currentIndex + 1}/{questoes.length}</span>
            </div>
            
            <p style={{ fontSize: "1.125rem", marginBottom: "1.5rem" }}>{currentQ.texto}</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {currentQ.alternativas.map((alt, i) => {
                let bg = c.backgroundTertiary;
                if (showAnswer) {
                  if (i === currentQ.resposta_correta) bg = c.green;
                  else if (i === selectedAnswer) bg = c.red;
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showAnswer}
                    style={{
                      padding: "1rem",
                      background: bg,
                      border: `1px solid ${c.border}`,
                      borderRadius: "8px",
                      textAlign: "left",
                      color: c.text,
                      cursor: showAnswer ? "default" : "pointer",
                      opacity: showAnswer && i !== currentQ.resposta_correta && i !== selectedAnswer ? 0.5 : 1
                    }}
                  >
                    <strong>{String.fromCharCode(65 + i)}.</strong> {alt}
                  </button>
                );
              })}
            </div>

            {showAnswer && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: c.backgroundTertiary, borderRadius: "8px" }}>
                <div style={{ color: selectedAnswer === currentQ.resposta_correta ? c.green : c.red, fontWeight: "bold" }}>
                  {selectedAnswer === currentQ.resposta_correta ? "✅ Correto!" : "❌ Incorreto"}
                </div>
                <div style={{ color: c.textSecondary, marginTop: "0.5rem" }}>
                  Resposta correta: {String.fromCharCode(65 + currentQ.resposta_correta)}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <button onClick={prevQuestion} disabled={currentIndex === 0} style={{ padding: "8px 16px", background: c.backgroundTertiary, color: c.text, border: `1px solid ${c.border}`, borderRadius: "4px", cursor: "pointer" }}>
              Anterior
            </button>
            <button onClick={nextQuestion} disabled={currentIndex === questoes.length - 1} style={{ padding: "8px 16px", background: c.gold, color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
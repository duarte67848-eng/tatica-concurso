"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

interface Questao {
  id: string;
  pergunta: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: string;
  disciplina: string;
  peso: number;
}

export default function Favoritos({ colors }: { colors?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [mode, setMode] = useState<"lista" | "estudo">("lista");

  const c = colors || {
    background: "#0d0d0d", backgroundSecondary: "#1a1a1a", backgroundTertiary: "#252525",
    text: "#ffffff", textSecondary: "#a0a0a0", border: "#333333", gold: "#ffd700",
    red: "#ef4444", green: "#22c55e", blue: "#3b82f6"
  };

  useEffect(() => {
    const userData = window.sessionStorage.getItem("tatica_user");
    if (!userData) { router.push("/login"); return; }
    const userObj = JSON.parse(userData);
    loadFavoritos(userObj.email);
  }, [router]);

  async function loadFavoritos(email: string) {
    const { data: favs } = await supabase
      .from("favoritos")
      .select("questao_id, created_at")
      .eq("usuario_email", email)
      .order("created_at", { ascending: false });

    if (favs && favs.length > 0) {
      const ids = favs.map(f => f.questao_id);
      const { data: qs } = await supabase
        .from("questao")
        .select("id, pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, resposta_correta, disciplina, peso")
        .in("id", ids);
      if (qs) setQuestoes(qs as any);
    }
    setLoading(false);
  }

  const alternativas = (q: Questao) => [
    q.alternativa_a, q.alternativa_b, q.alternativa_c, q.alternativa_d, q.alternativa_e
  ];

  function handleAnswer(letra: string) {
    setSelectedAnswer(letra);
    setShowAnswer(true);
  }

  function nextQuestion() {
    setCurrentIndex(Math.min(currentIndex + 1, questoes.length - 1));
    setShowAnswer(false); setSelectedAnswer(null);
  }

  function prevQuestion() {
    setCurrentIndex(Math.max(currentIndex - 1, 0));
    setShowAnswer(false); setSelectedAnswer(null);
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><div style={{ color: c.gold }}>Carregando...</div></div>;

  if (questoes.length === 0) {
    return (
      <div>
        <h1 style={{ color: c.gold, marginBottom: "1rem" }}>⭐ Favoritos</h1>
        <div style={{ background: c.backgroundSecondary, padding: "2rem", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ color: c.textSecondary }}>Nenhuma questão favoritada ainda.</p>
          <p style={{ color: c.textSecondary, marginTop: "0.5rem" }}>Durante os exercícios, clique no ícone ⭐ para favoritar uma questão.</p>
        </div>
      </div>
    );
  }

  const currentQ = questoes[currentIndex];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ color: c.gold }}>⭐ Favoritos ({questoes.length})</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setMode("lista")} style={{ padding: "8px 16px", background: mode === "lista" ? c.gold : c.backgroundTertiary, color: mode === "lista" ? "#000" : c.text, border: `1px solid ${c.border}`, borderRadius: "4px", cursor: "pointer" }}>Lista</button>
          <button onClick={() => setMode("estudo")} style={{ padding: "8px 16px", background: mode === "estudo" ? c.gold : c.backgroundTertiary, color: mode === "estudo" ? "#000" : c.text, border: `1px solid ${c.border}`, borderRadius: "4px", cursor: "pointer" }}>Estudo</button>
        </div>
      </div>

      {mode === "lista" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {questoes.map((q, i) => (
            <div key={q.id} style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: c.gold, fontSize: "0.875rem" }}>{q.disciplina}</span>
                <button onClick={() => { const userData = JSON.parse(window.sessionStorage.getItem("tatica_user") || "{}"); supabase.from("favoritos").delete().eq("usuario_email", userData.email).eq("questao_id", parseInt(q.id)); setQuestoes(questoes.filter(x => x.id !== q.id)); }} style={{ background: c.red, color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>Remover</button>
              </div>
              <p style={{ color: c.text, marginBottom: "0.5rem" }}>{q.pergunta.substring(0, 150)}...</p>
              <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>Resp: {q.resposta_correta}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ color: c.gold }}>{currentQ.disciplina}</span>
              <span style={{ color: c.textSecondary }}>{currentIndex + 1}/{questoes.length}</span>
            </div>
            <p style={{ fontSize: "1.125rem", marginBottom: "1.5rem" }}>{currentQ.pergunta}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {["A", "B", "C", "D", "E"].map((letra, i) => {
                const txt = alternativas(currentQ)[i];
                if (!txt) return null;
                let bg = c.backgroundTertiary;
                if (showAnswer) {
                  if (letra === currentQ.resposta_correta) bg = c.green;
                  else if (letra === selectedAnswer) bg = c.red;
                }
                return (
                  <button key={letra} onClick={() => handleAnswer(letra)} disabled={showAnswer}
                    style={{ padding: "1rem", background: bg, border: `1px solid ${c.border}`, borderRadius: "8px", textAlign: "left", color: c.text, cursor: showAnswer ? "default" : "pointer", opacity: showAnswer && letra !== currentQ.resposta_correta && letra !== selectedAnswer ? 0.5 : 1 }}>
                    <strong>{letra}.</strong> {txt}
                  </button>
                );
              })}
            </div>
            {showAnswer && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: c.backgroundTertiary, borderRadius: "8px" }}>
                <div style={{ color: selectedAnswer === currentQ.resposta_correta ? c.green : c.red, fontWeight: "bold" }}>
                  {selectedAnswer === currentQ.resposta_correta ? "✅ Correto!" : "❌ Incorreto"}
                </div>
                <div style={{ color: c.textSecondary, marginTop: "0.5rem" }}>Resposta correta: {currentQ.resposta_correta}</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <button onClick={prevQuestion} disabled={currentIndex === 0} style={{ padding: "8px 16px", background: c.backgroundTertiary, color: c.text, border: `1px solid ${c.border}`, borderRadius: "4px", cursor: "pointer" }}>Anterior</button>
            <button onClick={nextQuestion} disabled={currentIndex === questoes.length - 1} style={{ padding: "8px 16px", background: c.gold, color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" }}>Próxima</button>
          </div>
        </div>
      )}
    </div>
  );
}

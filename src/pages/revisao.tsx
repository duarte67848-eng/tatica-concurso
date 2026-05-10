"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface RevisaoItem {
  id: number;
  questao_id: string;
  disciplina: string;
  bloco: string;
  resposta_usuario: string;
  resposta_correta: string;
  vezes_errada: number;
  errou_em: string;
  resolvida: boolean;
}

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

interface RevisaoPageProps {
  colors?: any;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export default function Revisao({ colors }: RevisaoPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revisaoList, setRevisaoList] = useState<RevisaoItem[]>([]);
  const [questions, setQuestions] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<"todos" | "pendentes" | "resolvidos">("pendentes");
  const [filterBloco, setFilterBloco] = useState<string>("todos");
  const [mode, setMode] = useState<"lista" | "treino">("lista");

  const c = colors || {
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
    goldHover: "#b8860b",
    green: "#22c55e",
    red: "#ef4444",
    blue: "#3b82f6",
    purple: "#a855f7"
  };

  useEffect(() => {
    const userData = window.sessionStorage.getItem("tatica_user");
    if (!userData) {
      router.push("/login");
    } else {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      loadRevisao(userObj.email);
      loadQuestions();
    }
  }, [router]);

  async function loadQuestions() {
    const { data } = await supabase.from("questao").select("*");
    if (data) setQuestions(data as any);
  }

  async function loadRevisao(email: string) {
    const { data } = await supabase
      .from("revisao")
      .select("*")
      .eq("usuario_email", email)
      .order("errou_em", { ascending: false });
    
    if (data) setRevisaoList(data as any);
    setLoading(false);
  }

  function getQuestaoById(id: string): Questao | undefined {
    return questions.find(q => q.id === id);
  }

  async function markAsResolved(id: number) {
    await supabase
      .from("revisao")
      .update({ resolvida: true, ultima_revisao: new Date().toISOString() })
      .eq("id", id);
    
    setRevisaoList(revisaoList.map(r => r.id === id ? { ...r, resolvida: true } : r));
  }

  async function deleteFromRevisao(id: number) {
    await supabase.from("revisao").delete().eq("id", id);
    setRevisaoList(revisaoList.filter(r => r.id !== id));
  }

  function filteredList() {
    let list = revisaoList;
    if (filter === "pendentes") list = list.filter(r => !r.resolvida);
    if (filter === "resolvidos") list = list.filter(r => r.resolvida);
    if (filterBloco !== "todos") list = list.filter(r => r.bloco === filterBloco);
    return list;
  }

  function handleLogout() {
    window.sessionStorage.removeItem("tatica_user");
    router.push("/login");
  }

  const stats = {
    total: revisaoList.length,
    pendentes: revisaoList.filter(r => !r.resolvida).length,
    resolvidos: revisaoList.filter(r => r.resolvida).length,
    clpap: revisaoList.filter(r => r.bloco === "CLPAP" && !r.resolvida).length,
    cpjm: revisaoList.filter(r => r.bloco === "CPJM" && !r.resolvida).length,
    clipm: revisaoList.filter(r => r.bloco === "CLIPM" && !r.resolvida).length,
    cp: revisaoList.filter(r => r.bloco === "CP" && !r.resolvida).length,
  };

  const currentQuestion = mode === "treino" && filteredList().length > 0 
    ? getQuestaoById(filteredList()[currentIndex]?.questao_id || "")
    : null;

  const [answer, setAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  function handleAnswer(opt: string) {
    if (showResult) return;
    setAnswer(opt);
    setShowResult(true);
    
    const revisao = filteredList()[currentIndex];
    if (opt === currentQuestion?.resposta_correta) {
      markAsResolved(revisao.id);
    }
  }

  function nextQuestion() {
    if (currentIndex < filteredList().length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer(null);
      setShowResult(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: c.gold, fontSize: "1.25rem" }}>CARREGANDO REVISÃO...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: c.gold }}>
          🎯 SISTEMA DE REVISÃO INTELIGENTE
        </h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/dashboard">
            <button style={{ background: c.backgroundTertiary, color: c.text, padding: "8px 16px", borderRadius: "4px", border: `1px solid ${c.border}`, cursor: "pointer" }}>
              ← Dashboard
            </button>
          </Link>
          <button onClick={handleLogout} style={{ background: c.red, color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
            SAIR
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>TOTAL ERROS</div>
          <div style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{stats.total}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>PENDENTES</div>
          <div style={{ color: c.red, fontSize: "1.5rem", fontWeight: "bold" }}>{stats.pendentes}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>RESOLVIDOS</div>
          <div style={{ color: c.green, fontSize: "1.5rem", fontWeight: "bold" }}>{stats.resolvidos}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>CLPAP</div>
          <div style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{stats.clpap}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>CPJM</div>
          <div style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{stats.cpjm}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>CLIPM</div>
          <div style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{stats.clipm}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>CP</div>
          <div style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{stats.cp}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["todos", "pendentes", "resolvidos"].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f as any); setMode("lista"); }}
            style={{
              padding: "8px 16px",
              background: filter === f ? c.gold : c.backgroundTertiary,
              color: filter === f ? "#000" : c.text,
              border: `1px solid ${c.border}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.875rem"
            }}
          >
            {f === "todos" ? "Todos" : f === "pendentes" ? "Pendentes" : "Resolvidos"}
          </button>
        ))}
        
        <select
          value={filterBloco}
          onChange={(e) => setFilterBloco(e.target.value)}
          style={{ background: c.backgroundTertiary, color: c.text, border: `1px solid ${c.border}`, borderRadius: "4px", padding: "8px" }}
        >
          <option value="todos">Todos os Blocos</option>
          <option value="CLPAP">CLPAP</option>
          <option value="CPJM">CPJM</option>
          <option value="CLIPM">CLIPM</option>
          <option value="CP">CP</option>
        </select>

        {stats.pendentes > 0 && (
          <button
            onClick={() => { setMode("treino"); setCurrentIndex(0); setAnswer(null); setShowResult(false); }}
            style={{
              padding: "8px 16px",
              background: c.green,
              color: "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.875rem",
              marginLeft: "auto"
            }}
          >
            🚀 Iniciar Treino de Revisão
          </button>
        )}
      </div>

      {mode === "lista" && (
        filteredList().length === 0 ? (
          <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "2rem", textAlign: "center", color: c.textSecondary }}>
            {filter === "pendentes" ? "Nenhum erro pendente! Parabéns! 🎉" : "Nenhum item encontrado."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredList().slice(0, 20).map(r => {
              const q = getQuestaoById(r.questao_id);
              return (
                <div key={r.id} style={{ background: c.backgroundSecondary, border: `1px solid ${r.resolvida ? c.green : c.border}`, borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <span style={{ color: c.gold, fontWeight: "bold" }}>{r.bloco}</span>
                      <span style={{ color: c.textSecondary, marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                        Errada {r.vezes_errada}x
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {!r.resolvida && (
                        <button onClick={() => markAsResolved(r.id)} style={{ background: c.green, color: "#000", padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem" }}>
                          ✓ Marcar
                        </button>
                      )}
                      <button onClick={() => deleteFromRevisao(r.id)} style={{ background: c.red, color: "#fff", padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                  {q && (
                    <div style={{ color: c.text, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                      {q.pergunta.substring(0, 100)}...
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem" }}>
                    <span style={{ color: c.red }}>Sua resposta: {r.resposta_usuario}</span>
                    <span style={{ color: c.green }}>Certa: {r.resposta_correta}</span>
                  </div>
                </div>
              );
            })}
            {filteredList().length > 20 && (
              <div style={{ textAlign: "center", color: c.textSecondary, padding: "1rem" }}>
                Mostrando 20 de {filteredList().length.toString()} itens
              </div>
            )}
          </div>
        )
      )}

      {mode === "treino" && currentQuestion && (
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <span style={{ color: c.gold, fontWeight: "bold" }}>{currentQuestion.disciplina}</span>
              <span style={{ color: c.textSecondary, marginLeft: "1rem" }}>
                Questão {currentIndex + 1} de {filteredList().length}
              </span>
            </div>
            <button onClick={() => setMode("lista")} style={{ background: c.backgroundTertiary, color: c.text, padding: "4px 12px", borderRadius: "4px", border: `1px solid ${c.border}`, cursor: "pointer" }}>
              ← Voltar
            </button>
          </div>

          <div style={{ fontSize: "1.125rem", marginBottom: "1.5rem", color: c.text, lineHeight: "1.6" }}>
            {currentQuestion.pergunta}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {["A", "B", "C", "D", "E"].map(opt => {
              const text = currentQuestion[`alternativa_${opt.toLowerCase()}` as keyof Question];
              const isCorrect = opt === currentQuestion.resposta_correta;
              const isSelected = answer === opt;
              
              let bg = "transparent";
              let borderColor = c.border;
              let textColor = c.text;
              
              if (showResult) {
                if (isCorrect) {
                  bg = c.green;
                  textColor = "#000";
                } else if (isSelected && !isCorrect) {
                  bg = c.red;
                  textColor = "#fff";
                }
              } else if (isSelected) {
                bg = `${c.gold}30`;
                borderColor = c.gold;
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={showResult}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "1rem",
                    borderRadius: "4px",
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    color: textColor,
                    cursor: showResult ? "default" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ fontWeight: "bold", color: isCorrect && showResult ? "#000" : c.gold, marginRight: "0.5rem" }}>{opt})</span>
                  {text}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: answer === currentQuestion.resposta_correta ? c.green : c.red, fontWeight: "bold" }}>
                {answer === currentQuestion.resposta_correta ? "✅ Correto!" : "❌ Incorreto"}
              </div>
              <button
                onClick={nextQuestion}
                style={{
                  background: c.gold,
                  color: "#000",
                  padding: "12px 24px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Question {
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
}
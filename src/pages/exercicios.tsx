"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
  tipo?: string;
}

interface BancoExerciciosProps {
  colors?: any;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export default function BancoExercicios({ colors }: BancoExerciciosProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Questao[]>([]);
  const [mode, setMode] = useState<"menu" | "livre" | "inteligente" | "bloco" | "rapido" | "exercicio">("menu");
  
  // Filters
  const [filterDisciplina, setFilterDisciplina] = useState("todas");
  const [filterBloco, setFilterBloco] = useState("todos");
  const [filterQuantidade, setFilterQuantidade] = useState(10);
  const [filterDificuldade, setFilterDificuldade] = useState("todas");

  // Exercise state
  const [exerciseQuestions, setExerciseQuestions] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ acertos: 0, erros: 0 });
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDifficult, setIsDifficult] = useState(false);

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
      loadQuestions();
    }
  }, [router]);

  async function loadQuestions() {
    const { data } = await supabase.from("questao").select("*").limit(500);
    if (data && data.length > 0) setQuestions(data as any);
    setLoading(false);
  }

  function handleLogout() {
    window.sessionStorage.removeItem("tatica_user");
    router.push("/login");
  }

  function getFilteredQuestions(): Questao[] {
    let filtered = [...questions];
    const disc = mode === "bloco" ? filterBloco : filterDisciplina;
    if (disc !== "todas" && disc !== "todos") {
      filtered = filtered.filter(q => q.disciplina === disc);
    }
    return filtered;
  }

  async function getInteligentQuestions(): Promise<Questao[]> {
    const { data: errors } = await supabase
      .from("revisao")
      .select("questao_id, vezes_errada")
      .eq("usuario_email", user?.email)
      .eq("resolvida", false)
      .order("vezes_errada", { ascending: false })
      .limit(filterQuantidade * 2);
    
    if (!errors || errors.length === 0) {
      return getFilteredQuestions().slice(0, filterQuantidade);
    }

    const questionIds = errors.map((e: any) => e.questao_id);
    const inteligentQs = questions.filter(q => questionIds.includes(q.id));
    
    while (inteligentQs.length < filterQuantidade) {
      const remaining = questions.filter(q => !questionIds.includes(q.id));
      if (remaining.length === 0) break;
      const random = remaining[Math.floor(Math.random() * remaining.length)];
      inteligentQs.push(random);
      questionIds.push(random.id);
    }
    
    return inteligentQs.slice(0, filterQuantidade);
  }

  async function startExercise() {
    let exQuestions: Questao[] = [];
    
    if (mode === "livre") {
      exQuestions = getFilteredQuestions().filter(q => q.tipo === "exercicio" || !q.tipo).slice(0, filterQuantidade);
    } else if (mode === "inteligente") {
      exQuestions = await getInteligentQuestions();
    } else if (mode === "bloco") {
      exQuestions = questions.slice(0, filterQuantidade);
    } else if (mode === "rapido") {
      exQuestions = getFilteredQuestions().filter(q => q.tipo === "exercicio" || !q.tipo).slice(0, filterQuantidade);
    }
    
    if (exQuestions.length === 0) {
      alert("Nenhuma questão encontrada para este modo. Tente outro bloco.");
      return;
    }
    
    // Shuffle
    exQuestions = exQuestions.sort(() => Math.random() - 0.5);
    
    setExerciseQuestions(exQuestions);
    setCurrentIndex(0);
    setScore({ acertos: 0, erros: 0 });
    setAnswer(null);
    setShowResult(false);
    setMode("exercicio");
  }

  function handleAnswer(opt: string) {
    if (showResult) return;
    setAnswer(opt);
    setShowResult(true);
    
    const q = exerciseQuestions[currentIndex];
    if (opt === q.resposta_correta) {
      setScore(s => ({ ...s, acertos: s.acertos + 1 }));
    } else {
      setScore(s => ({ ...s, erros: s.erros + 1 }));
    }
  }

  function nextQuestion() {
    if (currentIndex < exerciseQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer(null);
      setShowResult(false);
    }
  }

  function finishExercise() {
    setMode("menu");
  }

  async function toggleFavorite() {
    const q = exerciseQuestions[currentIndex];
    if (!q || !user) return;
    
    if (isFavorite) {
      await supabase.from("favoritos").delete().eq("usuario_email", user.email).eq("questao_id", parseInt(q.id));
    } else {
      await supabase.from("favoritos").insert([{ usuario_email: user.email, questao_id: parseInt(q.id) }]);
    }
    setIsFavorite(!isFavorite);
  }

  async function toggleDifficult() {
    const q = exerciseQuestions[currentIndex];
    if (!q || !user) return;
    
    if (isDifficult) {
      await supabase.from("questoes_dificeis").delete().eq("usuario_email", user.email).eq("questao_id", parseInt(q.id));
    } else {
      await supabase.from("questoes_dificeis").insert([{ usuario_email: user.email, questao_id: parseInt(q.id) }]);
    }
    setIsDifficult(!isDifficult);
  }

  useEffect(() => {
    if (exerciseQuestions[currentIndex] && user) {
      checkFavoriteDifficult();
    }
  }, [currentIndex, exerciseQuestions, user]);

  async function checkFavoriteDifficult() {
    const q = exerciseQuestions[currentIndex];
    if (!q || !user) return;
    const qid = parseInt(q.id);
    try {
      const { data: fav } = await supabase.from("favoritos").select("id").eq("usuario_email", user.email).eq("questao_id", qid).maybeSingle();
      const { data: diff } = await supabase.from("questoes_dificeis").select("id").eq("usuario_email", user.email).eq("questao_id", qid).maybeSingle();
      setIsFavorite(!!fav);
      setIsDifficult(!!diff);
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: c.gold, fontSize: "1.25rem" }}>CARREGANDO...</div>
      </div>
    );
  }

  const currentQuestion = exerciseQuestions[currentIndex];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: c.gold }}>
          🎯 BANCO DE EXERCÍCIOS
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

      {mode === "menu" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {/* Treino Livre */}
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ color: c.gold, fontSize: "1.25rem", marginBottom: "1rem" }}>🏃 TREINO LIVRE</h3>
              <p style={{ color: c.textSecondary, marginBottom: "1rem" }}>Você escolhe a disciplina e quantidade de questões.</p>
              <button 
                onClick={() => setMode("livre")}
                style={{ background: c.gold, color: "#000", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                Configurar →
              </button>
            </div>

            {/* Treino Inteligente */}
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ color: c.blue, fontSize: "1.25rem", marginBottom: "1rem" }}>🧠 TREINO INTELIGENTE</h3>
              <p style={{ color: c.textSecondary, marginBottom: "1rem" }}>Sistema seleciona automaticamente questões dos seus pontos fracos.</p>
              <button 
                onClick={() => setMode("inteligente")}
                style={{ background: c.blue, color: "#fff", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                Configurar →
              </button>
            </div>

            {/* Treino por Bloco */}
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ color: c.purple, fontSize: "1.25rem", marginBottom: "1rem" }}>🎯 TREINO POR BLOCO</h3>
              <p style={{ color: c.textSecondary, marginBottom: "1rem" }}>Foque em um bloco específico (CLPAP, CPJM, CLIPM ou CP).</p>
              <button 
                onClick={() => setMode("bloco")}
                style={{ background: c.purple, color: "#fff", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                Configurar →
              </button>
            </div>

            {/* Treino Rápido */}
            <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ color: c.green, fontSize: "1.25rem", marginBottom: "1rem" }}>⚡ TREINO RÁPIDO</h3>
              <p style={{ color: c.textSecondary, marginBottom: "1rem" }}>Treino rápido com poucas questões para revisar em pouco tempo.</p>
              <button 
                onClick={() => { setFilterQuantidade(5); setMode("rapido"); }}
                style={{ background: c.green, color: "#000", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                Iniciar 5 Questões →
              </button>
            </div>
          </div>

          <div style={{ marginTop: "2rem", background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Estatísticas do Banco</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "1rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: c.gold }}>{questions.length}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.875rem" }}>Total Questões</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: c.green }}>{questions.filter(q => q.disciplina === "CLPAP").length}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.875rem" }}>CLPAP</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: c.blue }}>{questions.filter(q => q.disciplina === "CPJM").length}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.875rem" }}>CPJM</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: c.purple }}>{questions.filter(q => q.disciplina === "CLIPM").length}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.875rem" }}>CLIPM</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: c.red }}>{questions.filter(q => q.disciplina === "CP").length}</div>
                <div style={{ color: c.textSecondary, fontSize: "0.875rem" }}>CP</div>
              </div>
            </div>
          </div>
        </>
      )}

      {(mode === "livre" || mode === "inteligente" || mode === "bloco" || mode === "rapido") && (
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
          <h3 style={{ color: c.gold, marginBottom: "1.5rem" }}>Configurar Treino</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ color: c.textSecondary, display: "block", marginBottom: "0.5rem" }}>Quantidade de Questões</label>
              <select 
                value={filterQuantidade} 
                onChange={(e) => setFilterQuantidade(parseInt(e.target.value))}
                style={{ width: "100%", padding: "12px", background: c.background, border: `1px solid ${c.border}`, borderRadius: "4px", color: c.text }}
              >
                <option value={5}>5 questões</option>
                <option value={10}>10 questões</option>
                <option value={15}>15 questões</option>
                <option value={20}>20 questões</option>
                <option value={30}>30 questões</option>
                <option value={50}>50 questões</option>
                <option value={100}>100 questões</option>
                <option value={999}>Todas as questões</option>
              </select>
            </div>
            
            {(mode === "livre" || mode === "bloco") && (
              <div>
                <label style={{ color: c.textSecondary, display: "block", marginBottom: "0.5rem" }}>
                  {mode === "bloco" ? "Selecione o Bloco" : "Disciplina/Bloco"}
                </label>
                <select 
                  value={mode === "bloco" ? filterBloco : filterDisciplina} 
                  onChange={(e) => mode === "bloco" ? setFilterBloco(e.target.value) : setFilterDisciplina(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: c.background, border: `1px solid ${c.border}`, borderRadius: "4px", color: c.text }}
                >
                  {mode === "bloco" ? (
                    <>
                      <option value="CLPAP">CLPAP (Peso 1.0)</option>
                      <option value="CPJM">CPJM (Peso 1.25)</option>
                      <option value="CLIPM">CLIPM (Peso 1.75)</option>
                      <option value="CP">CP (Peso 2.0)</option>
                    </>
                  ) : (
                    <>
                      <option value="todas">Todas</option>
                      <option value="CLPAP">CLPAP</option>
                      <option value="CPJM">CPJM</option>
                      <option value="CLIPM">CLIPM</option>
                      <option value="CP">CP</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button onClick={startExercise} style={{ background: c.gold, color: "#000", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
              🚀 INICIAR TREINO
            </button>
            <button onClick={() => setMode("menu")} style={{ background: c.backgroundTertiary, color: c.text, padding: "12px 24px", borderRadius: "4px", border: `1px solid ${c.border}`, cursor: "pointer" }}>
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {mode === "exercicio" && currentQuestion && (
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
             <div style={{ display: "flex", alignItems: "center" }}>
               <span style={{ color: c.gold, fontWeight: "bold" }}>{currentQuestion.disciplina}</span>
               <span style={{ color: c.textSecondary, marginLeft: "1rem" }}>
                 Questão {currentIndex + 1} de 80
               </span>
             </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span style={{ color: c.green }}>✅ {score.acertos}</span>
              <span style={{ color: c.red }}>❌ {score.erros}</span>
              <button onClick={toggleFavorite} title="Favoritar" style={{ background: isFavorite ? c.gold : c.backgroundTertiary, border: `1px solid ${c.border}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "1rem" }}>
                {isFavorite ? "⭐" : "☆"}
              </button>
              <button onClick={toggleDifficult} title="Marcar como difícil" style={{ background: isDifficult ? c.red : c.backgroundTertiary, border: `1px solid ${c.border}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "1rem" }}>
                {isDifficult ? "🎯" : "○"}
              </button>
            </div>
          </div>

           <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
             <div style={{ background: c.green, color: "#000", fontWeight: "bold", fontSize: "0.875rem", padding: "2px 8px", borderRadius: "12px", marginRight: "1rem" }}>
               QUESTÃO {currentIndex + 1}
             </div>
             <div style={{ fontSize: "1.125rem", color: c.text, lineHeight: "1.6", flex: 1 }}>
               {currentQuestion.pergunta}
             </div>
           </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {["A", "B", "C", "D", "E"].map(opt => {
              const text = currentQuestion[`alternativa_${opt.toLowerCase()}` as keyof Questao];
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
                    cursor: showResult ? "default" : "pointer"
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
              <div style={{ display: "flex", gap: "1rem" }}>
                {currentIndex < exerciseQuestions.length - 1 ? (
                  <button onClick={nextQuestion} style={{ background: c.gold, color: "#000", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                    Próxima →
                  </button>
                ) : (
                  <button onClick={finishExercise} style={{ background: c.green, color: "#000", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                    Finalizar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface Question {
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

export default function Simulado({ colors }: { colors?: any }) {
  const c = colors || {
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
    goldHover: "#ffed4a",
    green: "#22c55e",
    red: "#ef4444",
    blue: "#3b82f6"
  };
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(240 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [flashAlert, setFlashAlert] = useState(false);
  const prevMinRef = useRef(timeLeft);
  const TOTAL_TIME = 240 * 60;

  useEffect(() => {
    const userStr = window.sessionStorage.getItem("tatica_user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setUserEmail(user.email);
    setUserName(user.name || user.email.split("@")[0]);
    loadQuestions();
  }, [router]);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      const mins = Math.floor(timeLeft / 60);
      const prevMins = Math.floor(prevMinRef.current / 60);
      if (mins !== prevMins && [30, 10, 5, 1].includes(mins)) {
        setAlertMsg(`⏰ ${mins} minuto${mins > 1 ? "s" : ""} restante${mins === 1 ? "!" : "s!"}`);
        setFlashAlert(true);
        setTimeout(() => setFlashAlert(false), 5000);
      }
      prevMinRef.current = timeLeft;
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      setAlertMsg("⏰ TEMPO ESGOTADO!");
      setFlashAlert(true);
      setTimeout(() => handleSubmit(), 500);
    }
  }, [timeLeft, submitted]);

  async function loadQuestions() {
    const { data } = await supabase.from("questao").select("*").eq("tipo", "simulado").order("id", { ascending: true }).limit(150);
    if (data) {
      const validQuestions = (data as any).filter((q: any) => {
        const hasPergunta = q.pergunta && q.pergunta.trim().length > 0;
        const hasAlternativas = q.alternativa_a && q.alternativa_a.trim().length > 0;
        return hasPergunta && hasAlternativas;
      });
      setQuestions(validQuestions.slice(0, 80));
    } else {
      setQuestions([]);
    }
    setLoading(false);
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  async function saveErrorsToReview() {
    // Simplificado para evitar lentidão
    try {
      const errorsToSave = questions
        .filter(q => answers[q.id] && answers[q.id] !== q.resposta_correta)
        .map(q => ({
          usuario_email: userEmail,
          questao_id: q.id,
          disciplina: q.disciplina,
          bloco: q.disciplina,
          resposta_usuario: answers[q.id] || "NÃO RESPONDIDA",
          resposta_correta: q.resposta_correta,
          errou_em: new Date().toISOString(),
          vezes_errada: 1,
          dificuldade: "médio"
        }));

      if (errorsToSave.length > 0) {
        await supabase.from("revisao").insert(errorsToSave);
      }
    } catch (e) {
      console.log("Erro ao salvar revisão:", e);
    }
  }

  async function handleSubmit() {
    if (submitted || submitting) return;
    setSubmitting(true);
    setSubmitted(true);

    let acertos = 0;
    let erros = 0;
    let clpapScore = 0;
    let cpfjmScore = 0;
    let clipmScore = 0;
    let cpScore = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.resposta_correta) {
        acertos++;
        if (q.disciplina === "CLPAP") clpapScore += q.peso;
        if (q.disciplina === "CPJM") cpfjmScore += q.peso;
        if (q.disciplina === "CLIPM") clipmScore += q.peso;
        if (q.disciplina === "CP") cpScore += q.peso;
      } else {
        erros++;
      }
    });

    const pf = ((clpapScore * 1) + (cpfjmScore * 1.25) + (clipmScore * 1.75) + (cpScore * 2)) / 12;

    // Calcular detalhes por disciplina
    const resumoDisciplinas: Record<string, { acertos: number, total: number }> = {};
    questions.forEach(q => {
      if (!resumoDisciplinas[q.disciplina]) {
        resumoDisciplinas[q.disciplina] = { acertos: 0, total: 0 };
      }
      resumoDisciplinas[q.disciplina].total++;
      if (answers[q.id] === q.resposta_correta) {
        resumoDisciplinas[q.disciplina].acertos++;
      }
    });

    await supabase.from("resultado").insert([{
      email_usuario: userEmail,
      nome_usuario: userName,
      acertos,
      erros,
      pf,
      total_questoes: questions.length,
      detalhes: resumoDisciplinas, // Agora enviamos o objeto
      criado_em: new Date().toISOString()
    }]);

    // Salvar erros para revisão inteligente
    await saveErrorsToReview();

    localStorage.setItem("ultimoResultado", JSON.stringify({
      acertos, erros, pf,
      questions: questions.length,
      clpapScore, cpfjmScore, clipmScore, cpScore,
      detalhes: resumoDisciplinas
    }));
    router.push("/resultado");
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: c.gold, fontSize: "1.25rem" }}>CARREGANDO QUESTÕES...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion && questions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ color: "#9ca3af", marginBottom: "1rem" }}>Nenhuma questão disponível</div>
        <Link href="/dashboard" style={{ background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px", display: "inline-block" }}>
          VOLTAR AO DASHBOARD
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Floating Timer Bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100, background: c.backgroundSecondary,
        borderBottom: `1px solid ${flashAlert ? c.red : c.border}`,
        padding: "0.75rem 1rem", marginBottom: "1rem",
        transition: "border-color 0.3s, background 0.3s",
        backgroundImage: flashAlert ? `linear-gradient(90deg, ${c.red}22, transparent)` : "none"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: timeLeft < 60 ? c.red : c.gold }}>
              ⏱️ {formatTime(timeLeft)}
            </span>
            <span style={{ color: c.textSecondary, fontSize: "0.8rem" }}>
              {Object.keys(answers).length}/{questions.length} respondidas
            </span>
          </div>
          {alertMsg && (
            <div style={{ color: flashAlert ? c.red : c.gold, fontWeight: "bold", fontSize: "0.875rem", animation: flashAlert ? "pulse 1s" : "none" }}>
              {alertMsg}
            </div>
          )}
        </div>
        <div style={{ height: "4px", background: c.backgroundTertiary, borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            width: `${(timeLeft / TOTAL_TIME) * 100}%`, height: "100%",
            background: timeLeft < 60 ? c.red : timeLeft < 600 ? c.gold : c.blue,
            borderRadius: "2px", transition: "width 1s linear, background 0.5s"
          }} />
        </div>
      </div>

      {/* Question Navigation Grid */}
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "1rem", justifyContent: "center" }}>
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: "28px", height: "28px", borderRadius: "4px", border: "none",
              background: answers[q.id] ? c.blue : currentIndex === idx ? c.gold : c.backgroundTertiary,
              color: answers[q.id] || currentIndex === idx ? "#000" : c.textSecondary,
              fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer"
            }}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: c.gold }}>
          SIMULADO OPERACIONAL - 4 HORAS
        </h1>
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: c.gold, background: c.background, border: `1px solid ${c.border}`, padding: "8px 16px", borderRadius: "4px" }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

       <div style={{ marginBottom: "1rem", color: c.textSecondary }}>
         Questão {currentIndex + 1} de {questions.length}
       </div>

       <div style={{ background: `linear-gradient(180deg, ${c.backgroundSecondary} 0%, ${c.background} 100%)`, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ color: c.gold, fontSize: "0.875rem" }}>
            DISCIPLINA: {currentQuestion.disciplina} | PESO: {currentQuestion.peso}
          </div>
          <div style={{ background: c.gold, color: "#000", fontWeight: "bold", fontSize: "0.875rem", padding: "2px 8px", borderRadius: "12px" }}>
            QUESTÃO {currentIndex + 1}
          </div>
        </div>
        <div style={{ fontSize: "1.125rem", marginBottom: "1.5rem", color: c.text, lineHeight: "1.6" }}>{currentQuestion.pergunta}</div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {["A", "B", "C", "D", "E"].map((option) => {
            const text = currentQuestion[`alternativa_${option.toLowerCase()}` as keyof Question];
            const isSelected = answers[currentQuestion.id] === option;
            return (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "1rem",
                  borderRadius: "4px",
                  border: isSelected ? `1px solid ${c.gold}` : `1px solid ${c.border}`,
                  background: isSelected ? "rgba(255, 215, 0, 0.2)" : "transparent",
                  color: c.text,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontWeight: "bold", color: c.gold, marginRight: "0.5rem" }}>{option})</span>
                <span style={{ color: c.text }}>{text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{ padding: "12px 24px", border: `1px solid ${c.border}`, color: c.textSecondary, borderRadius: "4px", background: "transparent", cursor: currentIndex === 0 ? "not-allowed" : "pointer", opacity: currentIndex === 0 ? 0.5 : 1 }}
        >
          ← ANTERIOR
        </button>

        {currentIndex >= questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            style={{ background: `linear-gradient(180deg, ${c.gold} 0%, ${c.goldHover} 100%)`, color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
          >
            FINALIZAR SIMULADO
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            style={{ padding: "12px 24px", border: `1px solid ${c.gold}`, color: c.gold, borderRadius: "4px", background: "transparent", cursor: "pointer" }}
          >
            PRÓXIMA →
          </button>
        )}
      </div>
    </div>
  );
}
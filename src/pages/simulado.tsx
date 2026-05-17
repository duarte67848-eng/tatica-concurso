import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
    red: "#ef4444"
  };
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(240 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

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
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, submitted]);

  async function loadQuestions() {
    const { data } = await supabase.from("questao").select("*").eq("tipo", "simulado").order("id", { ascending: true }).limit(80);
    if (data) {
      setQuestions(data as any);
    } else {
      setQuestions([]);
    }
    setLoading(false);
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  async function saveErrorsToReview() {
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
      const { data: existing } = await supabase
        .from("revisao")
        .select("id, questao_id, vezes_errada")
        .eq("usuario_email", userEmail)
        .in("questao_id", errorsToSave.map(e => e.questao_id));

      if (existing && existing.length > 0) {
        for (const err of existing) {
          await supabase
            .from("revisao")
            .update({ vezes_errada: err.vezes_errada + 1, errou_em: new Date().toISOString() })
            .eq("id", err.id);
        }
        const newErrors = errorsToSave.filter(e => !existing.some((ex: any) => ex.questao_id === e.questao_id));
        if (newErrors.length > 0) {
          await supabase.from("revisao").insert(newErrors);
        }
      } else {
        await supabase.from("revisao").insert(errorsToSave);
      }
    }
  }

  async function handleSubmit() {
    if (submitted) return;
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

    // Salvar resultado detalhado no Supabase
    const detalhes = questions.map(q => ({
      questao_id: q.id,
      disciplina: q.disciplina,
      resposta_usuario: answers[q.id] || "NÃO RESPONDIDA",
      resposta_correta: q.resposta_correta,
      acertou: answers[q.id] === q.resposta_correta
    }));

    await supabase.from("resultado").insert([{
      email_usuario: userEmail,
      nome_usuario: userName,
      acertos,
      erros,
      pf,
      total_questoes: questions.length,
      detalhes: JSON.stringify(detalhes),
      criado_em: new Date().toISOString()
    }]);

    // Salvar erros para revisão inteligente
    await saveErrorsToReview();

    localStorage.setItem("ultimoResultado", JSON.stringify({
      acertos, erros, pf,
      questions: questions.length,
      clpapScore, cpfjmScore, clipmScore, cpScore
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

  return (
    <div>
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

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            style={{ background: `linear-gradient(180deg, ${c.gold} 0%, ${c.goldHover} 100%)`, color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
          >
            FINALIZAR SIMULADO
          </button>
        ) : (
<button 
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
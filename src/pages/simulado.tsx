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

export default function Simulado() {
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
    const { data } = await supabase.from("questao").select("*");
    if (data && data.length > 0) {
      setQuestions(data as any);
    } else {
      setQuestions([
        { id: "1", pergunta: "Qual é o sinônimo de 'meticuloso'?", alternativa_a: "Cuidadoso", alternativa_b: "Negligente", alternativa_c: "Rápido", alternativa_d: "Desorganizado", alternativa_e: "Indiferente", resposta_correta: "A", disciplina: "CLPAP", peso: 1.0 },
        { id: "2", pergunta: "O soldado _____ no expediente.", alternativa_a: "compareceu", alternativa_b: "chegou", alternativa_c: "saiu", alternativa_d: "ficou", alternativa_e: "foi", resposta_correta: "A", disciplina: "CLPAP", peso: 1.0 },
        { id: "3", pergunta: "Qual é o crime militar de abandono do posto?", alternativa_a: "Deserção", alternativa_b: "Fuga", alternativa_c: "Insolência", alternativa_d: "Apreensão", alternativa_e: "Abandono", resposta_correta: "A", disciplina: "CPJM", peso: 1.25 },
        { id: "4", pergunta: "Conforme o CPM, crime de motim é:", alternativa_a: "Revolta coletiva", alternativa_b: "Desvio de dinheiro", alternativa_c: "Agressão a superior", alternativa_d: "Fuga individual", alternativa_e: "Desordem", resposta_correta: "A", disciplina: "CLIPM", peso: 1.75 },
        { id: "5", pergunta: "O princípio da hierarquia militar estabelece que:", alternativa_a: "ordens devem ser cumpridas", alternativa_b: "todos são iguais", alternativa_c: "soldados podem questionar", alternativa_d: "oficiais não precisam de ordem", alternativa_e: "hierarquia é opcional", resposta_correta: "A", disciplina: "CP", peso: 2.0 },
        { id: "6", pergunta: "Qual o significado de 'procedência'?", alternativa_a: "Local de origem", alternativa_b: "Tempo decorrido", alternativa_c: "Modo de agir", alternativa_d: "Quantidade", alternativa_e: "Qualidade", resposta_correta: "A", disciplina: "CLPAP", peso: 1.0 },
        { id: "7", pergunta: "A cadeia de comando militar é:", alternativa_a: "hierárquica", alternativa_b: "democrática", alternativa_c: "flexível", alternativa_d: "opcional", alternativa_e: "aleatória", resposta_correta: "A", disciplina: "CP", peso: 2.0 },
        { id: "8", pergunta: "Crime militar que consiste em insulting superior:", alternativa_a: "Insolência", alternativa_b: "Deserção", alternativa_c: "Motim", alternativa_d: "Fuga", alternativa_e: "Abandono", resposta_correta: "A", disciplina: "CLIPM", peso: 1.75 },
        { id: "9", pergunta: "O Código Penal Militar é aplicado a:", alternativa_a: "militares", alternativa_b: "civis", alternativa_c: "estrangeiros apenas", alternativa_d: "políticos", alternativa_e: "empresários", resposta_correta: "A", disciplina: "CPJM", peso: 1.25 },
        { id: "10", pergunta: "O que é 'frequência' no contexto militar?", alternativa_a: "Presença regular", alternativa_b: "Forma de comunicação", alternativa_c: "Tipo de uniforme", alternativa_d: "Postura", alternativa_e: "Distintivo", resposta_correta: "A", disciplina: "CLPAP", peso: 1.0 },
      ]);
    }
    setLoading(false);
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

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
        <div style={{ color: "#ffd700", fontSize: "1.25rem" }}>CARREGANDO QUESTÕES...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffd700" }}>
          SIMULADO OPERACIONAL - 4 HORAS
        </h1>
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffd700", background: "#000", border: "1px solid #b8860b", padding: "8px 16px", borderRadius: "4px" }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ marginBottom: "1rem", color: "#9ca3af" }}>
        Questão {currentIndex + 1} de {questions.length}
      </div>

      <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ color: "#ffd700", fontSize: "0.875rem", marginBottom: "1rem" }}>
          DISCIPLINA: {currentQuestion.disciplina} | PESO: {currentQuestion.peso}
        </div>
        <div style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>{currentQuestion.pergunta}</div>
        
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
                  border: isSelected ? "1px solid #ffd700" : "1px solid #374151",
                  background: isSelected ? "rgba(255, 215, 0, 0.3)" : "transparent",
                  color: isSelected ? "#fff" : "#d1d5db",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontWeight: "bold", color: "#ffd700", marginRight: "0.5rem" }}>{option})</span>
                {text}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{ padding: "12px 24px", border: "1px solid #4b5563", color: "#9ca3af", borderRadius: "4px", background: "transparent", cursor: currentIndex === 0 ? "not-allowed" : "pointer", opacity: currentIndex === 0 ? 0.5 : 1 }}
        >
          ← ANTERIOR
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            style={{ background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
          >
            FINALIZAR SIMULADO
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            style={{ padding: "12px 24px", border: "1px solid #b8860b", color: "#ffd700", borderRadius: "4px", background: "transparent", cursor: "pointer" }}
          >
            PRÓXIMA →
          </button>
        )}
      </div>
    </div>
  );
}
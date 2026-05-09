"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

export default function SimuladoPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, submitted]);

  async function loadQuestions() {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .order("disciplina", { ascending: true })
      .limit(20);

    if (data && data.length > 0) {
      // Embaralhar questões
      const shuffled = data.sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
    } else {
      // Questões de exemplo se não houver no banco
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

    // Cálculo PF oficial
    const pf = ((clpapScore * 1) + (cpfjmScore * 1.25) + (clipmScore * 1.75) + (cpScore * 2)) / 12;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("results").insert({
        user_id: user.id,
        acertos,
        erros,
        pf: pf.toFixed(2),
        clpap_score: clpapScore,
        cpfjm_score: cpfjmScore,
        clipm_score: clipmScore,
        cp_score: cpScore,
      });
    }

    // Salvar no localStorage para exibir no resultado
    localStorage.setItem("ultimoResultado", JSON.stringify({
      acertos,
      erros,
      pf: pf.toFixed(2),
      questions: questions.length,
    }));

    router.push("/resultado");
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-yellow-500 text-xl">CARREGANDO QUESTÕES...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">
          SIMULADO OPERACIONAL
        </h1>
        <div className="text-2xl font-bold text-yellow-500 bg-black border border-yellow-600 px-4 py-2 rounded">
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="mb-4 text-gray-400">
        Questão {currentIndex + 1} de {questions.length}
      </div>

      <div className="military-card mb-6">
        <div className="text-yellow-500 text-sm mb-4">
          DISCIPLINA: {currentQuestion.disciplina} | PESO: {currentQuestion.peso}
        </div>
        <div className="text-xl mb-6">{currentQuestion.pergunta}</div>
        
        <div className="space-y-3">
          {["A", "B", "C", "D", "E"].map((option) => {
            const text = currentQuestion[`alternativa_${option.toLowerCase()}` as keyof Question];
            const isSelected = answers[currentQuestion.id] === option;
            return (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`w-full text-left p-4 rounded border transition-all ${
                  isSelected
                    ? "border-yellow-500 bg-yellow-900/30 text-white"
                    : "border-gray-700 hover:border-gray-500 text-gray-300"
                }`}
              >
                <span className="font-bold text-yellow-500 mr-2">{option})</span>
                {text}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-6 py-3 border border-gray-600 text-gray-400 rounded hover:border-gray-400 disabled:opacity-50"
        >
          ← ANTERIOR
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="military-button"
          >
            FINALIZAR SIMULADO
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            className="px-6 py-3 border border-yellow-600 text-yellow-500 rounded hover:bg-yellow-900/30"
          >
            PRÓXIMA →
          </button>
        )}
      </div>
    </div>
  );
}
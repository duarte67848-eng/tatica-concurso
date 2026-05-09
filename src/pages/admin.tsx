import { useEffect, useState } from "react";

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

export default function Admin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<"questions">("questions");
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [newQuestion, setNewQuestion] = useState({
    pergunta: "",
    alternativa_a: "",
    alternativa_b: "",
    alternativa_c: "",
    alternativa_d: "",
    alternativa_e: "",
    resposta_correta: "A",
    disciplina: "CLPAP",
    peso: "1.0"
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  function loadQuestions() {
    const saved = localStorage.getItem("tatica_questions");
    if (saved) {
      setQuestions(JSON.parse(saved));
    }
    setLoading(false);
  }

  function addQuestion() {
    const q: Question = {
      id: Date.now().toString(),
      pergunta: newQuestion.pergunta,
      alternativa_a: newQuestion.alternativa_a,
      alternativa_b: newQuestion.alternativa_b,
      alternativa_c: newQuestion.alternativa_c,
      alternativa_d: newQuestion.alternativa_d,
      alternativa_e: newQuestion.alternativa_e,
      resposta_correta: newQuestion.resposta_correta,
      disciplina: newQuestion.disciplina,
      peso: parseFloat(newQuestion.peso)
    };

    const updated = [q, ...questions];
    setQuestions(updated);
    localStorage.setItem("tatica_questions", JSON.stringify(updated));

    alert("Questão adicionada!");
    setNewQuestion({
      pergunta: "",
      alternativa_a: "",
      alternativa_b: "",
      alternativa_c: "",
      alternativa_d: "",
      alternativa_e: "",
      resposta_correta: "A",
      disciplina: "CLPAP",
      peso: "1.0"
    });
  }

  function deleteQuestion(id: string) {
    if (confirm("Excluir questão?")) {
      const updated = questions.filter(q => q.id !== id);
      setQuestions(updated);
      localStorage.setItem("tatica_questions", JSON.stringify(updated));
    }
  }

  if (!isAuthorized) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "1rem" }}>
        <h1 style={{ color: "#ffd700", fontSize: "1.5rem" }}>ACESSO ADMINISTRATIVO</h1>
        <input
          type="password"
          placeholder="Senha do Admin"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", width: "300px", textAlign: "center" }}
        />
        <button onClick={() => { if (adminPassword === "admin123") setIsAuthorized(true); else alert("Senha incorreta!"); }} style={{ background: "#ffd700", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
          ENTRAR
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: "#ffd700", fontSize: "1.25rem" }}>CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#ffd700", marginBottom: "2rem" }}>
        PAINEL DE ADMINISTRAÇÃO
      </h1>

      {/* Aba Questões */}
      <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>
          Adicionar Nova Questão
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Pergunta"
            value={newQuestion.pergunta}
            onChange={(e) => setNewQuestion({ ...newQuestion, pergunta: e.target.value })}
            style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
            <input type="text" placeholder="A" value={newQuestion.alternativa_a} onChange={(e) => setNewQuestion({ ...newQuestion, alternativa_a: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
            <input type="text" placeholder="B" value={newQuestion.alternativa_b} onChange={(e) => setNewQuestion({ ...newQuestion, alternativa_b: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
            <input type="text" placeholder="C" value={newQuestion.alternativa_c} onChange={(e) => setNewQuestion({ ...newQuestion, alternativa_c: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
            <input type="text" placeholder="D" value={newQuestion.alternativa_d} onChange={(e) => setNewQuestion({ ...newQuestion, alternativa_d: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
            <input type="text" placeholder="E" value={newQuestion.alternativa_e} onChange={(e) => setNewQuestion({ ...newQuestion, alternativa_e: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <select value={newQuestion.resposta_correta} onChange={(e) => setNewQuestion({ ...newQuestion, resposta_correta: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
            <select value={newQuestion.disciplina} onChange={(e) => setNewQuestion({ ...newQuestion, disciplina: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}>
              <option value="CLPAP">CLPAP</option>
              <option value="CPJM">CPJM</option>
              <option value="CLIPM">CLIPM</option>
              <option value="CP">CP</option>
            </select>
            <input type="text" placeholder="Peso" value={newQuestion.peso} onChange={(e) => setNewQuestion({ ...newQuestion, peso: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", width: "80px" }} />
            <button onClick={addQuestion} style={{ background: "#ffd700", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de questões */}
      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>
        Questões ({questions.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>Nenhuma questão ainda</div>
        ) : (
          questions.map((q) => (
            <div key={q.id} style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#ffd700", fontWeight: "bold" }}>{q.disciplina}</span>
                <span style={{ color: "#6b7280" }}>Peso: {q.peso}</span>
              </div>
              <p style={{ marginBottom: "0.5rem" }}>{q.pergunta.substring(0, 80)}...</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: "bold" }}>Resp: {q.resposta_correta}</span>
                <button onClick={() => deleteQuestion(q.id.toString())} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
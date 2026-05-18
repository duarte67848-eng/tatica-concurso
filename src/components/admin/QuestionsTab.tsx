import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Question } from "../../lib/adminTypes";
import { c, card, input, btnGold, btnBlue, btnGreen, btnRed } from "../../styles/admin";
import EditQuestionModal from "./EditQuestionModal";
import ImportModal from "./ImportModal";

export default function QuestionsTab({ questions, setQuestions }: {
  questions: Question[];
  setQuestions: (q: Question[]) => void;
}) {
  const [newQuestion, setNewQuestion] = useState({
    pergunta: "",
    alternativa_a: "", alternativa_b: "", alternativa_c: "", alternativa_d: "", alternativa_e: "",
    resposta_correta: "A", disciplina: "CLPAP", peso: "1.0", tipo: "simulado" as string,
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  async function addQuestion() {
    const q = {
      id: Date.now().toString(),
      pergunta: newQuestion.pergunta,
      alternativa_a: newQuestion.alternativa_a,
      alternativa_b: newQuestion.alternativa_b,
      alternativa_c: newQuestion.alternativa_c,
      alternativa_d: newQuestion.alternativa_d,
      alternativa_e: newQuestion.alternativa_e,
      resposta_correta: newQuestion.resposta_correta,
      disciplina: newQuestion.disciplina,
      peso: parseFloat(newQuestion.peso),
      tipo: newQuestion.tipo,
    };
    await supabase.from("questao").insert([q]);
    setQuestions([q, ...questions]);
    alert("Questão adicionada!");
    setNewQuestion({ pergunta: "", alternativa_a: "", alternativa_b: "", alternativa_c: "", alternativa_d: "", alternativa_e: "", resposta_correta: "A", disciplina: "CLPAP", peso: "1.0", tipo: "simulado" });
  }

  async function deleteQuestion(id: string) {
    if (confirm("Excluir questão?")) {
      await supabase.from("questao").delete().eq("id", id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  }

  function exportQuestions() {
    const csv = questions.map(q =>
      `${q.pergunta}|${q.alternativa_a}|${q.alternativa_b}|${q.alternativa_c}|${q.alternativa_d}|${q.alternativa_e}|${q.resposta_correta}|${q.disciplina}|${q.peso}`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questoes_export.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const s = { background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px" };
  const sSmall = { background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "8px", borderRadius: "4px" };

  return (
    <div>
      <div style={{ ...card(), marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>Adicionar Nova Questão</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <input type="text" placeholder="Pergunta" value={newQuestion.pergunta} onChange={(e) => setNewQuestion({ ...newQuestion, pergunta: e.target.value })} style={s} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
            {["A", "B", "C", "D", "E"].map(opt => (
              <input key={opt} type="text" placeholder={opt}
                value={newQuestion[`alternativa_${opt.toLowerCase()}` as keyof typeof newQuestion] as string}
                onChange={(e) => setNewQuestion({ ...newQuestion, [`alternativa_${opt.toLowerCase()}`]: e.target.value })}
                style={sSmall} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <select value={newQuestion.resposta_correta} onChange={(e) => setNewQuestion({ ...newQuestion, resposta_correta: e.target.value })} style={s}>
              {["A", "B", "C", "D", "E"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={newQuestion.disciplina} onChange={(e) => setNewQuestion({ ...newQuestion, disciplina: e.target.value })} style={s}>
              <option value="CLPAP">CLPAP</option>
              <option value="CPJM">CPJM</option>
              <option value="CLIPM">CLIPM</option>
              <option value="CP">CP</option>
            </select>
            <input type="text" placeholder="Peso" value={newQuestion.peso} onChange={(e) => setNewQuestion({ ...newQuestion, peso: e.target.value })} style={{ ...s, width: "80px" }} />
            <select value={newQuestion.tipo} onChange={(e) => setNewQuestion({ ...newQuestion, tipo: e.target.value })} style={s}>
              <option value="simulado">Simulado</option>
              <option value="exercicio">Exercício</option>
            </select>
            <button onClick={addQuestion} style={btnGold()}>Adicionar</button>
            <button onClick={() => setShowImportModal(true)} style={btnBlue()}>📥 Importar</button>
            <button onClick={exportQuestions} style={btnGreen()}>📤 Exportar</button>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>Questões ({questions.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: c.textSecondary }}>Nenhuma questão ainda</div>
        ) : (
          questions.map((q) => (
            <div key={q.id} style={{ ...card() }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: c.gold, fontWeight: "bold" }}>{q.disciplina}</span>
                <span style={{ color: "#6b7280" }}>Peso: {q.peso}</span>
              </div>
              <p style={{ marginBottom: "0.5rem" }}>{q.pergunta.substring(0, 80)}...</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: c.green, fontWeight: "bold" }}>Resp: {q.resposta_correta}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => setEditingQuestion(q)} style={btnBlue()}>Editar</button>
                  <button onClick={() => deleteQuestion(q.id)} style={btnRed()}>Excluir</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingQuestion && <EditQuestionModal question={editingQuestion} onSave={(updated) => { setQuestions(questions.map(q => q.id === updated.id ? updated : q)); setEditingQuestion(null); }} onClose={() => setEditingQuestion(null)} />}
      {showImportModal && <ImportModal onImport={(imported) => { setQuestions([...imported, ...questions]); setShowImportModal(false); }} onClose={() => setShowImportModal(false)} />}
    </div>
  );
}

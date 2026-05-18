import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Question } from "../../lib/adminTypes";
import { c, btnGreen, btnGray } from "../../styles/admin";

export default function EditQuestionModal({ question, onSave, onClose }: {
  question: Question;
  onSave: (q: Question) => void;
  onClose: () => void;
}) {
  const [edit, setEdit] = useState<Question>({ ...question });

  useEffect(() => { setEdit({ ...question }); }, [question]);

  async function save() {
    const { error } = await supabase.from("questao").update({
      pergunta: edit.pergunta,
      alternativa_a: edit.alternativa_a,
      alternativa_b: edit.alternativa_b,
      alternativa_c: edit.alternativa_c,
      alternativa_d: edit.alternativa_d,
      alternativa_e: edit.alternativa_e,
      resposta_correta: edit.resposta_correta,
      disciplina: edit.disciplina,
      peso: edit.peso,
    }).eq("id", edit.id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      onSave(edit);
      alert("Questão atualizada com sucesso!");
    }
  }

  const s = { background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px" };
  const sSmall = { background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "8px", borderRadius: "4px" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "2rem", maxWidth: "600px", width: "90%", maxHeight: "90vh", overflow: "auto" }}>
        <h2 style={{ color: c.gold, marginBottom: "1rem" }}>Editar Questão</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <textarea value={edit.pergunta} onChange={(e) => setEdit({ ...edit, pergunta: e.target.value })}
            style={{ ...s, minHeight: "100px" }} placeholder="Pergunta" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
            {["A", "B", "C", "D", "E"].map(opt => (
              <input key={opt} type="text" placeholder={opt}
                value={edit[`alternativa_${opt.toLowerCase()}` as keyof Question] as string}
                onChange={(e) => setEdit({ ...edit, [`alternativa_${opt.toLowerCase()}`]: e.target.value })}
                style={sSmall} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <select value={edit.resposta_correta} onChange={(e) => setEdit({ ...edit, resposta_correta: e.target.value })} style={s}>
              {["A", "B", "C", "D", "E"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={edit.disciplina} onChange={(e) => setEdit({ ...edit, disciplina: e.target.value })} style={s}>
              <option value="CLPAP">CLPAP</option>
              <option value="CPJM">CPJM</option>
              <option value="CLIPM">CLIPM</option>
              <option value="CP">CP</option>
            </select>
            <input type="number" step="0.25" value={edit.peso} onChange={(e) => setEdit({ ...edit, peso: parseFloat(e.target.value) })}
              style={{ ...s, width: "80px" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={save} style={btnGreen()}>Salvar Alterações</button>
          <button onClick={onClose} style={btnGray()}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

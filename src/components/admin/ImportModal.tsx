import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Question } from "../../lib/adminTypes";
import { c, btnBlue, btnGray } from "../../styles/admin";

export default function ImportModal({ onImport, onClose }: {
  onImport: (questions: Question[]) => void;
  onClose: () => void;
}) {
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importResult, setImportResult] = useState({ success: 0, errors: 0 });

  async function importQuestions() {
    if (!importText.trim()) { alert("Cole as questões no campo de texto!"); return; }
    setImportStatus("loading");
    let success = 0, errors = 0;
    const imported: Question[] = [];

    try {
      const lines = importText.split("\n").filter(line => line.trim());
      for (const line of lines) {
        const parts = line.split("|");
        if (parts.length >= 8) {
          const newQ: Question = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            pergunta: parts[0].trim(),
            alternativa_a: parts[1].trim(),
            alternativa_b: parts[2].trim(),
            alternativa_c: parts[3].trim(),
            alternativa_d: parts[4].trim(),
            alternativa_e: parts[5].trim(),
            resposta_correta: parts[6].trim().toUpperCase(),
            disciplina: parts[7].trim().toUpperCase(),
            peso: parseFloat(parts[8]?.trim() || "1.0"),
            tipo: "simulado",
          };
          const { error } = await supabase.from("questao").insert([newQ]);
          if (error) errors++;
          else { success++; imported.push(newQ); }
        } else errors++;
      }
      setImportResult({ success, errors });
      setImportStatus("success");
      setImportText("");
      onImport(imported);
    } catch {
      setImportStatus("error");
      alert("Erro ao importar questões");
    }
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "2rem", maxWidth: "600px", width: "90%" }}>
        <h2 style={{ color: c.gold, marginBottom: "1rem" }}>Importar Questões</h2>
        <p style={{ color: c.textSecondary, marginBottom: "1rem", fontSize: "0.875rem" }}>
          Formato: pergunta|A|B|C|D|E|resposta|disciplina|peso
        </p>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
          style={{ background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px", minHeight: "200px", width: "100%" }}
          placeholder="Cole as questões aqui, uma por linha..." />
        {importStatus === "success" && <div style={{ color: c.green, marginTop: "1rem" }}>✅ Importadas: {importResult.success} | Erros: {importResult.errors}</div>}
        {importStatus === "error" && <div style={{ color: c.red, marginTop: "1rem" }}>❌ Erro ao importar</div>}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={importQuestions} disabled={importStatus === "loading"} style={btnBlue()}>
            {importStatus === "loading" ? "Importando..." : "Importar"}
          </button>
          <button onClick={() => { setImportText(""); setImportStatus("idle"); onClose(); }} style={btnGray()}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

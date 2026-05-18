import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Pdf } from "../../lib/adminTypes";
import { c, card, btnGold, btnGreen, btnGray, btnRed } from "../../styles/admin";

export default function BibliotecaTab({ pdfs, setPdfs }: {
  pdfs: Pdf[]; setPdfs: (p: Pdf[]) => void;
}) {
  const [showPdfForm, setShowPdfForm] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newPdf, setNewPdf] = useState({ titulo: "", descricao: "", disciplina: "", categoria: "", url: "", tamanho: 0, paginas: 0 });

  async function addPdf() {
    if (!pdfFile) { alert("Selecione um arquivo!"); return; }
    setUploading(true);
    const fileExt = pdfFile.name.split('.').pop() || "";
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("biblioteca-pdfs").upload(fileName, pdfFile);
    if (uploadError) { alert("Erro ao fazer upload: " + uploadError.message); setUploading(false); return; }
    const { data: urlData } = await supabase.storage.from("biblioteca-pdfs").createSignedUrl(fileName, 315360000);
    const pdfUrl = urlData?.signedUrl || "";

    const pdf = { titulo: newPdf.titulo, descricao: newPdf.descricao, disciplina: newPdf.disciplina || "CP", categoria: newPdf.categoria || "Geral", url: pdfUrl, tamanho: Math.round(pdfFile.size / 1024), paginas: newPdf.paginas };
    const { data } = await supabase.from("biblioteca").insert([pdf]).select();
    if (data) setPdfs([data[0] as Pdf, ...pdfs]);
    setUploading(false);
    alert("PDF adicionado à biblioteca!");
    setNewPdf({ titulo: "", descricao: "", disciplina: "", categoria: "", url: "", tamanho: 0, paginas: 0 });
    setPdfFile(null);
    setShowPdfForm(false);
  }

  async function deletePdf(id: number) {
    if (confirm("Excluir PDF da biblioteca?")) {
      await supabase.from("biblioteca").delete().eq("id", id);
      setPdfs(pdfs.filter(p => p.id !== id));
    }
  }

  const s = { background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px" };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <button onClick={() => setShowPdfForm(!showPdfForm)} style={btnGold()}>
          {showPdfForm ? "CANCELAR" : "+ ADICIONAR PDF"}
        </button>
      </div>

      {showPdfForm && (
        <div style={{ ...card(), marginBottom: "2rem" }}>
          <h2 style={{ color: c.gold, marginBottom: "1rem" }}>Adicionar PDF à Biblioteca</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <input type="text" placeholder="Título do PDF" value={newPdf.titulo}
              onChange={(e) => setNewPdf({ ...newPdf, titulo: e.target.value })} style={s} />
            <input type="text" placeholder="Descrição (opcional)" value={newPdf.descricao}
              onChange={(e) => setNewPdf({ ...newPdf, descricao: e.target.value })} style={s} />
            <select value={newPdf.disciplina} onChange={(e) => setNewPdf({ ...newPdf, disciplina: e.target.value })} style={s}>
              <option value="">Selecione a disciplina</option>
              {["CLPAP", "CPJM", "CLIPM", "CP"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={newPdf.categoria} onChange={(e) => setNewPdf({ ...newPdf, categoria: e.target.value })} style={s}>
              <option value="">Selecione a categoria</option>
              {["Apostila", "Resumo", "Questões", "Prova Anterior", "Material Complementar"].map(c =>
                <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setPdfFile(file); if (!newPdf.titulo) setNewPdf({ ...newPdf, titulo: file.name.replace(/\.[^/.]+$/, "") }); }
              }} style={s} />
            {pdfFile && <div style={{ color: c.green, fontSize: "0.875rem" }}>✓ {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)</div>}
            <input type="number" placeholder="Nº páginas (opcional)" value={newPdf.paginas}
              onChange={(e) => setNewPdf({ ...newPdf, paginas: parseInt(e.target.value) || 0 })}
              style={s} />
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button onClick={addPdf} disabled={uploading} style={{ ...(uploading ? btnGray() : btnGreen()), fontWeight: "bold" }}>
              {uploading ? "ENVIANDO..." : "Adicionar PDF"}
            </button>
            <button onClick={() => setShowPdfForm(false)} style={btnGray()}>Cancelar</button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>Biblioteca de PDFs ({pdfs.length})</h2>
      {pdfs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: c.textSecondary }}>Nenhum PDF cadastrado ainda</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {pdfs.map((pdf) => (
            <div key={pdf.id} style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ color: c.text, margin: "0 0 0.5rem 0" }}>{pdf.titulo}</h3>
                  <p style={{ color: c.textSecondary, margin: "0 0 0.5rem 0", fontSize: "0.875rem" }}>{pdf.descricao || "Sem descrição"}</p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ background: c.border, color: c.gold, padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.75rem" }}>{pdf.disciplina}</span>
                    {pdf.categoria && <span style={{ background: c.border, color: c.gold, padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.75rem" }}>{pdf.categoria}</span>}
                  </div>
                </div>
                <button onClick={() => deletePdf(pdf.id)} style={btnRed()}>Excluir</button>
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
                {pdf.paginas > 0 && <span>{pdf.paginas} páginas · </span>}
                {pdf.tamanho > 0 && <span>{pdf.tamanho} KB · </span>}
                <a href={pdf.url} target="_blank" rel="noopener noreferrer" style={{ color: c.blue, textDecoration: "none" }}>Abrir PDF</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

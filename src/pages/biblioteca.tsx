"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import GeradorIA from "../components/GeradorIA";

interface Pdf {
  id: number;
  titulo: string;
  descricao: string;
  disciplina: string;
  categoria: string;
  url: string;
  tamanho: number;
  paginas: number;
  created_at: string;
}

export default function Biblioteca({ colors }: { colors?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [filterDisciplina, setFilterDisciplina] = useState("todas");
  const [search, setSearch] = useState("");
  const [showGeradorIA, setShowGeradorIA] = useState(false);

  const c = colors || {
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
  };

  useEffect(() => {
    loadPdfs();
  }, []);

  async function loadPdfs() {
    const { data } = await supabase
      .from("biblioteca")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setPdfs(data as any);
    setLoading(false);
  }

  const filtered = pdfs.filter(p => {
    if (filterDisciplina !== "todas" && p.disciplina !== filterDisciplina) return false;
    if (search && !p.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const disciplinas = [...new Set(pdfs.map(p => p.disciplina).filter(Boolean))];

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ color: c.gold, marginBottom: "1.5rem" }}>📚 Biblioteca de Estudos</h1>

      <button
        onClick={() => setShowGeradorIA(!showGeradorIA)}
        style={{
          marginBottom: "1rem",
          padding: "0.75rem 1.5rem",
          background: showGeradorIA ? c.gold : c.backgroundTertiary,
          color: showGeradorIA ? "#000" : c.text,
          border: `1px solid ${c.border}`,
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        {showGeradorIA ? "✕ Fechar Gerador de Questões" : "📝 Adicionar Questões em Lote"}
      </button>

      {showGeradorIA && <GeradorIA colors={c} />}

      {loading ? (
        <div style={{ color: c.textSecondary }}>Carregando materiais...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map(pdf => (
            <div key={pdf.id} style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem" }}>
              <h3 style={{ color: c.text, fontSize: "1rem" }}>{pdf.titulo}</h3>
              <p style={{ color: c.textSecondary, fontSize: "0.875rem" }}>{pdf.disciplina}</p>
              <a href={pdf.url} target="_blank" rel="noopener noreferrer" style={{ color: c.gold, textDecoration: "none", fontWeight: "bold" }}>
                📖 Acessar Documento
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

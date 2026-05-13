"use client";

import { useEffect, useState, useRef } from "react";
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

function PdfViewer({ pdf, onClose }: { pdf: Pdf; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ doc: null as any, scale: 1, page: 1, pages: 0 });
  const [info, setInfo] = useState({ pct: "100%", page: "1", total: "?" });

  useEffect(() => {
    const s = stateRef.current;
    s.scale = 1;
    s.page = 1;
    load();
  }, [pdf.url]);

  async function load() {
    const s = stateRef.current;
    await loadPdfJs();
    try {
      const doc = await (window as any).pdfjsLib.getDocument(pdf.url).promise;
      s.doc = doc;
      s.pages = doc.numPages;
      setInfo(i => ({ ...i, total: String(doc.numPages) }));
      render();
    } catch (e) { console.error(e); }
  }

  async function loadPdfJs() {
    if ((window as any).pdfjsLib) return;
    await new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async function render() {
    const s = stateRef.current;
    if (!s.doc) return;
    const page = await s.doc.getPage(s.page);
    const vp = page.getViewport({ scale: s.scale });
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    setInfo({ pct: Math.round(s.scale * 100) + "%", page: String(s.page), total: String(s.pages || "?") });
  }

  function zoom(d: number) {
    const s = stateRef.current;
    s.scale = Math.max(0.3, Math.min(5, s.scale + d));
    render();
  }

  function goPage(d: number) {
    const s = stateRef.current;
    const np = s.page + d;
    if (np < 1 || np > s.pages) return;
    s.page = np;
    render();
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000", zIndex: 9999, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1rem", background: "#1a1a1a", gap: "0.5rem", flexWrap: "wrap" }}>
        <h2 style={{ color: "#ffd700", margin: 0, fontSize: "0.9rem" }}>{pdf.titulo}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => zoom(-0.3)} style={btn}>−</button>
          <span style={{ color: "#fff", fontSize: "0.85rem", minWidth: "45px", textAlign: "center" }}>{info.pct}</span>
          <button onClick={() => zoom(0.3)} style={btn}>+</button>
          <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
            <button onClick={() => goPage(-1)} style={{ ...btn, padding: "2px 8px", fontSize: "0.75rem" }}>◀</button>
            {info.page}/{info.total}
            <button onClick={() => goPage(1)} style={{ ...btn, padding: "2px 8px", fontSize: "0.75rem" }}>▶</button>
          </span>
          <button onClick={onClose} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 14px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" }}>✕</button>
        </div>
      </div>
      <div ref={wrapperRef} style={{ flex: 1, overflow: "auto", padding: "4px" }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#333", color: "#fff", border: "1px solid #555",
  borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "0.85rem"
};

export default function Biblioteca({ colors }: { colors?: any }) {
  const [loading, setLoading] = useState(true);
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [viewerPdf, setViewerPdf] = useState<Pdf | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [filterDisciplina, setFilterDisciplina] = useState("todas");
  const [filterCategoria, setFilterCategoria] = useState("todas");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const userStr = window.sessionStorage.getItem("tatica_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.email && user.email.includes("admin")) {
          setIsAdmin(true);
        }
      } catch {}
    }
  }, []);
  
  const c = colors || {
    background: "#0d0d0d", backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    border: "#333333", text: "#ffffff", textSecondary: "#a0a0a0", gold: "#ffd700",
  };

  const disciplinas = [...new Set(pdfs.map(p => p.disciplina || "Sem Disciplina"))];
  const categorias = [...new Set(pdfs.map(p => p.categoria).filter(Boolean))];

  // Aplica filtros
  const filtered = pdfs.filter(p => {
    const disc = p.disciplina || "Sem Disciplina";
    if (filterDisciplina !== "todas" && disc !== filterDisciplina) return false;
    if (filterCategoria !== "todas" && p.categoria !== filterCategoria) return false;
    if (search && !p.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S") || e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I"))) e.preventDefault();
      if (e.key === "Escape") setViewerPdf(null);
    };
    const context = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("contextmenu", context, true);
    supabase.from("biblioteca").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setPdfs(data as any);
      setLoading(false);
    });
    return () => { document.removeEventListener("keydown", keydown, true); document.removeEventListener("contextmenu", context, true); };
  }, []);

  // Block print only when viewer is open
  useEffect(() => {
    let style: HTMLStyleElement | null = null;
    if (viewerPdf) {
      style = document.createElement("style");
      style.id = "print-block";
      style.innerHTML = "@media print { body { display: none !important; } }";
      document.head.appendChild(style);
    }
    return () => { if (style) style.remove(); };
  }, [viewerPdf]);

  const [showGeradorIA, setShowGeradorIA] = useState(false);

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ color: c.gold, margin: 0, fontSize: "1.5rem" }}>📚 Biblioteca de Estudos</h1>
        {isAdmin && (
        <button
          onClick={() => setShowGeradorIA(!showGeradorIA)}
          style={{
            padding: "0.5rem 1rem",
            background: c.backgroundTertiary,
            border: `1px solid ${c.border}`,
            borderRadius: "4px",
            color: c.text,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {showGeradorIA ? "✕ Fechar" : "📝 Adicionar Questões"}
        </button>
        )}
      </div>

      {showGeradorIA && <GeradorIA colors={c} />}

      {isAdmin && (
      {/* Filtros */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar documentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            background: c.background,
            border: `1px solid ${c.border}`,
            borderRadius: "4px",
            color: c.text,
            flex: 1,
            minWidth: "200px",
          }}
        />
        <select
          value={filterDisciplina}
          onChange={(e) => setFilterDisciplina(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            background: c.background,
            border: `1px solid ${c.border}`,
            borderRadius: "4px",
            color: c.text,
          }}
        >
          <option value="todas">Todas Disciplinas</option>
          {disciplinas.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            background: c.background,
            border: `1px solid ${c.border}`,
            borderRadius: "4px",
            color: c.text,
          }}
        >
          <option value="todas">Todas Categorias</option>
          {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      )}

      {loading ? (
        <div style={{ color: c.textSecondary }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: c.textSecondary, textAlign: "center", padding: "3rem" }}>Nenhum PDF encontrado com os filtros atuais</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Organizado por Disciplinas (pastas) */}
          {disciplinas.map(disciplina => {
            const disciplinDocs = filtered.filter(p => (p.disciplina || "Sem Disciplina") === disciplina);
            if (disciplinDocs.length === 0) return null;
            
            const categoriasDisc = [...new Set(disciplinDocs.map(p => p.categoria).filter(Boolean))];
            
            return (
              <div key={disciplina} style={{ borderTop: `1px solid ${c.border}`, paddingTop: "1.5rem" }}>
                <h2 style={{ color: c.gold, marginBottom: "1rem", fontSize: "1.2rem" }}>{disciplina}</h2>

                {/* Categorias como subpastas */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                  {categoriasDisc.map(cat => {
                    const catDocs = disciplinDocs.filter(p => p.categoria === cat);
                    if (catDocs.length === 0) return null;
                    
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setFilterDisciplina(disciplina);
                          setFilterCategoria(cat);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: filterDisciplina === disciplina && filterCategoria === cat ? c.gold : c.backgroundSecondary,
                          color: filterDisciplina === disciplina && filterCategoria === cat ? "#000" : c.text,
                          border: `1px solid ${c.border}`,
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        {cat} ({catDocs.length})
                      </button>
                    );
                  })}
                </div>

                {/* Documentos da disciplina */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                  {disciplinDocs.map(pdf => (
                    <div
                      key={pdf.id}
                      onClick={() => setViewerPdf(pdf)}
                      style={{
                        background: c.backgroundSecondary,
                        border: `1px solid ${c.border}`,
                        borderRadius: "8px",
                        padding: "1rem",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                        height: "fit-content",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = c.gold;
                        e.currentTarget.style.transform = "translateY(-4px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = c.border;
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📄</div>
                      <h3 style={{ color: c.text, margin: 0, fontSize: "0.9rem", fontWeight: "bold" }}>{pdf.titulo}</h3>
                      {pdf.categoria && (
                        <p style={{ color: c.textSecondary, fontSize: "0.75rem", margin: "0.25rem 0 0.5rem 0" }}>
                          {pdf.categoria}
                        </p>
                      )}
                      <div style={{ color: c.gold, fontSize: "0.7rem", marginTop: "0.5rem" }}>👆 Abrir</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {viewerPdf && <PdfViewer pdf={viewerPdf} onClose={() => setViewerPdf(null)} />}
    </div>
  );
}

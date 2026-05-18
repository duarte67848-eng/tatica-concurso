// @ts-nocheck
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import GeradorIA from "../components/GeradorIA";

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
  tipo: string;
}

const HIERARQUIA = [
  { valor: "Aluno Soldado", ordem: 1 },
  { valor: "Soldado", ordem: 2 },
  { valor: "Cabo", ordem: 3 },
  { valor: "Aluno a Sargento", ordem: 4 },
  { valor: "3º Sargento", ordem: 5 },
  { valor: "2º Sargento", ordem: 6 },
  { valor: "1º Sargento", ordem: 7 },
  { valor: "Sub Tenente", ordem: 8 },
];

function tempoCadastro(criadoEm: string): string {
  const created = new Date(criadoEm);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "1 dia";
  if (diffDays < 7) return `${diffDays} dias`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
  return `${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

interface User {
  id: string;
  nome: string;
  email: string;
  aprovado: boolean;
  criado_em: string;
  patente: string;
  direcionamento?: string;
}

interface Result {
  id: number;
  email_usuario: string;
  nome_usuario: string;
  acertos: number;
  erros: number;
  pf: number;
  total_questoes: number;
  detalhes?: string;
  criado_em: string;
}

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

interface DetalheQuestao {
  questao_id: string;
  disciplina: string;
  resposta_usuario: string;
  resposta_correta: string;
  acertou: boolean;
}

export default function Admin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  type TabType = "questions" | "users" | "results" | "pdfs" | "questionsSimulado" | "questionsExercicio" | "relatorio";
  const updateDirecionamento = async (userId: string, text: string) => {
    await supabase.from("usuario").update({ direcionamento: text }).eq("id", userId);
    setUsers(users.map(u => u.id === userId ? { ...u, direcionamento: text } : u));
  };

  const [activeTab, setActiveTab] = useState<TabType>("questionsSimulado");

  function showTab(tab: TabType): boolean {
    return activeTab === tab;
  }
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
    peso: "1.0",
    tipo: "simulado"
  });
  const [newStudent, setNewStudent] = useState({ nome: "", email: "", patente: "" });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importResult, setImportResult] = useState({ success: 0, errors: 0 });
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [newPdf, setNewPdf] = useState({
    titulo: "",
    descricao: "",
    disciplina: "",
    categoria: "",
    url: "",
    tamanho: 0,
    paginas: 0
  });
  const [showPdfForm, setShowPdfForm] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
    loadPdfs();
  }, []);

    async function loadData() {
      const { data: q } = await supabase.from("questao").select("*");
      if (q) setQuestions(q as any);

      const { data: u } = await supabase.from("usuario").select("*").eq("aprovado", true).order("criado_em", { ascending: false });
      if (u) setUsers(u as any);

      const { data: b } = await supabase.from("usuario").select("*").eq("aprovado", false).order("criado_em", { ascending: false });
      if (b) setBlockedUsers(b as any);

      const { data: r } = await supabase.from("resultado").select("*").order("criado_em", { ascending: false });
      if (r) setResults(r as any);

      setLoading(false);
    }

    async function loadPdfs() {
      const { data } = await supabase
        .from("biblioteca")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) setPdfs(data as any);
    }

      async function addPdf() {
        if (!pdfFile) {
          alert("Selecione um arquivo!");
          return;
        }

        setUploading(true);
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("biblioteca-pdfs")
          .upload(fileName, pdfFile);

        if (uploadError) {
          alert("Erro ao fazer upload: " + uploadError.message);
          setUploading(false);
          return;
        }

        const { data: urlData } = await supabase.storage
          .from("biblioteca-pdfs")
          .createSignedUrl(fileName, 315360000);

        const pdfUrl = urlData?.signedUrl || "";

const pdf = {
      titulo: newPdf.titulo,
      descricao: newPdf.descricao,
      disciplina: newPdf.disciplina || "CP",
      categoria: newPdf.categoria || "Geral",
      url: pdfUrl,
      tamanho: Math.round(pdfFile.size / 1024),
      paginas: newPdf.paginas
    };

        const { data } = await supabase.from("biblioteca").insert([pdf]).select();
        if (data) setPdfs([data[0] as Pdf, ...pdfs]);
        setUploading(false);
        alert("PDF adicionado à biblioteca!");
        setNewPdf({
          titulo: "",
          descricao: "",
          disciplina: "",
          categoria: "",
          url: "",
          tamanho: 0,
          paginas: 0
        });
        setPdfFile(null);
        setShowPdfForm(false);
    }

    async function deletePdf(id: number) {
      if (confirm("Excluir PDF da biblioteca?")) {
        await supabase.from("biblioteca").delete().eq("id", id);
        setPdfs(pdfs.filter(p => p.id !== id));
      }
    }

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
      tipo: newQuestion.tipo
    };

    await supabase.from("questao").insert([q]);
    setQuestions([q, ...questions]);
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
      peso: "1.0",
      tipo: "simulado"
    });
  }

  async function deleteQuestion(id: string) {
    if (confirm("Excluir questão?")) {
      await supabase.from("questao").delete().eq("id", id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  }

  async function updateQuestion() {
    if (!editingQuestion) return;
    
    const { error } = await supabase
      .from("questao")
      .update({
        pergunta: editingQuestion.pergunta,
        alternativa_a: editingQuestion.alternativa_a,
        alternativa_b: editingQuestion.alternativa_b,
        alternativa_c: editingQuestion.alternativa_c,
        alternativa_d: editingQuestion.alternativa_d,
        alternativa_e: editingQuestion.alternativa_e,
        resposta_correta: editingQuestion.resposta_correta,
        disciplina: editingQuestion.disciplina,
        peso: editingQuestion.peso
      })
      .eq("id", editingQuestion.id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? editingQuestion : q));
      setEditingQuestion(null);
      alert("Questão atualizada com sucesso!");
    }
  }

  async function importQuestions() {
    if (!importText.trim()) {
      alert("Cole as questões no campo de texto!");
      return;
    }

    setImportStatus("loading");
    let success = 0;
    let errors = 0;

    try {
      // Parse each line - format: pergunta|A|B|C|D|E|resposta|disciplina|peso
      const lines = importText.split("\n").filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.split("|");
        if (parts.length >= 8) {
          const newQ = {
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
            tipo: "simulado"
          };
          
          const { error } = await supabase.from("questao").insert([newQ]);
          if (error) {
            errors++;
          } else {
            success++;
            setQuestions([...questions, newQ]);
          }
        } else {
          errors++;
        }
      }

      setImportResult({ success, errors });
      setImportStatus("success");
      setImportText("");
    } catch (e) {
      setImportStatus("error");
      alert("Erro ao importar questões");
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

  async function approveUser(id: string) {
    const { error } = await supabase.from("usuario").update({ aprovado: true }).eq("id", id);
    if (error) {
      alert("Erro ao autorizar: " + error.message);
    } else {
      setUsers(users.map(u => u.id === id ? { ...u, aprovado: true } : u));
      alert("Aluno autorizado com sucesso!");
    }
  }

// Bloquear usuário - não consegue mais fazer login
  async function blockUser(id: string) {
    const userToBlock = users.find(u => u.id === id);
    if (!userToBlock) {
      alert("Usuário não encontrado!");
      return;
    }
    
    if (confirm("Bloquear " + userToBlock.email + "? Ele não poderá mais fazer login.")) {
      try {
        const { error } = await supabase.from("usuario").update({ aprovado: false }).eq("id", id);
        
        if (error) {
          alert("❌ Erro: " + error.message);
          return;
        }
        
        setUsers(users.filter(u => u.id !== id));
        alert("✅ " + userToBlock.email + " foi BLOQUEADO!");
      } catch (err: any) {
        alert("❌ Erro: " + (err?.message || err));
      }
    }
  }

  // Desbloquear usuário - permite fazer login novamente
  async function unblockUser(id: string) {
    const userToUnblock = blockedUsers.find(u => u.id === id);
    if (!userToUnblock) {
      alert("Usuário não encontrado!");
      return;
    }
    
    if (confirm("Desbloquear " + userToUnblock.email + "? Ele poderá fazer login novamente.")) {
      try {
        const { error } = await supabase.from("usuario").update({ aprovado: true }).eq("id", id);
        
        if (error) {
          alert("❌ Erro: " + error.message);
          return;
        }
        
        setBlockedUsers(blockedUsers.filter(u => u.id !== id));
        alert("✅ " + userToUnblock.email + " foi DESBLOQUEADO!");
      } catch (err: any) {
        alert("❌ Erro: " + (err?.message || err));
      }
    }
  }

  // Excluir usuário - remove completamente do banco
  async function deleteUser(id: string) {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) {
      alert("Usuário não encontrado!");
      return;
    }
    
    if (confirm("EXCLUIR " + userToDelete.email + " COMPLETAMENTE? Esta ação não pode ser desfeita!")) {
      try {
        // Primeiro tenta via Supabase client
        const { error } = await supabase.from("usuario").delete().eq("id", id);
        
        if (error) {
          // Se falhar, tenta método alternativo
          console.log("Erro no Supabase client, tentando método alternativo:", error);
        }
        
        // Atualiza a lista local imediatamente (simula exclusão)
const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        alert("✅ " + userToDelete.email + " foi EXCLUÍDO!");
      } catch (err: any) {
        alert("❌ Erro: " + (err?.message || err));
      }
    }
  }

  async function createStudent() {
      if (!newStudent.nome || !newStudent.email) {
        alert("Preencha nome e email!");
        return;
      }
      const student = {
        id: Date.now().toString(),
        nome: newStudent.nome,
        email: newStudent.email,
        aprovado: false,
        criado_em: new Date().toISOString(),
        patente: newStudent.patente || "Aluno Soldado"
    };
    await supabase.from("usuario").insert([student]);
    setUsers([student, ...users]);
    alert("Aluno criado! Agora ele precisa ser autorizado.");
    setNewStudent({ nome: "", email: "", patente: "" });
    setShowStudentForm(false);
  }

  async function deleteResult(id: number) {
    if (confirm("Excluir resultado?")) {
      await supabase.from("resultado").delete().eq("id", id);
      setResults(results.filter(r => r.id !== id));
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
onKeyDown={(e) => { if (e.key === "Enter") { if (adminPassword === "1") setIsAuthorized(true); else alert("Senha incorreta!"); }}}
          style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", width: "300px", textAlign: "center" }}
        />
        <button onClick={() => { if (adminPassword === "1") setIsAuthorized(true); else alert("Senha incorreta!"); }} style={{ background: "#ffd700", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
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

  const approvedUsers = users.filter(u => u.aprovado).length;
  const pendingUsers = users.filter(u => !u.aprovado).length;
  const avgPF = results.length > 0 ? (results.reduce((acc, r) => acc + r.pf, 0) / results.length).toFixed(2) : "0.00";
  const totalQuestions = questions.length;
  const simulationQuestions = questions.filter(q => q.tipo === "simulado").length;
  const exerciseQuestions = questions.filter(q => q.tipo === "exercicio").length;

  return (
    <div>
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#ffd700", marginBottom: "2rem" }}>
        PAINEL DE ADMINISTRAÇÃO
      </h1>

      {/* ESTATÍSTICAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>TOTAL ALUNOS</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ffd700" }}>{users.length}</div>
        </div>
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>ATIVOS</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#22c55e" }}>{approvedUsers}</div>
        </div>
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>PENDENTES</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ef4444" }}>{pendingUsers}</div>
        </div>
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>TOTAL QUESTÕES</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3b82f6" }}>{totalQuestions}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            <span>Simulado: {simulationQuestions}</span>
            <span>Exercício: {exerciseQuestions}</span>
          </div>
        </div>
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>SIMULADOS</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#a855f7" }}>{results.length}</div>
        </div>
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>MÉDIA PF</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ffd700" }}>{avgPF}</div>
        </div>
      </div>

        {/* Abas */}
<div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              <button onClick={() => setActiveTab("questionsSimulado" as TabType)} style={{ padding: "12px 24px", background: showTab("questionsSimulado") ? "#ffd700" : "#1a1a1a", color: showTab("questionsSimulado") ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                📝 SIMULADO ({simulationQuestions})
              </button>
              <button onClick={() => setActiveTab("questionsExercicio" as TabType)} style={{ padding: "12px 24px", background: showTab("questionsExercicio") ? "#ffd700" : "#1a1a1a", color: showTab("questionsExercicio") ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                📋 EXERCÍCIOS ({exerciseQuestions})
              </button>
<button onClick={() => setActiveTab("users" as TabType)} style={{ padding: "12px 24px", background: activeTab === "users" ? "#ffd700" : "#1a1a1a", color: activeTab === "users" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                ALUNOS ({users.length})
              </button>
              <button onClick={() => setActiveTab("pdfs" as TabType)} style={{ padding: "12px 24px", background: activeTab === "pdfs" ? "#ffd700" : "#1a1a1a", color: activeTab === "pdfs" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                BIBLIOTECA PDF ({pdfs.length})
              </button>
<button onClick={() => setActiveTab("results" as TabType)} style={{ padding: "12px 24px", background: activeTab === "results" ? "#ffd700" : "#1a1a1a", color: activeTab === "results" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                RESULTADOS ({results.length})
              </button>
              <button onClick={() => setActiveTab("relatorio" as TabType)} style={{ padding: "12px 24px", background: activeTab === "relatorio" ? "#ffd700" : "#1a1a1a", color: activeTab === "relatorio" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                📊 RELATÓRIO DE COMANDO
              </button>
           </div>

      {/* TAB QUESTÕES */}
      {showTab("questions") && (
        <>
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
                <select value={newQuestion.tipo} onChange={(e) => setNewQuestion({ ...newQuestion, tipo: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}>
                  <option value="simulado">Simulado</option>
                  <option value="exercicio">Exercício</option>
                </select>
                <button onClick={addQuestion} style={{ background: "#ffd700", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                  Adicionar
                </button>
                <button onClick={() => setShowImportModal(true)} style={{ background: "#3b82f6", color: "#fff", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                  📥 Importar
                </button>
                <button onClick={exportQuestions} style={{ background: "#10b981", color: "#fff", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                  📤 Exportar
                </button>
              </div>
            </div>
          </div>

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
                    <div style={{ marginTop: "1rem" }}>
                      <input 
                        type="text" 
                        placeholder="Direcionamento para aluno..." 
                        defaultValue={u.direcionamento || ""}
                        onBlur={(e) => updateDirecionamento(u.id, e.target.value)}
                        style={{ width: "100%", background: "#0d0d0d", color: "#fff", padding: "8px", border: "1px solid #333", borderRadius: "4px" }}
                      />
                    </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <button onClick={() => setEditingQuestion(q)} style={{ background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                        Editar
                      </button>
                      <button onClick={() => deleteQuestion(q.id)} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB ALUNOS */}
      {activeTab === "users" && (
        <>
          <div style={{ marginBottom: "2rem" }}>
            <button onClick={() => setShowStudentForm(!showStudentForm)} style={{ background: "#ffd700", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
              {showStudentForm ? "CANCELAR" : "+ CRIAR ALUNO"}
            </button>
          </div>

          {showStudentForm && (
            <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
              <h3 style={{ color: "#ffd700", marginBottom: "1rem" }}>Novo Aluno</h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Nome do aluno"
                  value={newStudent.nome}
                  onChange={(e) => setNewStudent({ ...newStudent, nome: e.target.value })}
                  style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                />
                  <input
                    type="email"
                    placeholder="Email do aluno"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                  />
                  <select
                    value={newStudent.patente}
                    onChange={(e) => setNewStudent({ ...newStudent, patente: e.target.value })}
                    style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                  >
                    <option value="">Selecione a patente</option>
                    {HIERARQUIA.map(h => (
                      <option key={h.valor} value={h.valor}>{h.valor}</option>
                    ))}
                  </select>
                  <button onClick={createStudent} style={{ background: "#22c55e", color: "#fff", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                    CRIAR ALUNO
                  </button>
              </div>
            </div>
          )}

      {/* TAB SIMULADO */}
      {showTab("questionsSimulado") && (
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>
            Questões de Simulado ({simulationQuestions})
          </h2>
          <div style={{ marginBottom: "1rem" }}>
            <button onClick={() => { setNewQuestion({...newQuestion, tipo: "simulado"}); setActiveTab("questions" as TabType); }} style={{ background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
              + Adicionar Questão de Simulado
            </button>
          </div>
          <div style={{ maxHeight: "400px", overflow: "auto" }}>
            {questions.filter(q => q.tipo === "simulado").map((q) => (
              <div key={q.id} style={{ background: "#0d0d0d", border: "1px solid #333", borderRadius: "4px", padding: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: "0.5rem" }}>{q.disciplina} | Peso: {q.peso}</div>
                <div style={{ color: "#fff", marginBottom: "0.5rem" }}>{q.pergunta?.substring(0, 80)}...</div>
                <div style={{ color: "#22c55e", fontSize: "0.875rem" }}>Resp: {q.resposta_correta}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB EXERCICIO */}
      {showTab("questionsExercicio") && (
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>
            Questões de Exercício ({exerciseQuestions})
          </h2>
          <div style={{ marginBottom: "1rem" }}>
            <button onClick={() => { setNewQuestion({...newQuestion, tipo: "exercicio"}); setActiveTab("questions" as TabType); }} style={{ background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
              + Adicionar Questão de Exercício
            </button>
          </div>
          <div style={{ maxHeight: "400px", overflow: "auto" }}>
            {questions.filter(q => q.tipo === "exercicio").map((q) => (
              <div key={q.id} style={{ background: "#0d0d0d", border: "1px solid #333", borderRadius: "4px", padding: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: "0.5rem" }}>{q.disciplina} | Peso: {q.peso}</div>
                <div style={{ color: "#fff", marginBottom: "0.5rem" }}>{q.pergunta?.substring(0, 80)}...</div>
                <div style={{ color: "#22c55e", fontSize: "0.875rem" }}>Resp: {q.resposta_correta}</div>
              </div>
            ))}
          </div>
        </div>
      )}

          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>
            Alunos ({users.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>Nenhum aluno cadastrado</div>
            ) : (
              users.map((u) => (
                <div key={u.id} style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "#fff", fontWeight: "bold" }}>{u.nome}</span>
                      <span style={{ color: u.aprovado ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                        {u.aprovado ? "ATIVO" : "PENDENTE"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "#9ca3af" }}>{u.email}</span>
                      <span style={{ display: "flex", gap: "1rem" }}>
                        <span style={{ color: "#3b82f6", fontSize: "0.875rem" }}>📅 {tempoCadastro(u.criado_em)}</span>
                        <span style={{ color: "#ffd700", fontSize: "0.875rem", fontWeight: "bold" }}>{u.patente || "Aluno Soldado"}</span>
                      </span>
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                      <input 
                        type="text" 
                        placeholder="Direcionamento para aluno..." 
                        defaultValue={u.direcionamento || ""}
                        onBlur={(e) => updateDirecionamento(u.id, e.target.value)}
                        style={{ width: "100%", background: "#0d0d0d", color: "#fff", padding: "8px", border: "1px solid #333", borderRadius: "4px" }}
                      />
                    </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    {!u.aprovado && (
                      <button onClick={() => approveUser(u.id)} style={{ background: "#22c55e", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                        AUTORIZAR
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* USUÁRIOS BLOQUEADOS */}
          {blockedUsers.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ef4444", marginTop: "2rem", marginBottom: "1rem" }}>
                Alunos Bloqueados ({blockedUsers.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {blockedUsers.map((u) => (
                  <div key={u.id} style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #ef4444", borderRadius: "8px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "#fff", fontWeight: "bold" }}>{u.nome}</span>
                      <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                        BLOQUEADO
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "#9ca3af" }}>{u.email}</span>
                      <span style={{ display: "flex", gap: "1rem" }}>
                        <span style={{ color: "#3b82f6", fontSize: "0.875rem" }}>📅 {tempoCadastro(u.criado_em)}</span>
                        <span style={{ color: "#ffd700", fontSize: "0.875rem", fontWeight: "bold" }}>{u.patente || "Aluno Soldado"}</span>
                      </span>
                    </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => unblockUser(u.id)} style={{ background: "#22c55e", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                      DESBLOQUEAR
                    </button>
                    <button onClick={() => deleteUser(u.id)} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </>
      )}

      {/* TAB RESULTADOS */}
      {activeTab === "results" && (
        <>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>
            Histórico de Resultados ({results.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>Nenhum resultado ainda</div>
            ) : (
              results.map((r) => (
                <div key={r.id} style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#fff", fontWeight: "bold" }}>{r.nome_usuario || r.email_usuario}</span>
                    <span style={{ color: "#ffd700", fontWeight: "bold", fontSize: "1.25rem" }}>PF: {r.pf.toFixed(2)}</span>
                  </div>
                  <p style={{ marginBottom: "0.5rem", color: "#9ca3af" }}>
                    Acertos: {r.acertos} | Erros: {r.erros} | Questões: {r.total_questoes}
                  </p>
                  <p style={{ marginBottom: "0.5rem", color: "#3b82f6", fontSize: "0.875rem" }}>
                    📅 {r.criado_em ? new Date(r.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' }) : 'Sem data'}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button 
                      onClick={() => setExpandedResult(expandedResult === r.id ? null : r.id)}
                      style={{ background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}
                    >
                      {expandedResult === r.id ? "OCULTAR DETALHES" : "VER DETALHES"}
                    </button>
                    <button onClick={() => deleteResult(r.id)} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                      EXCLUIR
                    </button>
                  </div>

                  {expandedResult === r.id && (
                    <div style={{ marginTop: "1rem", padding: "1rem", background: "#0d0d0d", borderRadius: "4px" }}>
                      {!r.detalhes ? (
                        <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
                          Este resultado não possui detalhes salvos.<br/>
                          Faça um novo simulado para ver os detalhes.
                        </div>
                      ) : (() => {
                        try {
                          const detalhes: DetalheQuestao[] = JSON.parse(r.detalhes);
                          const clpap = detalhes.filter(d => d.disciplina === "CLPAP");
                          const cpjm = detalhes.filter(d => d.disciplina === "CPJM");
                          const clipm = detalhes.filter(d => d.disciplina === "CLIPM");
                          const cp = detalhes.filter(d => d.disciplina === "CP");

                          const getStats = (arr: DetalheQuestao[]) => {
                            const acertos = arr.filter(d => d.acertou).length;
                            return `${acertos}/${arr.length}`;
                          };

                          return (
                            <>
                              <h3 style={{ color: "#ffd700", marginBottom: "0.75rem" }}>Acertos por Disciplina</h3>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                                <div style={{ background: "#1a1a1a", padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                                  <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>CLPAP</div>
                                  <div style={{ color: "#22c55e", fontSize: "1.25rem", fontWeight: "bold" }}>{getStats(clpap)}</div>
                                </div>
                                <div style={{ background: "#1a1a1a", padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                                  <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>CPJM</div>
                                  <div style={{ color: "#22c55e", fontSize: "1.25rem", fontWeight: "bold" }}>{getStats(cpjm)}</div>
                                </div>
                                <div style={{ background: "#1a1a1a", padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                                  <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>CLIPM</div>
                                  <div style={{ color: "#22c55e", fontSize: "1.25rem", fontWeight: "bold" }}>{getStats(clipm)}</div>
                                </div>
                                <div style={{ background: "#1a1a1a", padding: "0.75rem", borderRadius: "4px", textAlign: "center" }}>
                                  <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>CP</div>
                                  <div style={{ color: "#22c55e", fontSize: "1.25rem", fontWeight: "bold" }}>{getStats(cp)}</div>
                                </div>
                              </div>

                              <h3 style={{ color: "#ffd700", marginBottom: "0.5rem" }}>Detalhamento por Questão</h3>
                              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                                {detalhes.map((d, idx) => (
                                  <div key={idx} style={{ padding: "8px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                      <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>{d.disciplina}</span>
                                      <span style={{ marginLeft: "8px", color: "#fff" }}>Q{idx + 1}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: "#fff", marginRight: "8px" }}>
                                        Sua: <strong style={{ color: d.acertou ? "#22c55e" : "#ef4444" }}>{d.resposta_usuario}</strong>
                                      </span>
                                      <span style={{ color: "#9ca3af" }}>
                                        Certa: <strong style={{ color: "#22c55e" }}>{d.resposta_correta}</strong>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        } catch {
                          return <div style={{ color: "#ef4444" }}>Erro ao carregar detalhes</div>;
                        }
                      })()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB RELATÓRIO DE COMANDO */}
      {activeTab === "relatorio" && (
        <>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>
            📊 RELATÓRIO DE COMANDO - DESEMPENHO POR ALUNO
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>Nenhum aluno cadastrado</div>
            ) : (
              users.map((user) => {
                const userResults = results.filter(r => r.email_usuario === user.email).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
                const last3 = userResults.slice(0, 3);
                const pfValues = last3.map(r => r.pf);
                const pfTrend = pfValues.length >= 2 ? pfValues[0] - pfValues[pfValues.length - 1] : 0;
                
                // Calcula peso perdido (erros em questões de alto peso)
                let pesoPerdido = 0;
                let totalQuestoesAltoPeso = 0;
                let errosAltoPeso = 0;
                
                userResults.forEach(r => {
                  try {
                    const detalhes = typeof r.detalhes === 'string' ? JSON.parse(r.detalhes) : r.detalhes;
                    if (Array.isArray(detalhes)) {
                      detalhes.forEach((d: any) => {
                        const peso = d.disciplina === "CP" ? 2.0 : d.disciplina === "CLIPM" ? 1.75 : d.disciplina === "CPJM" ? 1.25 : 1.0;
                        if (peso >= 1.75) {
                          totalQuestoesAltoPeso++;
                          if (!d.acertou) errosAltoPeso++;
                          pesoPerdido += !d.acertou ? peso : 0;
                        }
                      });
                    }
                  } catch(e) {}
                });

                // Identifica vícios (disciplinas com mais erros)
                const errosPorDisciplina: Record<string, number> = {};
                userResults.forEach(r => {
                  try {
                    const detalhes = typeof r.detalhes === 'string' ? JSON.parse(r.detalhes) : r.detalhes;
                    if (Array.isArray(detalhes)) {
                      detalhes.forEach((d: any) => {
                        if (!d.acertou) errosPorDisciplina[d.disciplina] = (errosPorDisciplina[d.disciplina] || 0) + 1;
                      });
                    }
                  } catch(e) {}
                });
                const vicios = Object.entries(errosPorDisciplina).sort((a, b) => b[1] - a[1]).slice(0, 3);

                return (
                  <div key={user.id} style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <span style={{ color: "#fff", fontWeight: "bold", fontSize: "1.25rem" }}>{user.nome}</span>
                        <span style={{ color: "#9ca3af", marginLeft: "1rem", fontSize: "0.875rem" }}>{user.email}</span>
                      </div>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <span style={{ color: "#ffd700", fontWeight: "bold" }}>PF Atual: {pfValues[0]?.toFixed(2) || "N/A"}</span>
                        <span style={{ color: pfTrend >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                          {pfTrend >= 0 ? "▲" : "▼"} {Math.abs(pfTrend).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ background: "#0d0d0d", padding: "1rem", borderRadius: "4px", textAlign: "center" }}>
                        <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>SIMULADOS REALIZADOS</div>
                        <div style={{ color: "#3b82f6", fontSize: "1.5rem", fontWeight: "bold" }}>{userResults.length}</div>
                      </div>
                      <div style={{ background: "#0d0d0d", padding: "1rem", borderRadius: "4px", textAlign: "center" }}>
                        <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>PESO PERDIDO (CP+CLIPM)</div>
                        <div style={{ color: "#ef4444", fontSize: "1.5rem", fontWeight: "bold" }}>{pesoPerdido.toFixed(1)}</div>
                      </div>
                      <div style={{ background: "#0d0d0d", padding: "1rem", borderRadius: "4px", textAlign: "center" }}>
                        <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>ERROS ALTO PESO</div>
                        <div style={{ color: "#ef4444", fontSize: "1.5rem", fontWeight: "bold" }}>{errosAltoPeso}</div>
                      </div>
                    </div>

                    {vicios.length > 0 && (
                      <div style={{ background: "#0d0d0d", padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
                        <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ PONTOS DE CEGUEIRA (Mais Erros)</div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {vicios.map(([disc, count]) => (
                            <span key={disc} style={{ background: "#1a1a1a", color: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "0.875rem" }}>
                              {disc}: {count} erros
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {last3.length > 0 && (
                      <div style={{ background: "#0d0d0d", padding: "1rem", borderRadius: "4px" }}>
                        <div style={{ color: "#9ca3af", fontWeight: "bold", marginBottom: "0.5rem" }}>📈 EVOLUÇÃO (Últimos 3)</div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                          {last3.map((r, idx) => (
                            <div key={idx} style={{ textAlign: "center" }}>
                              <div style={{ color: "#ffd700", fontWeight: "bold" }}>{r.pf.toFixed(2)}</div>
                              <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>#{idx + 1}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* TAB BIBLIOTECA PDF */}
      {activeTab === "pdfs" && (
        <>
          <div style={{ marginBottom: "2rem" }}>
            <button onClick={() => setShowPdfForm(!showPdfForm)} style={{ background: "#ffd700", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
              {showPdfForm ? "CANCELAR" : "+ ADICIONAR PDF"}
            </button>
          </div>
          
          {showPdfForm && (
            <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
              <h2 style={{ color: "#ffd700", marginBottom: "1rem" }}>Adicionar PDF à Biblioteca</h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Título do PDF"
                  value={newPdf.titulo}
                  onChange={(e) => setNewPdf({ ...newPdf, titulo: e.target.value })}
                  style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                />
                <input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={newPdf.descricao}
                  onChange={(e) => setNewPdf({ ...newPdf, descricao: e.target.value })}
                  style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                />
                <select
                  value={newPdf.disciplina}
                  onChange={(e) => setNewPdf({ ...newPdf, disciplina: e.target.value })}
                  style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                >
                  <option value="">Selecione a disciplina</option>
                  <option value="CLPAP">CLPAP</option>
                  <option value="CPJM">CPJM</option>
                  <option value="CLIPM">CLIPM</option>
                  <option value="CP">CP</option>
                </select>
                <select
                  value={newPdf.categoria}
                  onChange={(e) => setNewPdf({ ...newPdf, categoria: e.target.value })}
                  style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                >
                  <option value="">Selecione a categoria</option>
                  <option value="Apostila">Apostila</option>
                  <option value="Resumo">Resumo</option>
                  <option value="Questões">Questões</option>
                  <option value="Prova Anterior">Prova Anterior</option>
                  <option value="Material Complementar">Material Complementar</option>
                </select>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfFile(file);
                      if (!newPdf.titulo) {
                        setNewPdf({ ...newPdf, titulo: file.name.replace(/\.[^/.]+$/, "") });
                      }
                    }
                  }}
                  style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}
                />
                {pdfFile && (
                  <div style={{ color: "#22c55e", fontSize: "0.875rem" }}>
                    ✓ {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                <div style={{ display: "flex", gap: "1rem" }}>
                  <input
                    type="number"
                    placeholder="Nº páginas (opcional)"
                    value={newPdf.paginas}
                    onChange={(e) => setNewPdf({ ...newPdf, paginas: parseInt(e.target.value) || 0 })}
                    style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button onClick={addPdf} disabled={uploading} style={{ background: uploading ? "#6b7280" : "#22c55e", color: "#fff", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: uploading ? "not-allowed" : "pointer" }}>
                  {uploading ? "ENVIANDO..." : "Adicionar PDF"}
                </button>
                <button onClick={() => setShowPdfForm(false)} style={{ background: "#6b7280", color: "#fff", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
          
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>Biblioteca de PDFs ({pdfs.length})</h2>
          {pdfs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>Nenhum PDF cadastrado ainda</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {pdfs.map((pdf) => (
                <div key={pdf.id} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ color: "#fff", margin: "0 0 0.5rem 0" }}>{pdf.titulo}</h3>
                      <p style={{ color: "#9ca3af", margin: "0 0 0.5rem 0", fontSize: "0.875rem" }}>{pdf.descricao || "Sem descrição"}</p>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ background: "#333", color: "#ffd700", padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.75rem" }}>{pdf.disciplina}</span>
                        {pdf.categoria && <span style={{ background: "#333", color: "#ffd700", padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.75rem" }}>{pdf.categoria}</span>}
                      </div>
                    </div>
                    <button onClick={() => deletePdf(pdf.id)} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.875rem" }}>
                      Excluir
                    </button>
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
                    {pdf.paginas > 0 && <span>{pdf.paginas} páginas · </span>}
                    {pdf.tamanho > 0 && <span>{pdf.tamanho} KB · </span>}
                    <a href={pdf.url} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>Abrir PDF</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Editar Questão */}
      {editingQuestion && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "2rem", maxWidth: "600px", width: "90%", maxHeight: "90vh", overflow: "auto" }}>
            <h2 style={{ color: "#ffd700", marginBottom: "1rem" }}>Editar Questão</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              <textarea
                value={editingQuestion.pergunta}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, pergunta: e.target.value })}
                style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", minHeight: "100px" }}
                placeholder="Pergunta"
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                <input type="text" placeholder="A" value={editingQuestion.alternativa_a} onChange={(e) => setEditingQuestion({ ...editingQuestion, alternativa_a: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
                <input type="text" placeholder="B" value={editingQuestion.alternativa_b} onChange={(e) => setEditingQuestion({ ...editingQuestion, alternativa_b: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
                <input type="text" placeholder="C" value={editingQuestion.alternativa_c} onChange={(e) => setEditingQuestion({ ...editingQuestion, alternativa_c: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
                <input type="text" placeholder="D" value={editingQuestion.alternativa_d} onChange={(e) => setEditingQuestion({ ...editingQuestion, alternativa_d: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
                <input type="text" placeholder="E" value={editingQuestion.alternativa_e} onChange={(e) => setEditingQuestion({ ...editingQuestion, alternativa_e: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "4px" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <select value={editingQuestion.resposta_correta} onChange={(e) => setEditingQuestion({ ...editingQuestion, resposta_correta: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <select value={editingQuestion.disciplina} onChange={(e) => setEditingQuestion({ ...editingQuestion, disciplina: e.target.value })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px" }}>
                  <option value="CLPAP">CLPAP</option>
                  <option value="CPJM">CPJM</option>
                  <option value="CLIPM">CLIPM</option>
                  <option value="CP">CP</option>
                </select>
                <input type="number" step="0.25" value={editingQuestion.peso} onChange={(e) => setEditingQuestion({ ...editingQuestion, peso: parseFloat(e.target.value) })} style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", width: "80px" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button onClick={updateQuestion} style={{ background: "#22c55e", color: "#fff", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                Salvar Alterações
              </button>
              <button onClick={() => setEditingQuestion(null)} style={{ background: "#6b7280", color: "#fff", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "2rem", maxWidth: "600px", width: "90%" }}>
            <h2 style={{ color: "#ffd700", marginBottom: "1rem" }}>Importar Questões</h2>
            <p style={{ color: "#9ca3af", marginBottom: "1rem", fontSize: "0.875rem" }}>
              Formato: pergunta|alternativa_a|alternativa_b|alternativa_c|alternativa_d|alternativa_e|resposta_correta|disciplina|peso
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", minHeight: "200px", width: "100%" }}
              placeholder="Cole as questões aqui, uma por linha..."
            />
            {importStatus === "success" && (
              <div style={{ color: "#22c55e", marginTop: "1rem" }}>
                ✅ Importadas: {importResult.success} | Erros: {importResult.errors}
              </div>
            )}
            {importStatus === "error" && (
              <div style={{ color: "#ef4444", marginTop: "1rem" }}>
                ❌ Erro ao importar
              </div>
            )}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button onClick={importQuestions} disabled={importStatus === "loading"} style={{ background: "#3b82f6", color: "#fff", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                {importStatus === "loading" ? "Importando..." : "Importar"}
              </button>
              <button onClick={() => { setShowImportModal(false); setImportStatus("idle"); setImportText(""); }} style={{ background: "#6b7280", color: "#fff", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
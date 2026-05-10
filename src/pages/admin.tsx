import { useEffect, useState } from "react";
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

interface User {
  id: string;
  nome: string;
  email: string;
  aprovado: boolean;
  criado_em: string;
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
  const [results, setResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState<"questions" | "users" | "results">("questions");
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
  const [newStudent, setNewStudent] = useState({ nome: "", email: "" });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: q } = await supabase.from("questao").select("*");
    if (q) setQuestions(q as any);

    const { data: u } = await supabase.from("usuario").select("*").order("criado_em", { ascending: false });
    if (u) setUsers(u as any);

    const { data: r } = await supabase.from("resultado").select("*").order("criado_em", { ascending: false });
    if (r) setResults(r as any);

    setLoading(false);
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
      peso: parseFloat(newQuestion.peso)
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
      peso: "1.0"
    });
  }

  async function deleteQuestion(id: string) {
    if (confirm("Excluir questão?")) {
      await supabase.from("questao").delete().eq("id", id);
      setQuestions(questions.filter(q => q.id !== id));
    }
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

  async function rejectUser(id: string) {
    if (confirm("Excluir usuário?")) {
      await supabase.from("usuario").delete().eq("id", id);
      setUsers(users.filter(u => u.id !== id));
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
      criado_em: new Date().toISOString()
    };
    await supabase.from("usuario").insert([student]);
    setUsers([student, ...users]);
    alert("Aluno criado! Agora ele precisa ser autorizado.");
    setNewStudent({ nome: "", email: "" });
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
          onKeyDown={(e) => { if (e.key === "Enter") { if (adminPassword === "admin123") setIsAuthorized(true); else alert("Senha incorreta!"); }}}
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

  const approvedUsers = users.filter(u => u.aprovado).length;
  const pendingUsers = users.filter(u => !u.aprovado).length;
  const avgPF = results.length > 0 ? (results.reduce((acc, r) => acc + r.pf, 0) / results.length).toFixed(2) : "0.00";

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
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>QUESTÕES</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>{questions.length}</div>
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
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button onClick={() => setActiveTab("questions")} style={{ padding: "12px 24px", background: activeTab === "questions" ? "#ffd700" : "#1a1a1a", color: activeTab === "questions" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          QUESTÕES ({questions.length})
        </button>
        <button onClick={() => setActiveTab("users")} style={{ padding: "12px 24px", background: activeTab === "users" ? "#ffd700" : "#1a1a1a", color: activeTab === "users" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          ALUNOS ({users.length})
        </button>
        <button onClick={() => setActiveTab("results")} style={{ padding: "12px 24px", background: activeTab === "results" ? "#ffd700" : "#1a1a1a", color: activeTab === "results" ? "#000" : "#fff", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          RESULTADOS ({results.length})
        </button>
      </div>

      {/* TAB QUESTÕES */}
      {activeTab === "questions" && (
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
                <button onClick={addQuestion} style={{ background: "#ffd700", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                  Adicionar
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
                    <button onClick={() => deleteQuestion(q.id)} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                      Excluir
                    </button>
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
                <button onClick={createStudent} style={{ background: "#22c55e", color: "#fff", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                  CRIAR ALUNO
                </button>
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
                  <p style={{ marginBottom: "0.5rem", color: "#9ca3af" }}>{u.email}</p>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {!u.aprovado && (
                      <button onClick={() => approveUser(u.id)} style={{ background: "#22c55e", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                        AUTORIZAR
                      </button>
                    )}
                    <button onClick={() => rejectUser(u.id)} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
    </div>
  );
}
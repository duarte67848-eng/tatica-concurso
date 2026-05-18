import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { User, HIERARQUIA, tempoCadastro } from "../../lib/adminTypes";
import { c, card, btnGold, btnGreen, btnRed } from "../../styles/admin";

export default function UsersTab({ users, setUsers, blockedUsers, setBlockedUsers }: {
  users: User[]; setUsers: (u: User[]) => void;
  blockedUsers: User[]; setBlockedUsers: (u: User[]) => void;
}) {
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ nome: "", email: "", patente: "" });

  async function updateDirecionamento(userId: string, text: string) {
    const { error } = await supabase.from("usuario").update({ direcionamento: text }).eq("id", userId);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    setUsers(users.map(u => u.id === userId ? { ...u, direcionamento: text } : u));
  }

  async function approveUser(id: string) {
    const { error } = await supabase.from("usuario").update({ aprovado: true }).eq("id", id);
    if (error) { alert("Erro ao autorizar: " + error.message); return; }
    const user = blockedUsers.find(u => u.id === id);
    if (user) { setUsers([{ ...user, aprovado: true }, ...users]); setBlockedUsers(blockedUsers.filter(u => u.id !== id)); }
    alert("Aluno autorizado com sucesso!");
  }

  async function blockUser(id: string) {
    const userToBlock = users.find(u => u.id === id);
    if (!userToBlock) { alert("Usuário não encontrado!"); return; }
    if (confirm("Bloquear " + userToBlock.email + "? Ele não poderá mais fazer login.")) {
      const { error } = await supabase.from("usuario").update({ aprovado: false }).eq("id", id);
      if (error) { alert("❌ Erro: " + error.message); return; }
      setUsers(users.filter(u => u.id !== id));
      setBlockedUsers([{ ...userToBlock, aprovado: false }, ...blockedUsers]);
      alert("✅ " + userToBlock.email + " foi BLOQUEADO!");
    }
  }

  async function unblockUser(id: string) {
    const userToUnblock = blockedUsers.find(u => u.id === id);
    if (!userToUnblock) { alert("Usuário não encontrado!"); return; }
    if (confirm("Desbloquear " + userToUnblock.email + "? Ele poderá fazer login novamente.")) {
      const { error } = await supabase.from("usuario").update({ aprovado: true }).eq("id", id);
      if (error) { alert("❌ Erro: " + error.message); return; }
      setBlockedUsers(blockedUsers.filter(u => u.id !== id));
      setUsers([{ ...userToUnblock, aprovado: true }, ...users]);
      alert("✅ " + userToUnblock.email + " foi DESBLOQUEADO!");
    }
  }

  async function deleteUser(id: string) {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete || !confirm("EXCLUIR " + userToDelete.email + " COMPLETAMENTE? Esta ação não pode ser desfeita!")) return;
    const res = await fetch("/api/delete-user?id=" + encodeURIComponent(id), { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert("❌ Erro ao excluir: " + (data.error || "Erro desconhecido"));
      return;
    }
    setUsers(users.filter(u => u.id !== id));
    setBlockedUsers(blockedUsers.filter(u => u.id !== id));
    alert("✅ " + userToDelete.email + " foi EXCLUÍDO permanentemente!");
  }

  async function createStudent() {
    if (!newStudent.nome || !newStudent.email) { alert("Preencha nome e email!"); return; }
    const student: User = {
      id: Date.now().toString(), nome: newStudent.nome, email: newStudent.email,
      aprovado: false, criado_em: new Date().toISOString(), patente: newStudent.patente || "Aluno Soldado"
    };
    await supabase.from("usuario").insert([student]);
    setBlockedUsers([student, ...blockedUsers]);
    alert("Aluno criado! Agora ele precisa ser autorizado.");
    setNewStudent({ nome: "", email: "", patente: "" });
    setShowStudentForm(false);
  }

  const inputStyle = { background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px" };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <button onClick={() => setShowStudentForm(!showStudentForm)} style={btnGold()}>
          {showStudentForm ? "CANCELAR" : "+ CRIAR ALUNO"}
        </button>
      </div>

      {showStudentForm && (
        <div style={{ ...card(), marginBottom: "2rem" }}>
          <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Novo Aluno</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            <input type="text" placeholder="Nome do aluno" value={newStudent.nome}
              onChange={(e) => setNewStudent({ ...newStudent, nome: e.target.value })} style={inputStyle} />
            <input type="email" placeholder="Email do aluno" value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} style={inputStyle} />
            <select value={newStudent.patente} onChange={(e) => setNewStudent({ ...newStudent, patente: e.target.value })} style={inputStyle}>
              <option value="">Selecione a patente</option>
              {HIERARQUIA.map(h => <option key={h.valor} value={h.valor}>{h.valor}</option>)}
            </select>
            <button onClick={createStudent} style={btnGreen()}>CRIAR ALUNO</button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.gold, marginBottom: "1rem" }}>Alunos ({users.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: c.textSecondary }}>Nenhum aluno cadastrado</div>
        ) : (
          users.map((u) => (
            <div key={u.id} style={{ ...card() }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: c.text, fontWeight: "bold" }}>{u.nome}</span>
                <span style={{ color: u.aprovado ? c.green : c.red, fontWeight: "bold" }}>{u.aprovado ? "ATIVO" : "PENDENTE"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: c.textSecondary }}>{u.email}</span>
                <span style={{ display: "flex", gap: "1rem" }}>
                  <span style={{ color: c.blue, fontSize: "0.875rem" }}>📅 {tempoCadastro(u.criado_em)}</span>
                  <span style={{ color: c.gold, fontSize: "0.875rem", fontWeight: "bold" }}>{u.patente || "Aluno Soldado"}</span>
                </span>
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <input id={"dir-" + u.id} type="text" placeholder="Direcionamento para aluno..."
                  defaultValue={u.direcionamento ?? ""}
                  style={{ flex: 1, background: c.background, color: c.text, padding: "8px", border: `1px solid ${c.border}`, borderRadius: "4px" }} />
                <button onClick={() => {
                  const input = document.getElementById("dir-" + u.id) as HTMLInputElement;
                  if (input) updateDirecionamento(u.id, input.value);
                }} style={btnGold()}>ENVIAR</button>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                {!u.aprovado && <button onClick={() => approveUser(u.id)} style={btnGreen()}>AUTORIZAR</button>}
                {u.aprovado && <button onClick={() => blockUser(u.id)} style={btnRed()}>BLOQUEAR</button>}
                {u.aprovado && <button onClick={() => deleteUser(u.id)} style={{ ...btnRed(), background: "#dc2626" }}>EXCLUIR</button>}
              </div>
            </div>
          ))
        )}
      </div>

      {blockedUsers.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: c.red, marginTop: "2rem", marginBottom: "1rem" }}>
            Alunos Bloqueados ({blockedUsers.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {blockedUsers.map((u) => (
              <div key={u.id} style={{ background: `linear-gradient(180deg, ${c.backgroundSecondary} 0%, ${c.background} 100%)`, border: `1px solid ${c.red}`, borderRadius: "8px", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: c.text, fontWeight: "bold" }}>{u.nome}</span>
                  <span style={{ color: c.red, fontWeight: "bold" }}>BLOQUEADO</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: c.textSecondary }}>{u.email}</span>
                  <span style={{ display: "flex", gap: "1rem" }}>
                    <span style={{ color: c.blue, fontSize: "0.875rem" }}>📅 {tempoCadastro(u.criado_em)}</span>
                    <span style={{ color: c.gold, fontSize: "0.875rem", fontWeight: "bold" }}>{u.patente || "Aluno Soldado"}</span>
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => unblockUser(u.id)} style={btnGreen()}>DESBLOQUEAR</button>
                  <button onClick={() => deleteUser(u.id)} style={btnRed()}>EXCLUIR</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

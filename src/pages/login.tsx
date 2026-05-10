"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Preencha email e senha");
      return;
    }

    // Qualquer usuário pode logar se tiver conta
    const user = { email, name: email.split("@")[0] };
    window.sessionStorage.setItem("tatica_user", JSON.stringify(user));
    router.push("/dashboard");
  }

  function handleSignUp() {
    if (!email || !password) {
      setError("Preencha email e senha");
      return;
    }

    if (password.length < 4) {
      setError("Senha deve ter pelo menos 4 caracteres");
      return;
    }

    // Criar novo usuário - aprovação automática por enquanto
    const newUser = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email: email,
      approved: true, // Auto approved por enquanto
      created_at: new Date().toISOString()
    };
    
    // Salvar localmente (simulação - não funciona entre navegadores)
    // Nota: Para funcionar entre usuários, precisa de banco de dados
    localStorage.setItem("tatica_last_user", JSON.stringify(newUser));
    
    alert("Conta criada com sucesso! Você já pode fazer login.");
    setError("");
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "2rem", width: "100%", maxWidth: "28rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#ffd700", textAlign: "center", marginBottom: "2rem" }}>
          ACESSO MILITAR
        </h1>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", color: "#9ca3af", marginBottom: "0.5rem", fontSize: "0.875rem" }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", width: "100%" }}
              placeholder="seu.email@exemplo.com"
            />
          </div>
          
          <div>
            <label style={{ display: "block", color: "#9ca3af", marginBottom: "0.5rem", fontSize: "0.875rem" }}>SENHA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ background: "#0d0d0d", border: "1px solid #333", color: "#fff", padding: "12px", borderRadius: "4px", width: "100%" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.875rem", textAlign: "center", padding: "0.5rem", border: "1px solid #ef4444", borderRadius: "4px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{ background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
          >
            ENTRAR
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <button
            onClick={handleSignUp}
            style={{ background: "none", border: "none", color: "#ffd700", cursor: "pointer", fontSize: "0.875rem" }}
          >
            CRIAR NOVA CONTA
          </button>
        </div>
      </div>
    </div>
  );
}
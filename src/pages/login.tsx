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

    // Verificar usuário cadastrado - agora exige registro primeiro
    const savedUsers = localStorage.getItem("tatica_users");
    let users = savedUsers ? JSON.parse(savedUsers) : [];
    
    // Se não tiver ninguém cadastrado, nadie pode logar
    if (users.length === 0) {
      setError("Nenhum usuário cadastrado. Crie sua conta primeiro.");
      return;
    }

    const foundUser = users.find((u: any) => u.email === email);
    
    if (!foundUser) {
      setError("Usuário não cadastrado. Crie sua conta primeiro.");
      return;
    }

    if (!foundUser.approved) {
      setError("Aguarde aprovação do administrador!");
      return;
    }

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

    // Verificar se já existe
    const savedUsers = localStorage.getItem("tatica_users");
    let users = savedUsers ? JSON.parse(savedUsers) : [];
    
    if (users.find((u: any) => u.email === email)) {
      setError("Usuário já cadastrado! Aguarde aprovação.");
      return;
    }

    // Criar novo usuário pendente
    const newUser = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email: email,
      approved: false,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem("tatica_users", JSON.stringify(users));
    
    setError("Cadastro realizado! Aguarde aprovação do administrador.");
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
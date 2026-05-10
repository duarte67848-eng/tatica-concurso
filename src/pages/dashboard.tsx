"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

interface Result {
  id: number;
  email_usuario: string;
  nome_usuario: string;
  acertos: number;
  erros: number;
  pf: number;
  total_questoes: number;
  criado_em: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const userData = window.sessionStorage.getItem("tatica_user");
    if (!userData) {
      router.push("/login");
    } else {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      loadResults(userObj.email);
    }
  }, [router]);

  async function loadResults(email: string) {
    const { data } = await supabase
      .from("resultado")
      .select("*")
      .eq("email_usuario", email)
      .order("criado_em", { ascending: false });
    
    if (data) setResults(data as any);
    setLoading(false);
  }

  const totalSimulados = results.length;
  const melhorPF = results.length > 0 ? Math.max(...results.map(r => r.pf)) : 0;
  const mediaPF = results.length > 0 ? (results.reduce((acc, r) => acc + r.pf, 0) / results.length) : 0;

  function handleLogout() {
    window.sessionStorage.removeItem("tatica_user");
    router.push("/login");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: "#ffd700", fontSize: "1.25rem" }}>CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#ffd700", marginBottom: "2rem" }}>
        DASHBOARD OPERACIONAL
      </h1>

      {user && (
        <div style={{ marginBottom: "2rem", padding: "1rem", background: "#1a1a1a", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ color: "#9ca3af" }}>Bem-vindo, </span>
            <span style={{ color: "#ffd700", fontWeight: "bold" }}>{user.name}</span>
          </div>
          <button onClick={handleLogout} style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
            SAIR
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>TOTAL SIMULADOS</div>
          <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#ffd700" }}>{totalSimulados}</div>
        </div>
        
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>MELHOR PF</div>
          <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#22c55e" }}>{melhorPF.toFixed(2)}</div>
        </div>
        
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>MÉDIA PF</div>
          <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#3b82f6" }}>{mediaPF.toFixed(2)}</div>
        </div>
        
        <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>ÚLTIMO ACESSO</div>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>{results.length > 0 ? new Date(results[0].criado_em).toLocaleDateString() : "-"}</div>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>INICIAR NOVO SIMULADO</h2>
        <Link href="/simulado">
          <button style={{ background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)", color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px", fontSize: "1.125rem" }}>
            INICIAR SIMULADO AGORA
          </button>
        </Link>
      </div>

      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffd700", marginBottom: "1rem" }}>MEU HISTÓRICO DE RESULTADOS</h2>
        
        {results.length === 0 ? (
          <div style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
            Nenhum simulado realizado ainda. Inicie seu primeiro simulado!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {results.map((r) => (
              <div key={r.id} style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", border: "1px solid #333", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                    {new Date(r.criado_em).toLocaleString()}
                  </span>
                  <span style={{ color: "#ffd700", fontWeight: "bold", fontSize: "1.5rem" }}>
                    PF: {r.pf.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "2rem", color: "#d1d5db" }}>
                  <span>✅ Acertos: <strong style={{ color: "#22c55e" }}>{r.acertos}</strong></span>
                  <span>❌ Erros: <strong style={{ color: "#ef4444" }}>{r.erros}</strong></span>
                  <span>📝 Questões: <strong>{r.total_questoes}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
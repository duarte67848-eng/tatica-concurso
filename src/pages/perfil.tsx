"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const LEVELS = [
  { name: "Recruta", minPF: 0, maxPF: 2, icon: "🌱", color: "#6b7280" },
  { name: "Soldado", minPF: 2.01, maxPF: 3.5, icon: "⭐", color: "#22c55e" },
  { name: "Cabo", minPF: 3.51, maxPF: 4.5, icon: "⭐⭐", color: "#3b82f6" },
  { name: "Sargento", minPF: 4.51, maxPF: 5.5, icon: "⭐⭐⭐", color: "#8b5cf6" },
  { name: "Subtenente", minPF: 5.51, maxPF: 6.5, icon: "🔷", color: "#f59e0b" },
  { name: "Tenente", minPF: 6.51, maxPF: 7.5, icon: "💎", color: "#ef4444" },
  { name: "Capitão", minPF: 7.51, maxPF: 8.5, icon: "👑", color: "#ffd700" },
  { name: "Major", minPF: 8.51, maxPF: 9.5, icon: "🏆", color: "#ff8c00" },
  { name: "Coronel", minPF: 9.51, maxPF: 10, icon: "⚜️", color: "#dc2626" },
];

const MEDALS = [
  { id: "primeiro", name: "Primeiro Passo", icon: "🎯", condition: "1 simulado" },
  { id: "dez", name: "Veterano", icon: "🏅", condition: "10 simulados" },
  { id: "pf5", name: "Aprovado", icon: "✅", condition: "PF > 5" },
  { id: "pf7", name: "Destaque", icon: "🌟", condition: "PF > 7" },
  { id: "pf9", name: "Lenda", icon: "🔥", condition: "PF > 9" },
];

export default function Perfil({ colors }: { colors?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  const c = colors || {
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
    red: "#ef4444",
    green: "#22c55e",
    blue: "#3b82f6",
    purple: "#a855f7"
  };

  useEffect(() => {
    const userData = window.sessionStorage.getItem("tatica_user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const userObj = JSON.parse(userData);
    loadResults(userObj.email);
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

  function getLevel(pf: number) {
    return LEVELS.find(l => pf >= l.minPF && pf <= l.maxPF) || LEVELS[0];
  }

  function getProgress(pf: number) {
    const current = getLevel(pf);
    const idx = LEVELS.findIndex(l => l.name === current.name);
    if (idx === LEVELS.length - 1) return { current, next: null, percent: 100 };
    const next = LEVELS[idx + 1];
    const percent = ((pf - current.minPF) / (next.minPF - current.minPF)) * 100;
    return { current, next, percent: Math.min(100, Math.max(0, percent)) };
  }

  function getUnlockedMedals() {
    const melhorPF = results.length > 0 ? Math.max(...results.map(r => r.pf)) : 0;
    return MEDALS.map(m => {
      let unlocked = false;
      if (results.length >= 1 && m.id === "primeiro") unlocked = true;
      if (results.length >= 10 && m.id === "dez") unlocked = true;
      if (melhorPF > 5 && m.id === "pf5") unlocked = true;
      if (melhorPF > 7 && m.id === "pf7") unlocked = true;
      if (melhorPF > 9 && m.id === "pf9") unlocked = true;
      return { ...m, unlocked };
    });
  }

  function handleLogout() {
    window.sessionStorage.removeItem("tatica_user");
    router.push("/login");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div style={{ color: c.gold, fontSize: "1.25rem" }}>Carregando...</div>
      </div>
    );
  }

  const melhorPF = results.length > 0 ? Math.max(...results.map(r => r.pf)) : 0;
  const { current, next, percent } = getProgress(melhorPF);
  const medals = getUnlockedMedals();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: c.gold }}>
          Perfil Militar
        </h1>
        <button onClick={handleLogout} style={{ background: c.red, color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
          Sair
        </button>
      </div>

      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "4rem" }}>{current?.icon}</div>
        <div style={{ color: current?.color, fontSize: "2rem", fontWeight: "bold" }}>{current?.name}</div>
        
        {next && (
          <>
            <div style={{ marginTop: "1rem", color: c.textSecondary }}>
              Progresso para {next.name}
            </div>
            <div style={{ height: "12px", background: c.backgroundTertiary, borderRadius: "6px", marginTop: "0.5rem" }}>
              <div style={{ width: `${percent}%`, height: "100%", background: current?.color, borderRadius: "6px" }} />
            </div>
            <div style={{ color: c.textSecondary, marginTop: "0.5rem" }}>
              PF: {melhorPF.toFixed(2)} → Próximo: {next.minPF}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>SIMULADOS</div>
          <div style={{ color: c.gold, fontSize: "1.5rem" }}>{results.length}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>MELHOR PF</div>
          <div style={{ color: c.green, fontSize: "1.5rem" }}>{melhorPF.toFixed(2)}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>ACERTOS</div>
          <div style={{ color: c.blue, fontSize: "1.5rem" }}>{results.reduce((a, b) => a + b.acertos, 0)}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>MEDALHAS</div>
          <div style={{ color: c.purple, fontSize: "1.5rem" }}>{medals.filter(m => m.unlocked).length}/{MEDALS.length}</div>
        </div>
      </div>

      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
        <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Conquistas</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "1rem" }}>
          {medals.map(m => (
            <div key={m.id} style={{
              textAlign: "center",
              padding: "0.75rem",
              background: m.unlocked ? `${c.gold}20` : c.backgroundTertiary,
              borderRadius: "8px",
              opacity: m.unlocked ? 1 : 0.5
            }}>
              <div style={{ fontSize: "2rem" }}>{m.icon}</div>
              <div style={{ color: m.unlocked ? c.gold : c.textSecondary, fontWeight: "bold", fontSize: "0.75rem", marginTop: "0.25rem" }}>{m.name}</div>
              <div style={{ color: c.textSecondary, fontSize: "0.625rem" }}>{m.condition}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", marginTop: "1.5rem" }}>
        <h3 style={{ color: c.gold, marginBottom: "1rem" }}>Hierarquia</h3>
        {LEVELS.map(l => {
          const active = melhorPF >= l.minPF;
          return (
            <div key={l.name} style={{
              display: "flex",
              alignItems: "center",
              padding: "0.5rem",
              background: active ? `${l.color}20` : "transparent",
              borderRadius: "4px",
              marginBottom: "0.25rem"
            }}>
              <span style={{ fontSize: "1.25rem", marginRight: "0.5rem", opacity: active ? 1 : 0.3 }}>{l.icon}</span>
              <span style={{ color: active ? l.color : c.textSecondary, flex: 1 }}>{l.name}</span>
              <span style={{ color: c.textSecondary, fontSize: "0.75rem" }}>PF {l.minPF}-{l.maxPF}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
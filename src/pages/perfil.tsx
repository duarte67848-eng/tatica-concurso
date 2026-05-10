// Sistema Tático Militar - Perfil
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

interface Level {
  name: string;
  minPF: number;
  maxPF: number;
  icon: string;
  color: string;
  description: string;
}

interface Medal {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  unlocked: boolean;
}

interface UsuarioProgresso {
  id?: number;
  usuario_email: string;
  nivel_atual: string;
  pontos_experiencia: number;
  medalhas: string[];
  simulados_completados: number;
  melhor_pf: number;
  total_acertos: number;
  total_erros: number;
  Created_at?: string;
}

interface PerfilMilitarProps {
  colors?: any;
  isDark?: boolean;
  toggleTheme?: () => void;
}

const LEVELS: Level[] = [
  { name: "Recruta", minPF: 0, maxPF: 2, icon: "🌱", color: "#6b7280", description: "Iniciante na jornada" },
  { name: "Soldado", minPF: 2.01, maxPF: 3.5, icon: "⭐", color: "#22c55e", description: "Primeiros passos" },
  { name: "Cabo", minPF: 3.51, maxPF: 4.5, icon: "⭐⭐", color: "#3b82f6", description: "Experiente" },
  { name: "Sargento", minPF: 4.51, maxPF: 5.5, icon: "⭐⭐⭐", color: "#8b5cf6", description: "Veterano" },
  { name: "Subtenente", minPF: 5.51, maxPF: 6.5, icon: "🔷", color: "#f59e0b", description: "Elite em formação" },
  { name: "Tenente", minPF: 6.51, maxPF: 7.5, icon: "💎", color: "#ef4444", description: "Operador experiente" },
  { name: "Capitão", minPF: 7.51, maxPF: 8.5, icon: "👑", color: "#ffd700", description: "Líder operacional" },
  { name: "Major", minPF: 8.51, maxPF: 9.5, icon: "🏆", color: "#ff8c00", description: "Comandante" },
  { name: "Coronel", minPF: 9.51, maxPF: 10, icon: "⚜️", color: "#dc2626", description: "Lenda militar" },
];

const MEDALS: Omit<Medal, "unlocked">[] = [
  { id: "primeiro_simulado", name: "Primeiro Passo", icon: "🎯", description: "Completar primeiro simulado", condition: "1 simulado" },
  { id: "dez_simulados", name: "Veterano", icon: "🏅", description: "Completar 10 simulados", condition: "10 simulados" },
  { id: "cinquenta_simulados", name: "Operador Elite", icon: "🎖️", description: "Completar 50 simulados", condition: "50 simulados" },
  { id: "pf_maior_5", name: "Aprovado", icon: "✅", description: "Ter PF maior que 5", condition: "PF > 5" },
  { id: "pf_maior_7", name: "Destaque", icon: "🌟", description: "Ter PF maior que 7", condition: "PF > 7" },
  { id: "pf_maior_9", name: "Lenda", icon: "🔥", description: "Ter PF maior que 9", condition: "PF > 9" },
  { id: "acertos_100", name: "Perfeito", icon: "💯", description: "100% de acertos em um simulado", condition: "100% acerto" },
  { id: "clpap_mestre", name: "Mestre CLPAP", icon: "📚", description: "Acertar 100% em CLPAP", condition: "100% CLPAP" },
  { id: "cpjm_mestre", name: "Mestre CPJM", icon: "⚖️", description: "Acertar 100% em CPJM", condition: "100% CPJM" },
  { id: "clipm_mestre", name: "Mestre CLIPM", icon: "📜", description: "Acertar 100% em CLIPM", condition: "100% CLIPM" },
  { id: "cp_mestre", name: "Mestre CP", icon: "🎓", description: "Acertar 100% em CP", condition: "100% CP" },
  { id: "semana_streak", name: "Consistente", icon: "📅", description: "Simular por 7 dias consecutivos", condition: "7 dias" },
];

export default function PerfilMilitar({ colors }: PerfilMilitarProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progresso, setProgresso] = useState<UsuarioProgresso | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const c = colors || {
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
    goldHover: "#b8860b",
    green: "#22c55e",
    red: "#ef4444",
    blue: "#3b82f6",
    purple: "#a855f7"
  };

  useEffect(() => {
    const userData = window.sessionStorage.getItem("tatica_user");
    if (!userData) {
      router.push("/login");
    } else {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      loadProgresso(userObj.email);
    }
  }, [router]);

  async function loadProgresso(email: string) {
    const { data: p } = await supabase
      .from("progresso_usuario")
      .select("*")
      .eq("usuario_email", email)
      .single();
    
    if (p) {
      setProgresso(p as any);
    } else {
      const novoProgresso = {
        usuario_email: email,
        nivel_atual: "Recruta",
        pontos_experiencia: 0,
        medalhas: [] as string[],
        simulados_completados: 0,
        melhor_pf: 0,
        total_acertos: 0,
        total_erros: 0
      };
      await supabase.from("progresso_usuario").insert([novoProgresso]);
      setProgresso(novoProgresso as any);
    }

    const { data: r } = await supabase
      .from("resultado")
      .select("*")
      .eq("email_usuario", email)
      .order("criado_em", { ascending: false });
    
    if (r) setResults(r as any);
    setLoading(false);
  }

  function getCurrentLevel(pf: number): Level {
    return LEVELS.find(l => pf >= l.minPF && pf <= l.maxPF) || LEVELS[0];
  }

  function getProgressToNextLevel(pf: number): { current: Level | null; next: Level | null; progress: number } {
    const current = getCurrentLevel(pf);
    const currentIndex = LEVELS.findIndex(l => l.name === current.name);
    
    if (currentIndex === LEVELS.length - 1) {
      return { current, next: null, progress: 100 };
    }
    
    const next = LEVELS[currentIndex + 1];
    const range = next.minPF - current.minPF;
    const progress = ((pf - current.minPF) / range) * 100;
    
    return { current, next, progress: Math.min(100, Math.max(0, progress)) };
  }

  function checkMedals() {
    const medals: Medal[] = MEDALS.map(m => {
      let unlocked = false;
      
      if (progresso?.simulados_completados >= 1 && m.id === "primeiro_simulado") unlocked = true;
      if (progresso?.simulados_completados >= 10 && m.id === "dez_simulados") unlocked = true;
      if (progresso?.simulados_completados >= 50 && m.id === "cinquenta_simulados") unlocked = true;
      if (progresso?.melhor_pf > 5 && m.id === "pf_maior_5") unlocked = true;
      if (progresso?.melhor_pf > 7 && m.id === "pf_maior_7") unlocked = true;
      if (progresso?.melhor_pf > 9 && m.id === "pf_maior_9") unlocked = true;
      
      return { ...m, unlocked };
    });
    
    return medals;
  }

  function handleLogout() {
    window.sessionStorage.removeItem("tatica_user");
    router.push("/login");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ color: c.gold, fontSize: "1.25rem" }}>CARREGANDO PERFIL...</div>
      </div>
    );
  }

  const melhorPF = results.length > 0 ? Math.max(...results.map(r => r.pf)) : 0;
  const { current, next, progress } = getProgressToNextLevel(melhorPF);
  const medals = checkMedals();
  const unlockedMedals = medals.filter(m => m.unlocked);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: c.gold }}>
          🎖️ PERFIL MILITAR
        </h1>
        <button onClick={handleLogout} style={{ background: c.red, color: "#fff", padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
          SAIR
        </button>
      </div>

      {/* Card Principal do Nível */}
      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>{current?.icon}</div>
        <div style={{ color: current?.color, fontSize: "2rem", fontWeight: "bold" }}>{current?.name}</div>
        <div style={{ color: c.textSecondary, marginBottom: "1rem" }}>{current?.description}</div>
        
        {next && (
          <>
            <div style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: c.textSecondary }}>Progresso para </span>
              <span style={{ color: next.color, fontWeight: "bold" }}>{next.name}</span>
            </div>
            <div style={{ height: "12px", background: c.backgroundTertiary, borderRadius: "6px", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: current?.color, borderRadius: "6px", transition: "width 0.3s" }} />
            </div>
            <div style={{ color: c.textSecondary, fontSize: "0.875rem" }}>
              PF atual: {melhorPF.toFixed(2)} → Próximo nível: {next.minPF}
            </div>
          </>
        )}
      </div>

      {/* Estatísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>SIMULADOS</div>
          <div style={{ color: c.gold, fontSize: "1.5rem", fontWeight: "bold" }}>{results.length}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>MELHOR PF</div>
          <div style={{ color: c.green, fontSize: "1.5rem", fontWeight: "bold" }}>{melhorPF.toFixed(2)}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>ACERTOS</div>
          <div style={{ color: c.blue, fontSize: "1.5rem", fontWeight: "bold" }}>{results.reduce((a, b) => a + b.acertos, 0)}</div>
        </div>
        <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ color: c.textSecondary, fontSize: "0.75rem" }}>MEDALHAS</div>
          <div style={{ color: c.purple, fontSize: "1.5rem", fontWeight: "bold" }}>{unlockedMedals.length}/{MEDALS.length}</div>
        </div>
      </div>

      {/* Medalhas */}
      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem" }}>
        <h3 style={{ color: c.gold, marginBottom: "1rem" }}>🏅 Conquistas</h3>
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

      {/* Hierarquia Militar */}
      <div style={{ background: c.backgroundSecondary, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "1.5rem", marginTop: "1.5rem" }}>
        <h3 style={{ color: c.gold, marginBottom: "1rem" }}>⚔️ Hierarquia Militar</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {LEVELS.map((l, i) => {
            const isCurrentOrPast = melhorPF >= l.minPF;
            return (
              <div key={l.name} style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "0.5rem",
                background: isCurrentOrPast ? `${l.color}20` : "transparent",
                borderRadius: "4px"
              }}>
                <span style={{ fontSize: "1.5rem", marginRight: "0.75rem", opacity: isCurrentOrPast ? 1 : 0.3 }}>{l.icon}</span>
                <span style={{ color: isCurrentOrPast ? l.color : c.textSecondary, fontWeight: isCurrentOrPast ? "bold" : "normal", flex: 1 }}>{l.name}</span>
                <span style={{ color: c.textSecondary, fontSize: "0.75rem" }}>PF {l.minPF} - {l.maxPF}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
import "../styles/globals.css";
import { useState, useEffect } from "react";
import type { AppProps } from "next/app";

export function formatDateTime(date: Date | string): { data: string; hora: string } {
  const d = typeof date === "string" ? new Date(date) : date;
  const timezone = "America/Cuiaba";
  
  const formatterData = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  const formatterHora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  
  return {
    data: formatterData.format(d),
    hora: formatterHora.format(d)
  };
}

export function getCurrentDateTimeCuiaba(): { data: string; hora: string; completo: string } {
  const now = new Date();
  const timezone = "America/Cuiaba";
  
  const formatterData = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  const formatterHora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  
  const data = formatterData.format(now);
  const hora = formatterHora.format(now);
  
  return {
    data,
    hora,
    completo: `${data} ${hora}`
  };
}

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  const [colors, setColors] = useState({
    background: "#0d0d0d",
    backgroundSecondary: "#1a1a1a",
    backgroundTertiary: "#252525",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    gold: "#ffd700",
    goldHover: "#ffed4a",
    green: "#22c55e",
    red: "#ef4444",
    blue: "#3b82f6",
    purple: "#a855f7"
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("tatica-theme");
    const dark = savedTheme === null ? true : savedTheme === "dark";
    setIsDark(dark);
    setColors(dark ? {
      background: "#0d0d0d",
      backgroundSecondary: "#1a1a1a",
      backgroundTertiary: "#252525",
      text: "#ffffff",
      textSecondary: "#a0a0a0",
      border: "#333333",
      gold: "#ffd700",
      goldHover: "#ffed4a",
      green: "#22c55e",
      red: "#ef4444",
      blue: "#3b82f6",
      purple: "#a855f7"
    } : {
      background: "#ffffff",
      backgroundSecondary: "#f5f5f5",
      backgroundTertiary: "#e8e8e8",
      text: "#1a1a1a",
      textSecondary: "#555555",
      border: "#cccccc",
      gold: "#b8860b",
      goldHover: "#daa520",
      green: "#16a34a",
      red: "#dc2626",
      blue: "#2563eb",
      purple: "#9333ea"
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("tatica-theme", newTheme ? "dark" : "light");
    setColors(newTheme ? {
      background: "#0d0d0d",
      backgroundSecondary: "#1a1a1a",
      backgroundTertiary: "#252525",
      text: "#ffffff",
      textSecondary: "#a0a0a0",
      border: "#333333",
      gold: "#ffd700",
      goldHover: "#ffed4a",
      green: "#22c55e",
      red: "#ef4444",
      blue: "#3b82f6",
      purple: "#a855f7"
    } : {
      background: "#ffffff",
      backgroundSecondary: "#f5f5f5",
      backgroundTertiary: "#e8e8e8",
      text: "#1a1a1a",
      textSecondary: "#555555",
      border: "#cccccc",
      gold: "#b8860b",
      goldHover: "#daa520",
      green: "#16a34a",
      red: "#dc2626",
      blue: "#2563eb",
      purple: "#9333ea"
    });
  };

  return { isDark, toggleTheme, colors };
}

export default function App({ Component, pageProps }: AppProps) {
  const { isDark, toggleTheme, colors } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      background: colors.background, 
      color: colors.text, 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      transition: "background 0.3s, color 0.3s"
    }}>
      <style>{`
        body { 
          background-color: ${colors.background};
          color: ${colors.text};
        }
        input, textarea, select {
          background-color: ${colors.background} !important;
          color: ${colors.text} !important;
          border-color: ${colors.border} !important;
        }
        a { color: ${colors.gold} !important; }
        .question-text { color: ${colors.text} !important; }
        .option-text { color: ${colors.text} !important; }
      `}</style>
      <header style={{ 
        background: colors.backgroundSecondary, 
        borderBottom: `1px solid ${colors.border}`, 
        padding: "1rem",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: colors.gold, letterSpacing: "2px" }}>
            TÁTICA CONCURSO
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ color: colors.textSecondary, fontSize: "0.75rem" }}>
              {getCurrentDateTimeCuiaba().completo}
            </div>
            <button 
              onClick={toggleTheme}
              style={{
                background: colors.backgroundTertiary,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              {isDark ? "☀️ Claro" : "🌙 Escuro"}
            </button>
            <nav style={{ display: "flex", gap: "1rem" }}>
              <a href="/dashboard" style={{ color: colors.gold, textDecoration: "none" }}>Dashboard</a>
              <a href="/simulado" style={{ color: colors.gold, textDecoration: "none" }}>Simulado</a>
              <a href="/exercicios" style={{ color: colors.gold, textDecoration: "none" }}>Exercícios</a>
              <a href="/revisao" style={{ color: colors.gold, textDecoration: "none" }}>Revisão</a>
              <a href="/biblioteca" style={{ color: colors.gold, textDecoration: "none" }}>📚 Biblioteca</a>
              <a href="/favoritos" style={{ color: colors.gold, textDecoration: "none" }}>⭐</a>
              <a href="/dificeis" style={{ color: colors.gold, textDecoration: "none" }}>🎯</a>
              <a href="/perfil" style={{ color: colors.gold, textDecoration: "none" }}>Perfil</a>
              <a href="/admin" style={{ color: colors.gold, textDecoration: "none" }}>Admin</a>
            </nav>
          </div>
        </div>
      </header>
      <main style={{ flex: 1, padding: "1rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <Component {...pageProps} colors={colors} isDark={isDark} toggleTheme={toggleTheme} />
      </main>
      <footer style={{ background: colors.backgroundSecondary, borderTop: `1px solid ${colors.border}`, padding: "1rem", textAlign: "center" }}>
        <p style={{ color: colors.textSecondary, fontSize: "0.875rem" }}>
          © 2026 TÁTICA CONCURSO - Sistema de Simulados Militares
        </p>
      </footer>
    </div>
  );
}
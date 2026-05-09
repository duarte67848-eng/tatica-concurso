import "../styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#000", color: "#fff", fontFamily: "'Courier New', monospace" }}>
      <header style={{ background: "#1a1a1a", borderBottom: "1px solid #b8860b", padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffd700", letterSpacing: "2px" }}>
            TÁTICA CONCURSO
          </h1>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <a href="/dashboard" style={{ color: "#ffd700", textDecoration: "none" }}>Dashboard</a>
            <a href="/simulado" style={{ color: "#ffd700", textDecoration: "none" }}>Simulado</a>
            <a href="/admin" style={{ color: "#ffd700", textDecoration: "none" }}>Admin</a>
          </nav>
        </div>
      </header>
      <main style={{ flex: 1, padding: "1rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <Component {...pageProps} />
      </main>
      <footer style={{ background: "#1a1a1a", borderTop: "1px solid #b8860b", padding: "1rem", textAlign: "center" }}>
        <p style={{ color: "#b8860b", fontSize: "0.875rem" }}>
          © 2024 TÁTICA CONCURSO - Sistema de Simulados Militares
        </p>
      </footer>
    </div>
  );
}
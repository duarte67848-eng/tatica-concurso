import { c } from "../../styles/admin";

export default function AdminLogin({ password, onPasswordChange, onLogin }: {
  password: string;
  onPasswordChange: (v: string) => void;
  onLogin: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "1rem" }}>
      <h1 style={{ color: c.gold, fontSize: "1.5rem" }}>ACESSO ADMINISTRATIVO</h1>
      <input
        type="password"
        placeholder="Senha do Admin"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onLogin(); }}
        style={{ background: c.background, border: `1px solid ${c.border}`, color: c.text, padding: "12px", borderRadius: "4px", width: "300px", textAlign: "center" }}
      />
      <button onClick={onLogin} style={{ background: c.gold, color: "#000", fontWeight: "bold", padding: "12px 24px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
        ENTRAR
      </button>
    </div>
  );
}

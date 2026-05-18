export const c = {
  background: "#0d0d0d",
  backgroundSecondary: "#1a1a1a",
  border: "#333333",
  text: "#ffffff",
  textSecondary: "#9ca3af",
  gold: "#ffd700",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7",
};

export function card() {
  return {
    background: `linear-gradient(180deg, ${c.backgroundSecondary} 0%, ${c.background} 100%)`,
    border: `1px solid ${c.border}`,
    borderRadius: "8px",
    padding: "1.5rem",
  };
}

export function input() {
  return {
    background: c.background,
    border: `1px solid ${c.border}`,
    color: c.text,
    padding: "12px",
    borderRadius: "4px",
  };
}

export function btnGold() {
  return {
    background: c.gold,
    color: "#000",
    fontWeight: "bold" as const,
    padding: "12px 24px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnBlue() {
  return {
    background: c.blue,
    color: "#fff",
    fontWeight: "bold" as const,
    padding: "12px 24px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnGreen() {
  return {
    background: c.green,
    color: "#fff",
    fontWeight: "bold" as const,
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnRed() {
  return {
    background: c.red,
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

export function btnGray() {
  return {
    background: "#6b7280",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };
}

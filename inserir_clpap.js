const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://rclqjbrwlnrphjerthhv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHFqYnJ3bG5ycGhqZXJ0aGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzUzODYsImV4cCI6MjA5Mzg1MTM4Nn0.hqMHqWMt4zMEAPmia-eEvFl1d-1K7c7WuC33dGRGUMs"
);

const text = fs.readFileSync("clpap_extra.txt", "utf8").replace(/\r/g, "");
const blocks = text.split(/\[QUESTÃO\s*(\d+)\]/);

let questoes = [];
for (let i = 1; i < blocks.length; i += 2) {
  const num = blocks[i];
  const content = blocks[i + 1];
  if (!content || !content.trim()) continue;

  const lines = content.split("\n").filter(l => l.trim());
  let pergunta = "", alt_a = "", alt_b = "", alt_c = "", alt_d = "", alt_e = "", resp = "";
  let collecting = false;

  for (const l of lines) {
    const t = l.trim();
    const gabMatch = t.match(/^GABARITO:\s*([A-E])/i);
    if (gabMatch) { resp = gabMatch[1].toUpperCase(); continue; }
    
    const am = t.match(/^([A-E])[.)]\s*(.*)/);
    if (am) {
      collecting = true;
      const txt = am[2];
      if (am[1] === "A") alt_a += (alt_a ? " " : "") + txt;
      else if (am[1] === "B") alt_b += (alt_b ? " " : "") + txt;
      else if (am[1] === "C") alt_c += (alt_c ? " " : "") + txt;
      else if (am[1] === "D") alt_d += (alt_d ? " " : "") + txt;
      else if (am[1] === "E") alt_e += (alt_e ? " " : "") + txt;
    } else if (!collecting) {
      pergunta += (pergunta ? " " : "") + t;
    }
  }

  questoes.push({ num, pergunta, alt_a, alt_b, alt_c, alt_d, alt_e, resp });
}

console.log("Total questões:", questoes.length);
console.log("Com gabarito:", questoes.filter(q => q.resp).length);
console.log("Sem gabarito:", questoes.filter(q => !q.resp).map(q => "Q" + q.num).join(", "));

(async () => {
  let ok = 0, err = 0;
  for (const q of questoes) {
    if (!q.resp) continue;
    const record = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      pergunta: q.pergunta.substring(0, 2000),
      alternativa_a: q.alt_a.substring(0, 1000),
      alternativa_b: q.alt_b.substring(0, 1000),
      alternativa_c: q.alt_c.substring(0, 1000),
      alternativa_d: q.alt_d.substring(0, 1000),
      alternativa_e: q.alt_e.substring(0, 1000),
      resposta_correta: q.resp,
      disciplina: "CLPAP",
      peso: 1,
      tipo: "exercicio"
    };
    const { error } = await supabase.from("questao").insert([record]);
    if (error) { console.log("Erro Q" + q.num + ":", error.message.substring(0, 60)); err++; }
    else ok++;
  }
  console.log("Inseridas:", ok, "| Erros:", err);
})();

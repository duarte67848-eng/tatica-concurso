const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://rclqjbrwlnrphjerthhv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHFqYnJ3bG5ycGhqZXJ0aGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzUzODYsImV4cCI6MjA5Mzg1MTM4Nn0.hqMHqWMt4zMEAPmia-eEvFl1d-1K7c7WuC33dGRGUMs"
);

const text = fs.readFileSync("questoes_exercicios.txt", "utf8").replace(/\r/g, "");
const lines = text.split("\n");

// Extract gabaritos
const gabarito = {};
for (const line of lines) {
  const t = line.trim();
  if (t.includes("|")) {
    for (const p of t.split("|")) {
      const m = p.match(/(\d+)\s*[-–—]\s*([A-E])/);
      if (m) gabarito[parseInt(m[1])] = m[2];
    }
  }
  const m1 = t.match(/^(\d+)\s*[-–—\.]\s*([A-E])\s*$/);
  if (m1) gabarito[parseInt(m1[1])] = m1[2];
  const m1b = t.match(/^(\d+)\s*[\.\)]\s+([A-E])\s*$/);
  if (m1b) gabarito[parseInt(m1b[1])] = m1b[2];
  const m2 = t.match(/resposta\s*correta:\s*([A-E])/i);
  if (m2) {
    for (let n = 300; n >= 1; n--) {
      if (t.includes("" + n)) { gabarito[n] = m2[1]; break; }
    }
  }
}

let questoes = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i].trim();
  let qNum = 0, qText = "", hasQuestaoHeader = false;

  // Pattern 1: "Questão X" or "### Questão X"
  const m1 = line.match(/^(?:###\s*)?(?:Questão|QUESTÃO)\s*(\d+)/i);
  if (m1) {
    qNum = parseInt(m1[1]);
    qText = line.replace(/^(?:###\s*)?(?:Questão|QUESTÃO)\s*\d+\s*[–\-—\s]*/i, "").trim();
    hasQuestaoHeader = true;
  }

  // Pattern 2: "X. Text" at line start with alternatives ahead
  if (!qNum) {
    const m2 = line.match(/^(\d{1,3})\.\s+(.+)/);
    if (m2) {
      const n = parseInt(m2[1]);
      if (n >= 1 && n <= 300) {
        let foundAlt = false;
        for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
          const nl = lines[j].trim();
          if (nl.match(/^[a-eA-E][.)]\s/)) { foundAlt = true; break; }
          if (nl.match(/^(?:Questão|QUESTÃO|###\s*Questão)/i)) break;
        }
        if (foundAlt) { qNum = n; qText = m2[2]; }
      }
    }
  }

  if (qNum) {
    let pergunta = qText;
    let alt_a = "", alt_b = "", alt_c = "", alt_d = "", alt_e = "";
    let collecting = false;
    i++;

    while (i < lines.length) {
      const cl = lines[i].trim();
      if (!cl) { i++; continue; }
      
      // New "Questão" header breaks
      if (cl.match(/^(?:###\s*)?(?:Questão|QUESTÃO)\s*\d+/i)) break;
      
      // "X. Text" - new question in sequence
      if (cl.match(/^\d{1,3}\.\s+[A-Z]/)) {
        const n = parseInt(cl);
        if (n === qNum + 1) { break; }
        if (n > qNum + 1 && n <= 300) {
          let altCount = 0;
          for (let k = i + 1; k < Math.min(i + 25, lines.length); k++) {
            const nl = lines[k].trim();
            if (nl.match(/^[a-eA-E][.)]\s/)) altCount++;
            if (nl.match(/^(?:Questão|QUESTÃO|###\s*Questão)/i)) break;
          }
          if (altCount >= 3) break;
        }
      }
      
      const am = cl.match(/^([a-eA-E][.)])\s*(.*)/);
      if (am) {
        collecting = true;
        const letter = am[1].toLowerCase()[0];
        const txt = am[2];
        if (letter === "a") alt_a += (alt_a ? " " : "") + txt;
        else if (letter === "b") alt_b += (alt_b ? " " : "") + txt;
        else if (letter === "c") alt_c += (alt_c ? " " : "") + txt;
        else if (letter === "d") alt_d += (alt_d ? " " : "") + txt;
        else if (letter === "e") alt_e += (alt_e ? " " : "") + txt;
      } else if (!collecting) {
        pergunta += (pergunta ? " " : "") + cl;
      }
      i++;
    }

    let disc = "CLPAP", peso = 1;
    if (qNum >= 1 && qNum <= 20) { disc = "CLPAP"; peso = 1; }
    else if (qNum >= 21 && qNum <= 140) { disc = "CPJM"; peso = 1.25; }
    else if (qNum >= 141 && qNum <= 217) { disc = "CLIPM"; peso = 1.75; }
    else if (qNum >= 218 && qNum <= 300) { disc = "CP"; peso = 2; }

    questoes.push({
      num: qNum, pergunta, resp: gabarito[qNum] || "",
      a: alt_a, b: alt_b, c: alt_c, d: alt_d, e: alt_e,
      disc, peso
    });
  } else { i++; }
}

console.log("Total:", questoes.length);
console.log("Com gabarito:", questoes.filter(q => q.resp).length);
console.log("Sem gabarito:", questoes.filter(q => !q.resp).length);
const byDisc = {};
for (const q of questoes) byDisc[q.disc] = (byDisc[q.disc] || 0) + 1;
console.log("Por disciplina:", JSON.stringify(byDisc));
const nums = questoes.map(q => q.num).sort((a,b) => a-b);
console.log("Range:", nums[0], "-", nums[nums.length-1]);
const missing = Array.from({length: 300}, (_,i) => i+1).filter(n => !nums.includes(n));
if (missing.length > 0) console.log("Faltando:", missing.join(","));

(async () => {
  const { data: existing } = await supabase.from("questao").select("id").eq("tipo", "exercicio");
  if (existing && existing.length > 0) {
    console.log("Removendo " + existing.length + " existentes...");
    for (const e of existing) await supabase.from("questao").delete().eq("id", e.id);
  }
  let ok = 0, err = 0;
  for (const q of questoes) {
    if (!q.resp) continue;
    if (!q.pergunta && !q.a) continue;
    const r = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      pergunta: q.pergunta.substring(0, 2000),
      alternativa_a: q.a.substring(0, 1000),
      alternativa_b: q.b.substring(0, 1000),
      alternativa_c: q.c.substring(0, 1000),
      alternativa_d: q.d.substring(0, 1000),
      alternativa_e: q.e.substring(0, 1000),
      resposta_correta: q.resp,
      disciplina: q.disc, peso: q.peso, tipo: "exercicio"
    };
    const { error } = await supabase.from("questao").insert([r]);
    if (error) { console.log("Erro Q" + q.num + ":", error.message.substring(0, 60)); err++; }
    else ok++;
  }
  console.log("Inseridas: " + ok + ", Erros: " + err);
  const final = await supabase.from("questao").select("id").eq("tipo", "exercicio");
  console.log("Total no banco: " + final.data?.length);
})();

const fs = require("fs");
const text = fs.readFileSync("questoes_exercicios.txt", "utf8");
const lines = text.split("\n").filter(l => l.trim());

let qnums = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  const m1 = l.match(/^(?:Questão|QUESTÃO)\s*(\d+)/i);
  if (m1) {
    qnums.push(parseInt(m1[1]));
    continue;
  }
  const m2 = l.match(/^(\d{1,3})\.\s+[A-Z]/);
  if (m2) {
    const n = parseInt(m2[1]);
    if (n >= 1 && n <= 300 && !qnums.includes(n)) {
      qnums.push(n);
    }
  }
}

qnums.sort((a,b) => a-b);
console.log("Total:", qnums.length);
console.log("Numbers:", qnums.join(", "));
console.log("Missing:", Array.from({length: 300}, (_,i) => i+1).filter(n => !qnums.includes(n)).join(", "));

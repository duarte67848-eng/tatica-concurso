const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://rclqjbrwlnrphjerthhv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHFqYnJ3bG5ycGhqZXJ0aGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzUzODYsImV4cCI6MjA5Mzg1MTM4Nn0.hqMHqWMt4zMEAPmia-eEvFl1d-1K7c7WuC33dGRGUMs"
);

const questoes = [
  {
    pergunta: "Assinale a opção em que o operador argumentativo destacado estabelece, no contexto, uma relação de concessão:",
    alternativa_a: "\"O servidor estudou bastante portanto foi aprovado no concurso.\"",
    alternativa_b: "\"Embora houvesse orientações claras, a equipe descumpriu o prazo.\"",
    alternativa_c: "\"O projeto foi revisado pois apresentava inconsistências técnicas.\"",
    alternativa_d: "\"Primeiramente colete os dados; em seguida analise os resultados.\"",
    alternativa_e: "\"Ele agiu corretamente de acordo com as normas vigentes.\"",
    resposta_correta: "B",
    disciplina: "CLPAP",
    peso: 1,
    tipo: "exercicio"
  }
];

async function main() {
  for (const q of questoes) {
    q.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const { error } = await supabase.from("questao").insert([q]);
    if (error) {
      console.log("Erro:", error.message);
    } else {
      console.log("OK:", q.id);
    }
  }
  console.log("Concluido");
}
main();

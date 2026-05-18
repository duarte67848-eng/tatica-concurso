export interface Question {
  id: string;
  pergunta: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: string;
  disciplina: string;
  peso: number;
  tipo: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  aprovado: boolean;
  criado_em: string;
  patente: string;
  direcionamento?: string;
}

export interface Result {
  id: number;
  email_usuario: string;
  nome_usuario: string;
  acertos: number;
  erros: number;
  pf: number;
  total_questoes: number;
  detalhes?: string;
  criado_em: string;
}

export interface Pdf {
  id: number;
  titulo: string;
  descricao: string;
  disciplina: string;
  categoria: string;
  url: string;
  tamanho: number;
  paginas: number;
  created_at: string;
}

export interface DetalheQuestao {
  questao_id: string;
  disciplina: string;
  resposta_usuario: string;
  resposta_correta: string;
  acertou: boolean;
}

export const HIERARQUIA = [
  { valor: "Aluno Soldado", ordem: 1 },
  { valor: "Soldado", ordem: 2 },
  { valor: "Cabo", ordem: 3 },
  { valor: "Aluno a Sargento", ordem: 4 },
  { valor: "3º Sargento", ordem: 5 },
  { valor: "2º Sargento", ordem: 6 },
  { valor: "1º Sargento", ordem: 7 },
  { valor: "Sub Tenente", ordem: 8 },
];

export type TabType = "questions" | "users" | "results" | "pdfs" | "questionsSimulado" | "questionsExercicio" | "relatorio";

export function tempoCadastro(criadoEm: string): string {
  const created = new Date(criadoEm);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "1 dia";
  if (diffDays < 7) return `${diffDays} dias`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
  return `${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

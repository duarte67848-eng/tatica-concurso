-- Tabela de Revisão Inteligente
CREATE TABLE IF NOT EXISTS revisao (
  id SERIAL PRIMARY KEY,
  usuario_email TEXT NOT NULL,
  questao_id TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  bloco TEXT NOT NULL,
  resposta_usuario TEXT NOT NULL,
  resposta_correta TEXT NOT NULL,
  errou_em TIMESTAMP DEFAULT NOW(),
  vezes_errada INTEGER DEFAULT 1,
  ultima_revisao TIMESTAMP,
  dificuldade TEXT DEFAULT 'médio',
  tempo_gasto INTEGER DEFAULT 0,
  resolvida BOOLEAN DEFAULT FALSE
);

-- Tabela de histórico de revisão
CREATE TABLE IF NOT EXISTS historico_revisao (
  id SERIAL PRIMARY KEY,
  usuario_email TEXT NOT NULL,
  questao_id TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  bloco TEXT NOT NULL,
  data_revisao TIMESTAMP DEFAULT NOW(),
  acertou BOOLEAN NOT NULL,
  tempo_gasto INTEGER DEFAULT 0
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_revisao_usuario ON revisao(usuario_email);
CREATE INDEX IF NOT EXISTS idx_revisao_resolvida ON revisao(resolvida);
CREATE INDEX IF NOT EXISTS idx_revisao_disciplina ON revisao(disciplina);
CREATE INDEX IF NOT EXISTS idx_revisao_bloco ON revisao(bloco);

-- Tabela de Biblioteca de PDFs
CREATE TABLE IF NOT EXISTS biblioteca (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  disciplina TEXT NOT NULL,
  categoria TEXT,
  url TEXT NOT NULL,
  tamanho INTEGER,
  paginas INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index para biblioteca
CREATE INDEX IF NOT EXISTS idx_biblioteca_disciplina ON biblioteca(disciplina);

-- Adicionar coluna de patente na tabela usuario (caso não exista)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS patente TEXT DEFAULT 'Aluno Soldado';
"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

interface GeradorIAProps {
  colors: any;
}

export default function GeradorIA({ colors: c }: GeradorIAProps) {
  const [textoEntrada, setTextoEntrada] = useState("");
  const [disciplinaDefault, setDisciplinaDefault] = useState("CLPAP");
  const [tipoDefault, setTipoDefault] = useState("exercicio");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [questoesSalvas, setQuestoesSalvas] = useState(0);

  const parseQuestoes = (texto: string) => {
    const questoes: any[] = [];
    
    // 1. Extrair gabarito do final (Ex: 01-A, 02-C...)
    const gabaritoMatch = texto.match(/(\d{1,2})-([A-E])/gi);
    const gabaritos: Record<string, string> = {};
    if (gabaritoMatch) {
      gabaritoMatch.forEach((g: string) => {
        const [num, resp] = g.split('-');
        gabaritos[num.padStart(2, '0')] = resp.toUpperCase();
      });
    }
    
    // 2. Separar por "Questão X"
    const blocos = texto.split(/Questão\s*\d+/i).slice(1);
    
    let questaoIndex = 0;
    for (const bloco of blocos) {
      if (!bloco.trim()) continue;
      questaoIndex++;
      
      const linhas = bloco.split('\n').filter(l => l.trim());
      if (linhas.length < 2) continue;
      
      let pergunta = '';
      const alternativas: string[] = [];
      
      for (const linha of linhas) {
        const linhaTrim = linha.trim();
        
        // Identifica alternativas a), b), c), d), e)
        const altMatch = linhaTrim.match(/^[a-e]\)\s*(.+)/i);
        if (altMatch) {
          alternativas.push(altMatch[1]);
        } else if (!pergunta && linhaTrim.length > 5) {
          pergunta += linhaTrim + ' ';
        }
      }
      
      if (pergunta && alternativas.length >= 2) {
        while (alternativas.length < 5) alternativas.push('');
        
        const numQuestao = questaoIndex.toString().padStart(2, '0');
        const respostaCorreta = gabaritos[numQuestao] || 'A';
        
        questoes.push({
          pergunta: pergunta.trim().substring(0, 500),
          alternativa_a: alternativas[0] || '',
          alternativa_b: alternativas[1] || '',
          alternativa_c: alternativas[2] || '',
          alternativa_d: alternativas[3] || '',
          alternativa_e: alternativas[4] || '',
          resposta_correta: respostaCorreta,
          explicacao: '',
          disciplina: disciplinaDefault,
          assunto: '',
          peso: 1.0,
          tipo: tipoDefault
        });
      }
    }
    return questoes;
  };

  const handleSalvar = async () => {
    if (!textoEntrada.trim()) {
      setMensagem('⚠️ Cole as questões primeiro!');
      return;
    }

    setLoading(true);
    setMensagem('');
    
    try {
      const questoesParaSalvar = parseQuestoes(textoEntrada);
      
      if (questoesParaSalvar.length === 0) {
        setMensagem('❌ Não foi possível identificar questões no formato correto.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('questao').insert(questoesParaSalvar);
      
      if (error) throw error;

      setQuestoesSalvas(prev => prev + questoesParaSalvar.length);
      setMensagem(`✅ ${questoesParaSalvar.length} questão(ões) salva(s) com sucesso!`);
      setTextoEntrada('');
    } catch (err: any) {
      setMensagem('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: c.backgroundSecondary, 
      border: `1px solid ${c.border}`, 
      borderRadius: '8px', 
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: c.gold, marginBottom: '1rem' }}>
        📝 Adicionar Questões em Lote
      </h2>
      
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', color: c.textSecondary, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            📚 Disciplina
          </label>
          <select
            value={disciplinaDefault}
            onChange={(e) => setDisciplinaDefault(e.target.value)}
            style={{
              width: '120px',
              padding: '0.75rem',
              background: c.background,
              border: `1px solid ${c.border}`,
              borderRadius: '4px',
              color: c.text
            }}
          >
            <option value="CLPAP">CLPAP</option>
            <option value="CPJM">CPJM</option>
            <option value="CLIPM">CLIPM</option>
            <option value="CP">CP</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: c.textSecondary, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            📋 Tipo
          </label>
          <select
            value={tipoDefault}
            onChange={(e) => setTipoDefault(e.target.value)}
            style={{
              width: '120px',
              padding: '0.75rem',
              background: c.background,
              border: `1px solid ${c.border}`,
              borderRadius: '4px',
              color: c.text
            }}
          >
            <option value="exercicio">Exercício</option>
            <option value="simulado">Simulado</option>
          </select>
        </div>
      </div>

      <textarea
        value={textoEntrada}
        onChange={(e) => setTextoEntrada(e.target.value)}
        placeholder="Cole suas questões aqui... Ex: Questão 1\\n a) ...\\n b) ...\\n Gabarito: 01-A, 02-B"
        style={{
          width: '100%',
          height: '200px',
          background: c.background,
          border: `1px solid ${c.border}`,
          borderRadius: '4px',
          color: c.text,
          padding: '1rem',
          marginBottom: '1rem',
          fontFamily: 'monospace'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={handleSalvar} 
          disabled={loading}
          style={{ 
            background: c.gold, 
            color: '#000', 
            fontWeight: 'bold', 
            padding: '12px 24px', 
            borderRadius: '4px', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'SALVANDO...' : '💾 Salvar no Banco'}
        </button>
        {mensagem && <span style={{ color: mensagem.includes('✅') ? c.green : c.red, fontSize: '0.875rem' }}>{mensagem}</span>}
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        background: c.backgroundTertiary, 
        borderRadius: '8px' 
      }}>
        <p style={{ color: c.gold, fontWeight: 'bold', marginBottom: '0.5rem' }}>
          📌 FORMATO CORRETO:
        </p>
        <ul style={{ color: c.textSecondary, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
          <li>Questões começando com "Questão 1", "Questão 2"...</li>
          <li>Alternativas como a), b), c), d), e)</li>
          <li>No <strong>FINAL</strong>, o gabarito: <strong>01-A, 02-C, 03-B...</strong></li>
        </ul>
      </div>
    </div>
  );
}

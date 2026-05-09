"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResultadoPage() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ultimoResultado");
    if (saved) {
      setResult(JSON.parse(saved));
    }
  }, []);

  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">Nenhum resultado encontrado</div>
        <Link href="/simulado">
          <button className="military-button">INICIAR SIMULADO</button>
        </Link>
      </div>
    );
  }

  const percentage = ((result.acertos / result.questions) * 100).toFixed(1);
  
  const getClassification = (pf: number) => {
    const pct = pf * 100 / 10;
    if (pct >= 90) return { text: "COMANDO ELITE", color: "text-yellow-500", rank: "⭐⭐⭐" };
    if (pct >= 80) return { text: "OPERADOR ESTRATÉGICO", color: "text-green-500", rank: "⭐⭐" };
    if (pct >= 70) return { text: "TROPA TÁTICA", color: "text-blue-500", rank: "⭐" };
    if (pct >= 60) return { text: "LINHA OPERACIONAL", color: "text-gray-400", rank: "" };
    return { text: "EM TREINAMENTO", color: "text-red-500", rank: "" };
  };

  const classification = getClassification(parseFloat(result.pf));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-500 text-center mb-8">
        RESULTADO DO SIMULADO
      </h1>

      <div className="military-card text-center mb-8">
        <div className="text-gray-400 text-sm mb-2">CLASSIFICAÇÃO</div>
        <div className={`text-4xl font-bold mb-2 ${classification.color}`}>
          {classification.text}
        </div>
        <div className="text-6xl mb-4">{classification.rank}</div>
        
        <div className="hud-line my-6"></div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-4xl font-bold text-green-500">{result.acertos}</div>
            <div className="text-gray-400 text-sm">ACERTOS</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-red-500">{result.erros}</div>
            <div className="text-gray-400 text-sm">ERROS</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-500">{percentage}%</div>
            <div className="text-gray-400 text-sm">PERCENTUAL</div>
          </div>
        </div>

        <div className="hud-line my-6"></div>

        <div className="mb-4">
          <div className="text-gray-400 text-sm">PONTUAÇÃO FINAL (PF)</div>
          <div className="text-6xl font-bold text-yellow-500">{result.pf}</div>
        </div>

        <div className="text-gray-500 text-sm">
          Fórmula: PF = ((CLPAP × 1) + (CPJM × 1.25) + (CLIPM × 1.75) + (CP × 2)) / 12
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Link href="/simulado">
          <button className="military-button">
            NOVO SIMULADO
          </button>
        </Link>
        <Link href="/dashboard">
          <button className="px-6 py-3 border border-yellow-600 text-yellow-500 rounded hover:bg-yellow-900/30">
            VER DASHBOARD
          </button>
        </Link>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Result {
  id: string;
  acertos: number;
  erros: number;
  pf: number;
  created_at: string;
}

export default function DashboardPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("results")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (data) setResults(data);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const calculatePF = (acertos: number, total: number) => {
    if (total === 0) return 0;
    const percentage = (acertos / total) * 100;
    return (percentage / 12).toFixed(2);
  };

  const getClassification = (pf: number) => {
    if (pf >= 7.5) return { text: "COMANDO ELITE", color: "text-yellow-500" };
    if (pf >= 6.6) return { text: "OPERADOR ESTRATÉGICO", color: "text-green-500" };
    if (pf >= 5.8) return { text: "TROPA TÁTICA", color: "text-blue-500" };
    if (pf >= 5.0) return { text: "LINHA OPERACIONAL", color: "text-gray-400" };
    return { text: "EM TREINAMENTO", color: "text-red-500" };
  };

  const bestPF = results.length > 0 ? Math.max(...results.map(r => r.pf)) : 0;
  const avgPF = results.length > 0 
    ? (results.reduce((sum, r) => sum + r.pf, 0) / results.length).toFixed(2) 
    : "0.00";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-yellow-500 text-xl">CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-500 mb-8">
        DASHBOARD OPERACIONAL
      </h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="military-card text-center">
          <div className="text-gray-400 text-sm mb-2">TOTAL SIMULADOS</div>
          <div className="text-4xl font-bold text-yellow-500">{results.length}</div>
        </div>
        
        <div className="military-card text-center">
          <div className="text-gray-400 text-sm mb-2">MELHOR PF</div>
          <div className="text-4xl font-bold text-green-500">{bestPF.toFixed(2)}</div>
        </div>
        
        <div className="military-card text-center">
          <div className="text-gray-400 text-sm mb-2">MÉDIA PF</div>
          <div className="text-4xl font-bold text-blue-500">{avgPF}</div>
        </div>
        
        <div className="military-card text-center">
          <div className="text-gray-400 text-sm mb-2">ÚLTIMO ACESSO</div>
          <div className="text-xl font-bold text-white">
            {results.length > 0 
              ? new Date(results[0].created_at).toLocaleDateString("pt-BR")
              : "-"}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-yellow-500 mb-4">INICIAR NOVO SIMULADO</h2>
        <Link href="/simulado">
          <button className="military-button text-lg">
            INICIAR SIMULADO AGORA
          </button>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-yellow-500 mb-4">HISTÓRICO DE RESULTADOS</h2>
        
        {results.length === 0 ? (
          <div className="military-card text-center py-8 text-gray-400">
            Nenhum simulado realizado ainda. Inicie seu primeiro simulado!
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => {
              const classification = getClassification(result.pf);
              return (
                <div key={result.id} className="military-card flex justify-between items-center">
                  <div>
                    <div className="text-gray-400 text-sm">
                      {new Date(result.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(result.created_at).toLocaleTimeString("pt-BR")}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      Acertos: {result.acertos} | Erros: {result.erros}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-500">
                      PF: {result.pf.toFixed(2)}
                    </div>
                    <div className={`text-sm font-bold ${classification.color}`}>
                      {classification.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
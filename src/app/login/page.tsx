"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Preencha email e senha");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setError("Conta criada! Faça login.");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="military-card w-full max-w-md">
        <h1 className="text-3xl font-bold text-yellow-500 text-center mb-8">
          ACESSO MILITAR
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2 text-sm">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="military-input"
              placeholder="seu.email@exemplo.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-2 text-sm">SENHA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="military-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center p-2 border border-red-500 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="military-button w-full"
          >
            {loading ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="text-yellow-500 hover:text-yellow-400 text-sm"
          >
            CRIAR NOVA CONTA
          </button>
        </div>
      </div>
    </div>
  );
}
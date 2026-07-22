"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BriefcaseIcon } from "lucide-react";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Conta criada com sucesso! Faça login.");
        router.push("/login");
      } else {
        toast.error(data.message || "Erro ao criar conta");
      }
    } catch (err) {
      toast.error("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 relative overflow-hidden">
      {/* Efeitos de luz de fundo (Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-800/80 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 hover:scale-105 transition-transform duration-300">
            <BriefcaseIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crie sua conta</h1>
          <p className="text-sm text-slate-400 mt-1">Junte-se para encontrar as melhores vagas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Nome completo</label>
            <Input 
              type="text" 
              placeholder="Seu nome" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required 
              className="h-11 bg-slate-950/40 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">E-mail</label>
            <Input 
              type="email" 
              placeholder="seu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="h-11 bg-slate-950/40 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Senha</label>
            <Input 
              type="password" 
              placeholder="Crie uma senha forte" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              required 
              minLength={6}
              className="h-11 bg-slate-950/40 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-white shadow-lg shadow-indigo-500/20 mt-2" 
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar conta grátis"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}

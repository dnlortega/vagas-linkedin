"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BriefcaseIcon } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password: senha,
    });

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Login efetuado com sucesso!");
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 relative overflow-hidden">
      {/* Efeitos de luz de fundo (Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-800/80 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 hover:scale-105 transition-transform duration-300">
            <BriefcaseIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acesse sua conta</h1>
          <p className="text-sm text-slate-400 mt-1">Bem-vindo de volta ao portal de vagas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              required 
              className="h-11 bg-slate-950/40 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-white shadow-lg shadow-blue-500/20 mt-2" 
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors">
            Cadastre-se grátis
          </Link>
        </div>

        {/* ── Contas de Teste Rápido ── */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
            Acesso Rápido (Ambiente de Testes)
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setEmail("teste@exemplo.com"); setSenha("123456"); }}
              className="flex items-center justify-between px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all group"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Usuário Teste</span>
                <span className="text-xs text-slate-400">teste@exemplo.com</span>
              </div>
              <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-300">senha: 123456</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail("dnlortega@gmail.com"); setSenha("sua_senha_aqui"); }}
              className="flex items-center justify-between px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all group"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Daniel (Admin)</span>
                <span className="text-xs text-slate-400">dnlortega@gmail.com</span>
              </div>
              <span className="text-xs text-slate-500 italic">preencher senha</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

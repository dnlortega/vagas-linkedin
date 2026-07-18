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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <BriefcaseIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Crie sua conta</h1>
          <p className="text-sm text-slate-500 mt-1">Junte-se para encontrar as melhores vagas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nome completo</label>
            <Input 
              type="text" 
              placeholder="Seu nome" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required 
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <Input 
              type="email" 
              placeholder="seu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <Input 
              type="password" 
              placeholder="Crie uma senha forte" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              required 
              minLength={6}
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? "Criando..." : "Criar conta grátis"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}

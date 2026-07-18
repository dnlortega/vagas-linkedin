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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <BriefcaseIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Acesse sua conta</h1>
          <p className="text-sm text-slate-500 mt-1">Bem-vindo de volta ao portal de vagas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              required 
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="text-blue-600 font-semibold hover:underline">
            Cadastre-se grátis
          </Link>
        </div>
      </div>
    </div>
  );
}

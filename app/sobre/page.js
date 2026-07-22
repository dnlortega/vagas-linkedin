'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  BotIcon, 
  DatabaseIcon, 
  ActivityIcon, 
  KanbanIcon, 
  CodeIcon, 
  CpuIcon, 
  SparklesIcon, 
  NetworkIcon,
  ShieldCheckIcon,
  GlobeIcon
} from 'lucide-react';

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-[#0d0d0d] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* ── Header ────────────────────────────────────────── */}
      <header className="bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-black/5 dark:border-white/10 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <h1 className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200">Sobre o Sistema</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/dnlortega/vagas-linkedin" target="_blank" rel="noopener noreferrer" 
               className="h-8 px-3 flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity">
              <CodeIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        
        {/* ── Hero Section ──────────────────────────────────────── */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 mb-2">
            <SparklesIcon className="h-8 w-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Vagas TI: O Ecossistema Inteligente</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed">
            Criado por <strong>Daniel Ortega</strong>, este não é um simples quadro de vagas. É uma engrenagem autônoma de inteligência artificial que caça oportunidades, contorna limitações de plataformas e recruta exclusivamente para você.
          </p>
        </section>

        {/* ── Motor Core ──────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <CpuIcon className="h-6 w-6 text-indigo-500" />
            <h3 className="text-2xl font-bold tracking-tight">O Motor Sob o Capô</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Card 1 */}
            <div className="group bg-white dark:bg-[#151515] rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <GlobeIcon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold mb-2">Multi-Scraping Dinâmico</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Um engenho robusto construído com <code className="text-xs bg-slate-100 dark:bg-white/10 px-1 rounded">cheerio</code> e rotinas assíncronas que varre o LinkedIn, VagasBauru, Catho, Remotar e Indeed de uma só vez, contornando travas de APIs "Guest" para entregar milhares de vagas ao seu painel em segundos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white dark:bg-[#151515] rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-purple-500/30 dark:hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all">
              <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <BotIcon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold mb-2">Inteligência Artificial (Gemini)</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Cada vaga ingerida é avaliada pela API nativa da Google (Gemini). Ela atua em background destrinchando descrições verbosas, descartando "lixo" e extraindo estritamente as Skills Técnicas que a vaga realmente exige.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white dark:bg-[#151515] rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <NetworkIcon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold mb-2">Match Inteligente Preditivo</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                As Competências extraídas pela IA são cruzadas em tempo real contra as suas <em>Preferências de Vaga</em> no seu Perfil. O sistema avalia aderência e exibe o selo <span className="text-emerald-500 font-bold">🌟 Match</span> para você não perder tempo lendo vagas inúteis.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-white dark:bg-[#151515] rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all">
              <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                <ActivityIcon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold mb-2">Semáforo Real-Time (Healthcheck)</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Sistemas abertos costumam sofrer quedas ou Rate Limits. Desenvolvemos um Healthcheck visual no Header (o Semáforo) que notifica de maneira não-obstrutiva o status e a saúde da ponte com o LinkedIn em tempo real.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group bg-white dark:bg-[#151515] rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-pink-500/30 dark:hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] transition-all">
              <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                <KanbanIcon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold mb-2">Gestão Kanban (CRM)</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Integração completa estilo Trello. Adicione uma vaga em andamento e acompanhe seu funil de aplicação, entrevista e oferta. Tudo centralizado no navegador para você ter o controle do seu destino.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group bg-white dark:bg-[#151515] rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-500/30 dark:hover:border-slate-500/30 hover:shadow-[0_0_30px_rgba(100,116,139,0.1)] transition-all">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-500/20 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold mb-2">PWA e Dados Privados</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                App perfeitamente responsivo, instalável no celular (PWA). E o mais importante: rodando sob Prisma ORM, o sistema usa SQLite/Postgres. Seus currículos e matches de IA são guardados de forma segura com autenticação NextAuth.
              </p>
            </div>

          </div>
        </section>

        {/* ── Resumo de Arquitetura ────────────────────────────── */}
        <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="h-6 w-6 text-indigo-400" />
              <h3 className="text-2xl font-bold">Tech Stack Completa</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['Next.js 14 App Router', 'React Server Components', 'Prisma ORM', 'SQLite / PostgreSQL', 'Tailwind CSS', 'Shadcn UI', 'NextAuth.js', 'Google Gemini AI', 'Cheerio', 'PWA', 'Cron Jobs'].map((tech) => (
                <span key={tech} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm font-semibold backdrop-blur-md">
                  {tech}
                </span>
              ))}
            </div>

            <p className="text-indigo-200/80 text-sm leading-relaxed max-w-2xl">
              Desenvolvido com foco extremo em Performance e UX. A interface não é apenas bonita por conta do Dark Mode sofisticado; ela carrega massas de dados de forma quase instantânea mantendo a pesada varredura de dados sempre do lado do servidor (Next.js Edge).
            </p>
          </div>
        </section>
        
        {/* Footer info */}
        <div className="text-center pb-8 opacity-60">
          <p className="text-xs">
            Vagas TI © 2026. Feito para revolucionar a busca de emprego.
          </p>
        </div>

      </main>
    </div>
  );
}

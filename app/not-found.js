// Sistema de Vagas de TI em Bauru — Página 404
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

'use client';

import Link from 'next/link';
import { SearchIcon, ArrowLeftIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="relative mb-6 inline-block">
          <span className="text-[120px] font-black text-gray-100 leading-none select-none">404</span>
          <SearchIcon className="absolute inset-0 m-auto h-16 w-16 text-blue-500 opacity-70" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
        <p className="text-sm text-gray-500 mb-8">
          A página que você procura não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar para as vagas
        </Link>
      </div>
    </div>
  );
}

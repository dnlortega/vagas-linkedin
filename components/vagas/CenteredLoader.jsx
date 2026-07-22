import { useState, useEffect } from 'react';
import { BriefcaseIcon } from 'lucide-react';

const FONTES_LOADER = ['LinkedIn', 'VagasBauru', 'Indeed', 'Vagas.com', 'CIEE', 'Catho', 'Empregos'];

export function CenteredLoader() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % FONTES_LOADER.length), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 fade-slide-up">
      <div className="relative flex items-center justify-center">
        <div className="ping-slow absolute h-20 w-20 rounded-3xl bg-blue-400 opacity-30" />
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-blue-200 z-10">
          <BriefcaseIcon className="h-8 w-8 text-white" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-bold text-gray-800">Buscando vagas…</p>
        <p className="text-sm text-gray-400 h-5 transition-all">
          Verificando <span className="font-semibold text-blue-600">{FONTES_LOADER[dots]}</span>
        </p>
      </div>

      <div className="flex gap-2">
        {FONTES_LOADER.map((src, i) => (
          <div
            key={src}
            className={`bounce-dot h-2 w-2 rounded-full transition-colors ${i === dots ? 'bg-blue-500' : 'bg-gray-200'}`}
            style={{ animationDelay: `${i * 100}ms` }}
            title={src}
          />
        ))}
      </div>
    </div>
  );
}

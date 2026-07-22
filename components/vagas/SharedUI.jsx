import { useState, useEffect, useRef } from 'react';
import { ChevronUpIcon, DownloadIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 500); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-2xl bg-gray-900 text-white shadow-xl flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
      title="Voltar ao topo"
    >
      <ChevronUpIcon className="h-5 w-5" />
    </button>
  );
}

export function VagasPorDia({ vagas }) {
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso   = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const count = vagas.filter(v => v.data?.startsWith(iso)).length;
    return { iso, label, count };
  });
  const max = Math.max(...dias.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {dias.map(d => (
        <div key={d.iso} className="flex-1 flex flex-col items-center gap-1" title={`${d.label}: ${d.count} vagas`}>
          <span className="text-[9px] text-gray-400 font-semibold">{d.count || ''}</span>
          <div className="w-full bg-blue-500 rounded-sm transition-all" style={{ height: `${Math.max(3, (d.count / max) * 36)}px` }} />
          <span className="text-[9px] text-gray-400 capitalize">{d.label.replace('.', '')}</span>
        </div>
      ))}
    </div>
  );
}

export function LoadingBar({ visible }) {
  const [done, setDone] = useState(false);
  const key = useRef(0);
  useEffect(() => {
    if (visible) { key.current += 1; setDone(false); } else { setDone(true); }
  }, [visible]);
  if (!visible && !done) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-blue-100 overflow-hidden">
      <div
        key={key.current}
        className={`h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all ${done ? 'w-full duration-300' : 'loadbar-anim'}`}
        onTransitionEnd={() => setDone(false)}
      />
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <span className="dot-1 w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />
      <span className="dot-2 w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />
      <span className="dot-3 w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />
    </span>
  );
}

export function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const terms = query.split(/\s+/).filter(t => !t.startsWith('-') && t.length > 1);
  if (!terms.length) return <>{text}</>;
  try {
    const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
    return <>{parts.map((p, i) => i % 2 === 1
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{p}</mark>
      : p
    )}</>;
  } catch { return <>{text}</>; }
}

export function Logo({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <rect width="46" height="46" rx="11" fill="white" fillOpacity="0.2"/>
      <path d="M11 15 L5 23 L11 31" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 13 L23 33 L29 13" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33 33 L38 13" stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
      <path d="M35 15 L41 23 L35 31" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function PWAInstallBtn({ prompt, setPrompt, installed }) {
  if (installed || !prompt) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={async () => {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') setPrompt(null);
          }}
          className="p-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all"
        >
          <DownloadIcon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Instalar app no celular</TooltipContent>
    </Tooltip>
  );
}

export function PillBtn({ active, onClick, children, activeClass = 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200/50', className = '', title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
        active ? `${activeClass} shadow-md` : `bg-white/80 backdrop-blur-xs text-slate-600 border-slate-200/70 hover:border-slate-350 hover:text-slate-900 shadow-sm shadow-slate-100/40 hover:shadow`
      } ${className}`}
    >
      {children}
    </button>
  );
}

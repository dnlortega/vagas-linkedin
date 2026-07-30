'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  SearchIcon, RefreshCwIcon, BellIcon, MoonIcon, SunIcon,
  DownloadIcon, XIcon, SparklesIcon,
  FilterXIcon, MonitorIcon, KanbanIcon,
  LayersIcon, InfoIcon, AwardIcon, LogOutIcon, SlidersHorizontalIcon,
  LayoutGridIcon, ListIcon, BriefcaseIcon, EyeOffIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import VagaModal from './components/VagaModal';

// Constants
import {
  PERIODOS, FONTE_CONFIG, TECHS,
  detectarTechs, detectarModalidade, detectarModoTrabalho, matchBusca,
  tipoLocalidade, matchPeriodo, detectSenioridade, formatTempo
} from '@/lib/constants';

// Hooks
import { useVagasFiltros } from '@/lib/hooks/useVagasFiltros';
import { useVagasEstado } from '@/lib/hooks/useVagasEstado';

// Vagas Components
import { VagaCard } from '@/components/vagas/VagaCard';
import { VagaCardSkeleton } from '@/components/vagas/VagaCardSkeleton';
import { CenteredLoader } from '@/components/vagas/CenteredLoader';
import { LoadingBar, LoadingDots, ScrollToTopButton } from '@/components/vagas/SharedUI';

function useDebounce(value, delay = 200) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const [userPreferencias, setUserPreferencias] = useState([]);
  useEffect(() => {
    if (session?.user) {
      fetch('/api/perfil').then(r => r.json()).then(data => {
        if (data.preferencias) setUserPreferencias(data.preferencias);
      }).catch(() => {});
    }
  }, [session]);

  const [darkMode, setDarkMode] = useState(false);
  const [silencioso, setSilencioso] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [linkedinStatus, setLinkedinStatus] = useState('loading');
  const [selectedVaga, setSelectedVaga] = useState(null);

  // Custom Hooks para Estado
  const filtros = useVagasFiltros();
  const estado = useVagasEstado({ 
    silencioso, 
    setFiltro: filtros.setFiltro, 
    setPeriodo: filtros.setPeriodo, 
    setBusca: filtros.setBusca 
  });

  const checarLinkedin = useCallback(() => {
    setLinkedinStatus('loading');
    fetch('/api/status').then(r => r.json()).then(data => setLinkedinStatus(data.status)).catch(() => setLinkedinStatus('OFF'));
  }, []);

  useEffect(() => { checarLinkedin(); }, [checarLinkedin]);

  useEffect(() => {
    try { const dm = localStorage.getItem('darkMode'); if (dm !== null) setDarkMode(dm === 'true'); } catch (_) {}
    try { const sl = localStorage.getItem('silencioso'); if (sl !== null) setSilencioso(sl === 'true'); } catch (_) {}
    if (!localStorage.getItem('onboarding_done')) setOnboarding(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem('darkMode', String(darkMode)); } catch (_) {}
  }, [darkMode]);

  useEffect(() => {
    try { localStorage.setItem('silencioso', String(silencioso)); } catch (_) {}
  }, [silencioso]);

  useEffect(() => {
    document.title = estado.novosCount > 0 ? `(${estado.novosCount}) Vagas em Bauru` : 'Vagas em Bauru';
  }, [estado.novosCount]);

  const buscaDebounced = useDebounce(filtros.busca, 220);
  const searchRef = useRef(null);
  const vagasOrdRef = useRef([]);

  // Atalhos de teclado
  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault(); searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (selectedVaga) { setSelectedVaga(null); return; }
        if (filtros.busca) { filtros.setBusca(''); return; }
        if (filtros.techFiltro) { filtros.setTechFiltro(null); return; }
        if (filtros.modalidade) { filtros.setModalidade(null); return; }
      }
      if (selectedVaga && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        const lista = vagasOrdRef.current;
        const idx   = lista.findIndex(v => v.link === selectedVaga.link);
        if (e.key === 'ArrowLeft'  && idx > 0)               setSelectedVaga(lista[idx - 1]);
        if (e.key === 'ArrowRight' && idx < lista.length - 1) setSelectedVaga(lista[idx + 1]);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedVaga, filtros]);

  const prevFiltroRef = useRef({ filtro: filtros.filtro, senioridade: filtros.senioridade, periodo: filtros.periodo, busca: filtros.busca, modalidade: filtros.modalidade, techFiltro: filtros.techFiltro });
  useEffect(() => {
    const p = prevFiltroRef.current;
    if (p.filtro !== filtros.filtro || p.senioridade !== filtros.senioridade || p.periodo !== filtros.periodo || p.busca !== filtros.busca || p.modalidade !== filtros.modalidade || p.techFiltro !== filtros.techFiltro) {
      estado.setGridKey(k => k + 1);
      prevFiltroRef.current = { filtro: filtros.filtro, senioridade: filtros.senioridade, periodo: filtros.periodo, busca: filtros.busca, modalidade: filtros.modalidade, techFiltro: filtros.techFiltro };
    }
  }, [filtros, estado]);

  const duplicatas = useMemo(() => {
    const map = new Map();
    estado.vagas.forEach(v => {
      const key = `${(v.titulo || '').toLowerCase().trim()}|||${(v.empresa || '').toLowerCase().trim()}`;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(v.fonte);
    });
    const dup = new Set();
    estado.vagas.forEach(v => {
      const key = `${(v.titulo || '').toLowerCase().trim()}|||${(v.empresa || '').toLowerCase().trim()}`;
      if ((map.get(key)?.size || 0) > 1) dup.add(v.link);
    });
    return dup;
  }, [estado.vagas]);

  function exportarCSV() {
    const header = 'Título,Empresa,Local,Data,Fonte,Tecnologias,Link';
    const rows = vagasFiltradas.map(v => {
      const techs = detectarTechs(v.titulo).map(t => t.label).join('; ');
      return [v.titulo, v.empresa, v.local, v.data || '', v.fonte, techs, v.link]
        .map(x => `"${String(x || '').replace(/"/g, '""')}"`)
        .join(',');
    });
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `vagas-ti-bauru-${new Date().toISOString().split('T')[0]}.csv` }).click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  }

  const reportNotTI = useCallback(async (vaga, e) => {
    e?.stopPropagation();
    if (!session) {
      toast('Você precisa estar logado para reportar uma vaga.');
      router.push('/login');
      return;
    }
    const toastId = toast.loading('Reportando vaga...');
    try {
      const res = await fetch('/api/vagas/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: vaga.link }),
      });
      if (res.ok) {
        toast.success('Obrigado! A vaga foi removida da lista de TI.', { id: toastId });
        estado.ocultarVaga(vaga.link, null);
      } else {
        toast.error('Erro ao reportar a vaga.', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro de conexão.', { id: toastId });
    }
  }, [session, router, estado]);

  const vagasFiltradas = useMemo(() => estado.vagas.filter(v => {
    if (estado.ocultas.has(v.link)) return false;
    const tipo = tipoLocalidade(v.local);
    const matchLoc =
      filtros.filtro === 'todas'      ? true :
      filtros.filtro === 'favoritas'  ? estado.favoritas.has(v.link) :
      filtros.filtro === 'bauru'      ? tipo === 'bauru' :
      filtros.filtro === 'regiao'     ? (tipo === 'bauru' || tipo === 'regiao') :
      filtros.filtro === 'remoto'     ? tipo === 'remoto' : true;
      
    const matchFonte = filtros.fonteFiltro === 'todas' || v.fonte === filtros.fonteFiltro;
    const matchSen  = filtros.senioridade === 'todas' || detectSenioridade(v.titulo) === filtros.senioridade;
    const matchMod  = !filtros.modalidade || detectarModalidade(v.titulo) === filtros.modalidade;
    const matchTech = !filtros.techFiltro || detectarTechs(v.titulo).some(t => t.label === filtros.techFiltro);
    const matchWork = !filtros.modoTrabalho || detectarModoTrabalho(v.local, v.titulo) === filtros.modoTrabalho;
    const matchNova   = !filtros.somenteNovas  || estado.novasLinks.has(v.link);
    const matchNaoVis = !filtros.naoVisitadas  || !estado.visitadas.has(v.link);
    const matchEmp    = !filtros.empresaBusca  || (v.empresa || '').toLowerCase().includes(filtros.empresaBusca.toLowerCase());
    
    const TI_REGEX    = /\b(desenvolvedor|programador|software|fullstack|full[- ]?stack|front[- ]?end|back[- ]?end|devops|sre|cloud|dados|data|bi\b|power\s?bi|analista.*(sistemas?|t\.?i\.?|dados|suporte|infra|seguran[çc]a)|engenheiro.*(software|dados|cloud)|arquiteto.*(t\.?i\.?|software|solu)|dba|suporte.*(t\.?i\.?|t[ée]cnico)|help.*desk|service.*desk|infra|segurança|cyber|tecnologia|tech|sistemas?|computação|c#|java|python|php|javascript|typescript|node)/i;
    const EXCLUDE_TI_REGEX = /\b(fiscal|cont[áa]bil|contabilidade|financeiro|rh|recursos humanos|departamento pessoal|vendas|comercial|marketing|faturamento|tribut[áa]rio|cobran[çc]a|telemarketing|atendimento)\b/i;
    const isTI = v.isTI !== false && ((TI_REGEX.test(v.titulo) || detectarTechs(v.titulo).length > 0) 
                 && !EXCLUDE_TI_REGEX.test(v.titulo) 
                 && !EXCLUDE_TI_REGEX.test(v.empresa || ''));
    
    const matchTI     = !filtros.somenteTI || isTI;
    return matchLoc && matchFonte && matchSen && matchMod && matchTech && matchWork && matchNova && matchNaoVis && matchEmp && matchTI && matchBusca(v, buscaDebounced) && matchPeriodo(v.data, filtros.periodo);
  }), [estado.vagas, estado.ocultas, filtros.filtro, filtros.fonteFiltro, estado.favoritas, filtros.senioridade, filtros.modalidade, filtros.techFiltro, filtros.modoTrabalho, buscaDebounced, filtros.periodo, filtros.somenteNovas, filtros.naoVisitadas, estado.novasLinks, estado.visitadas, filtros.empresaBusca, filtros.somenteTI]);

  const vagasOrdenadas = useMemo(() => {
    const sorted = [...vagasFiltradas].sort((a, b) => {
      if (filtros.pinarFavoritas) {
        const af = estado.favoritas.has(a.link) ? 0 : 1;
        const bf = estado.favoritas.has(b.link) ? 0 : 1;
        if (af !== bf) return af - bf;
      }
      if (filtros.ordem === 'data') {
        if (!a.data && !b.data) return 0;
        if (!a.data) return 1; if (!b.data) return -1;
        return new Date(b.data) - new Date(a.data);
      }
      if (filtros.ordem === 'empresa') return (a.empresa || '').localeCompare(b.empresa || '', 'pt-BR');
      if (filtros.ordem === 'titulo')  return (a.titulo  || '').localeCompare(b.titulo  || '', 'pt-BR');
      return 0;
    });
    return sorted;
  }, [vagasFiltradas, filtros.ordem, filtros.pinarFavoritas, estado.favoritas]);

  useEffect(() => { vagasOrdRef.current = vagasOrdenadas; }, [vagasOrdenadas]);

  const gruposVagas = useMemo(() => {
    if (filtros.agrupar === 'nenhum') return null;
    const grupos = new Map();
    vagasOrdenadas.forEach(v => {
      const key = filtros.agrupar === 'empresa'
        ? (v.empresa && v.empresa !== 'N/A' ? v.empresa : 'Sem empresa')
        : (FONTE_CONFIG[v.fonte]?.label || v.fonte || 'Outra');
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key).push(v);
    });
    return [...grupos.entries()]
      .map(([key, items]) => ({ key, label: key, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [vagasOrdenadas, filtros.agrupar]);

  const hora   = estado.geradoEm ? formatTempo(estado.geradoEm) : null;
  const contar = fn => (!estado.loading ? estado.vagas.filter(v => !estado.ocultas.has(v.link) && fn(v)).length : '…');
  const isAtivo = estado.loading || estado.refreshing;

  function abrirVaga(vaga) {
    if (!session) {
      toast('Você precisa fazer login para ver os detalhes da vaga.');
      router.push('/login');
      return;
    }
    estado.marcarVisitada(vaga.link);
    setSelectedVaga(vaga);
  }

  const renderFiltrosSidebar = () => (
    <div className="flex flex-col gap-5 py-2 px-1">
      {/* Busca */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          ref={searchRef}
          placeholder="Buscar vagas, empresas..."
          value={filtros.busca}
          onChange={e => filtros.setBusca(e.target.value)}
          className="pl-9 h-10 w-full bg-white dark:bg-slate-900"
        />
        {filtros.busca && (
          <button onClick={() => filtros.setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Localidade */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">📍 Localidade</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'bauru',  label: 'Bauru', fn: v => tipoLocalidade(v.local) === 'bauru' },
            { id: 'regiao', label: 'Região', fn: v => ['bauru','regiao'].includes(tipoLocalidade(v.local)) },
            { id: 'remoto', label: 'Remoto', fn: v => tipoLocalidade(v.local) === 'remoto' },
            { id: 'todas',  label: 'Todas',  fn: _ => true },
          ].map(f => (
            <Button
              key={f.id}
              variant={filtros.filtro === f.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => filtros.setFiltro(f.id)}
              className="justify-between h-9 px-3 text-xs w-full shadow-sm"
            >
              {f.label}
              <span className={`text-[10px] ml-1 ${filtros.filtro === f.id ? 'opacity-80' : 'text-slate-400'}`}>
                {contar(f.fn)}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Nível */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">📈 Nível</h3>
        <div className="flex flex-wrap gap-2">
          {[{id:'junior',label:'Júnior'},{id:'pleno',label:'Pleno'},{id:'senior',label:'Sênior'}].map(s => (
            <Button
              key={s.id}
              variant={filtros.senioridade === s.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => filtros.setSenioridade(p => p === s.id ? 'todas' : s.id)}
              className={`h-8 text-xs rounded-full bg-white shadow-sm ${filtros.senioridade === s.id ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600' : ''}`}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Regime e Contrato */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">🏢 Regime & Contrato</h3>
        <div className="flex flex-wrap gap-2">
          {[{id:'presencial',label:'Presencial', type:'modoTrabalho'},{id:'hibrido',label:'Híbrido', type:'modoTrabalho'},{id:'remoto',label:'Remoto', type:'modoTrabalho'}, {id:'clt',label:'CLT', type:'modalidade'},{id:'pj',label:'PJ', type:'modalidade'},{id:'estagio',label:'Estágio', type:'modalidade'}].map(m => (
            <Button
              key={m.id}
              variant={(m.type === 'modoTrabalho' ? filtros.modoTrabalho : filtros.modalidade) === m.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if(m.type === 'modoTrabalho') filtros.setModoTrabalho(p => p === m.id ? null : m.id);
                else filtros.setModalidade(p => p === m.id ? null : m.id);
              }}
              className="h-8 text-xs rounded-full bg-white shadow-sm"
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Fonte e Período (Dropdowns) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">🌐 Fonte</h3>
          <Select value={filtros.fonteFiltro} onValueChange={filtros.setFonteFiltro}>
            <SelectTrigger className="w-full h-9 text-xs bg-white shadow-sm">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {Object.entries(FONTE_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">⏳ Período</h3>
          <Select value={filtros.periodo} onValueChange={filtros.setPeriodo}>
            <SelectTrigger className="w-full h-9 text-xs bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tecnologias */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">💻 Tecnologias</h3>
          {filtros.techFiltro && (
            <button onClick={() => filtros.setTechFiltro(null)} className="text-[10px] text-red-500 hover:underline">
              Limpar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TECHS.map(t => {
            const n = vagasFiltradas.filter(v => t.regex.test(v.titulo)).length;
            if (n === 0 && !estado.loading) return null;
            const on = filtros.techFiltro === t.label;
            return (
              <Badge 
                key={t.label} 
                variant={on ? 'default' : 'outline'}
                onClick={() => filtros.setTechFiltro(p => p === t.label ? null : t.label)}
                className={`cursor-pointer transition-all border shadow-sm ${on ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
              >
                {t.label} {!estado.loading && <span className="ml-1 opacity-50 text-[9px]">{n}</span>}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Preferências */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">⚙️ Preferências</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: '✨ Apenas Novas',   active: filtros.somenteNovas,  fn: () => filtros.setSomenteNovas(v => !v) },
            { label: '👁 Não Visitadas',   active: filtros.naoVisitadas,  fn: () => filtros.setNaoVisitadas(v => !v) },
            { label: '❤️ Fixar Favoritas', active: filtros.pinarFavoritas, fn: () => filtros.setPinarFavoritas(v => !v) },
          ].map(p => (
            <Button
              key={p.label}
              variant={p.active ? 'secondary' : 'outline'}
              onClick={p.fn}
              className={`justify-start h-9 text-xs font-medium bg-white shadow-sm ${p.active ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}`}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Limpar filtros */}
      {(filtros.filtro !== 'bauru' || filtros.senioridade !== 'todas' || filtros.modalidade || filtros.techFiltro || filtros.modoTrabalho || filtros.busca || filtros.periodo !== '24h') && (
        <Button 
          variant="destructive" 
          onClick={filtros.limparFiltros}
          className="w-full mt-2 h-9 text-xs shadow-sm"
        >
          <FilterXIcon className="h-4 w-4 mr-2" /> Limpar todos os filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen antialiased transition-colors ${darkMode ? 'dark bg-[#0d0d0d] text-white' : 'bg-[#f4f4f5] text-slate-900'}`}>
      <LoadingBar visible={isAtivo} />

      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <BriefcaseIcon className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-black text-slate-900 dark:text-white">Vagas TI</span>
              <span className="text-[10px] text-indigo-500 font-bold tracking-wide">Bauru & Região</span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-sm relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={filtros.busca}
              onChange={e => filtros.setBusca(e.target.value)}
              placeholder="Buscar vagas... (pressione /)"
              className="w-full h-9 pl-9 pr-4 text-sm bg-slate-100 dark:bg-white/10 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white dark:focus:bg-white/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => filtros.setSomenteTI(v => !v)}
              className={`hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold border transition-all ${filtros.somenteTI ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/20 hover:border-indigo-300'}`}>
              <MonitorIcon className="h-3.5 w-3.5" />
              Somente TI
            </button>

            {estado.novosCount > 0 && !estado.loading && (
              <span className="relative hidden sm:flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full">
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-ping" />
                <BellIcon className="h-3 w-3" /> {estado.novosCount} novas
              </span>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <div onClick={checarLinkedin} className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">API LinkedIn</span>
                  <div className={`h-2.5 w-2.5 rounded-full ${linkedinStatus === 'ON' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : linkedinStatus === 'loading' ? 'bg-yellow-400' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {linkedinStatus === 'ON' ? 'LinkedIn respondendo normalmente' : linkedinStatus === 'loading' ? 'Testando conexão...' : 'LinkedIn bloqueou o robô ou está offline'}
                <br /><span className="text-[9px] opacity-70">Clique para testar de novo</span>
              </TooltipContent>
            </Tooltip>

            <button onClick={() => estado.fetchVagas({ force: true })} disabled={isAtivo}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-500 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 transition-all">
              <RefreshCwIcon className={`h-3.5 w-3.5 ${isAtivo ? 'animate-spin' : ''}`} />
            </button>

            <button onClick={() => setDarkMode(v => !v)}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-500 dark:text-slate-300 hover:border-slate-300 transition-all">
              {darkMode ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
            </button>

            <div className="hidden md:flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2 ml-1">
              <Link href="/candidaturas"
                className="relative h-8 px-2.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <KanbanIcon className="h-3.5 w-3.5" />
                Kanban
                {estado.kanban.size > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">{estado.kanban.size}</span>}
              </Link>
              <Link href="/sobre"
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <InfoIcon className="h-3.5 w-3.5" />
                Sobre
              </Link>
              <Link href="/perfil"
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <AwardIcon className="h-3.5 w-3.5" />
                Perfil
              </Link>
            </div>

            {session?.user && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2 ml-1">
                <Link href="/perfil" className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent hover:ring-indigo-300 transition-all cursor-pointer" title="Meu Perfil">
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </Link>
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                  className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <LogOutIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Busca sticky mobile ─────────────────────────── */}
      <div className="md:hidden sticky top-14 z-30 bg-[#f4f4f5]/95 dark:bg-[#0d0d0d]/95 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-4 py-2.5 flex items-center gap-2">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={filtros.busca}
            onChange={e => filtros.setBusca(e.target.value)}
            placeholder="Buscar vagas..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          />
        </div>
        <Sheet>
          <SheetTrigger className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300 shrink-0">
            <SlidersHorizontalIcon className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[310px] p-5 overflow-y-auto bg-white dark:bg-[#111] dark:border-white/10">
            <SheetHeader className="mb-5">
              <SheetTitle className="font-black text-base text-left">Filtros</SheetTitle>
            </SheetHeader>
            {renderFiltrosSidebar()}
          </SheetContent>
        </Sheet>
        <button onClick={() => filtros.setSomenteTI(v => !v)}
          className={`h-9 px-3 flex items-center gap-1 rounded-xl text-xs font-bold border transition-all shrink-0 ${filtros.somenteTI ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-white/10 text-slate-600 border-slate-200 dark:border-white/20'}`}>
          <MonitorIcon className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">TI</span>
        </button>
      </div>

      {/* ── Layout Principal ────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 pb-24 md:pb-8">
        <div className="flex gap-6 items-start">
          <aside className="hidden lg:flex shrink-0 w-64 flex-col gap-4 sticky top-20">
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/10 p-4 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
              {renderFiltrosSidebar()}
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white p-5 sm:p-6 shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2Nmgtdi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">Catálogo de Vagas TI</h1>
                  <p className="text-indigo-200 text-xs mt-1">
                    {estado.loading ? <>Buscando em todos os portais<LoadingDots /></> : hora ? `Atualizado ${hora} · ${estado.vagas.length} vagas no banco` : 'Pronto'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {estado.novosCount > 0 && !estado.loading && (
                    <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm border border-white/25 text-[11px] font-bold px-3 py-1.5 rounded-full">
                      <BellIcon className="h-3 w-3" /> {estado.novosCount} novas vagas
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(estado.fontes).filter(([,n]) => n > 0).slice(0, 5).map(([fonte]) => (
                      <img key={fonte} src={`https://www.google.com/s2/favicons?domain=${FONTE_CONFIG[fonte] ? (() => { const m = {linkedin:'linkedin.com',vagasbauru:'vagasbauru.com.br',indeed:'indeed.com',vagascom:'vagas.com.br',ciee:'ciee.org.br',catho:'catho.com.br',empregoscom:'empregos.com.br',querovagastech:'querovagastech.com.br'}; return m[fonte]||''; })() : ''}&sz=32`}
                        alt={fonte} width={18} height={18} className="rounded-md bg-white/20 p-0.5"
                        onError={e => { e.currentTarget.style.display='none'; }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white text-base tabular-nums">{vagasOrdenadas.length}</strong>
                  {' '}vaga{vagasOrdenadas.length !== 1 ? 's' : ''}
                </span>
                {filtros.techFiltro && (
                  <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full px-2.5 py-1 font-semibold">
                    {filtros.techFiltro} <button onClick={() => filtros.setTechFiltro(null)} className="hover:text-red-500 ml-0.5"><XIcon className="h-3 w-3" /></button>
                  </span>
                )}
                {filtros.busca && (
                  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full px-2.5 py-1 font-semibold">
                    "{filtros.busca}" <button onClick={() => filtros.setBusca('')} className="hover:text-red-500 ml-0.5"><XIcon className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-0.5">
                  {[
                    { id: 'grade',    icon: <LayoutGridIcon className="h-3.5 w-3.5" />, active: filtros.vista === 'grade' && filtros.tamanho === 'normal',    fn: () => { filtros.setVista('grade'); filtros.setTamanho('normal'); } },
                    { id: 'compacto', icon: <SparklesIcon className="h-3.5 w-3.5" />,  active: filtros.vista === 'grade' && filtros.tamanho === 'compacto', fn: () => { filtros.setVista('grade'); filtros.setTamanho('compacto'); } },
                    { id: 'lista',    icon: <ListIcon className="h-3.5 w-3.5" />,       active: filtros.vista === 'lista',                             fn: () => filtros.setVista('lista') },
                  ].map(v => (
                    <button key={v.id} onClick={v.fn}
                      className={`p-1.5 rounded-lg transition-all ${v.active ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>
                      {v.icon}
                    </button>
                  ))}
                </div>
                <Select value={filtros.ordem} onValueChange={filtros.setOrdem}>
                  <SelectTrigger className="h-8 text-xs w-[130px] border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data" className="text-xs">Mais recente</SelectItem>
                    <SelectItem value="empresa" className="text-xs">Empresa A–Z</SelectItem>
                    <SelectItem value="titulo" className="text-xs">Título A–Z</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={exportarCSV}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 transition-all">
                      <DownloadIcon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Exportar CSV</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {onboarding && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl">
                <SparklesIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-0.5">Bem-vindo ao Vagas TI Bauru! 👋</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Pressione <kbd className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-[10px] font-mono border border-blue-200 dark:border-blue-800">/</kbd> para buscar. Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-[10px]">-palavra</code> para excluir termos.</p>
                </div>
                <button onClick={() => { setOnboarding(false); localStorage.setItem('onboarding_done', '1'); }}
                  className="text-blue-400 hover:text-blue-700 shrink-0"><XIcon className="h-4 w-4" /></button>
              </div>
            )}

            {estado.error && (
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl text-sm text-red-700 dark:text-red-400">
                <span>Erro ao carregar: {estado.error}</span>
                <button onClick={() => estado.fetchVagas()} className="text-xs font-bold underline hover:no-underline">Tentar novamente</button>
              </div>
            )}

            {estado.ocultas.size > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <EyeOffIcon className="h-3.5 w-3.5" />
                <span>{estado.ocultas.size} vaga{estado.ocultas.size > 1 ? 's ocultadas' : ' ocultada'}</span>
                <button onClick={() => { estado.setOcultas(new Set()); localStorage.removeItem(LS_OCULTAS); toast.success('Vagas restauradas'); }}
                  className="text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                  mostrar todas
                </button>
              </div>
            )}

            {(() => {
              const gridClass = filtros.vista === 'lista'
                ? 'flex flex-col gap-2'
                : filtros.tamanho === 'compacto'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4';

              const renderCard = (v, i) => (
                <VagaCard
                  key={v.link}
                  vaga={v}
                  userPreferencias={userPreferencias}
                  isNovo={estado.novasLinks.has(v.link)}
                  isFavorita={estado.favoritas.has(v.link)}
                  ehDuplicata={duplicatas.has(v.link)}
                  foiVisitada={estado.visitadas.has(v.link)}
                  noKanban={estado.kanban.has(v.link)}
                  onOpen={abrirVaga}
                  onToggleFav={estado.toggleFavorita}
                  onOcultar={estado.ocultarVaga}
                  onKanban={estado.adicionarKanbanRapido}
                  onEmpresaClick={emp => { filtros.setBusca(emp); filtros.salvarHistorico(emp); }}
                  onTechClick={tech => filtros.setTechFiltro(p => p === tech ? null : tech)}
                  onReport={reportNotTI}
                  busca={filtros.busca}
                  vista={filtros.vista}
                  tamanho={filtros.tamanho}
                  index={i}
                />
              );

              const emptyState = (
                <div className="col-span-full py-24 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 mb-4 shadow-sm">
                    <BriefcaseIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-bold text-slate-800 dark:text-white text-lg">Nenhuma vaga encontrada</p>
                  <p className="text-sm text-slate-400 mt-1">Tente outros filtros ou amplie o período</p>
                  <button onClick={filtros.limparFiltros} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all">
                    Limpar filtros
                  </button>
                </div>
              );

              if (estado.loading) return (
                <div>
                  <CenteredLoader />
                  <div key={estado.gridKey} className={gridClass}>
                    {Array.from({ length: 6 }).map((_, i) => <VagaCardSkeleton key={i} index={i} vista={filtros.vista} />)}
                  </div>
                </div>
              );

              if (filtros.agrupar !== 'nenhum' && gruposVagas) {
                if (vagasOrdenadas.length === 0) return <div className={gridClass}>{emptyState}</div>;
                return (
                  <div className="flex flex-col gap-8">
                    {gruposVagas.map(({ key, label, items }) => (
                      <div key={key}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <LayersIcon className="h-3.5 w-3.5" />{label} <span className="font-normal opacity-60">({items.length})</span>
                          </span>
                          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                        </div>
                        <div key={`${estado.gridKey}-${key}`} className={gridClass}>{items.map(renderCard)}</div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (vagasOrdenadas.length === 0 && !estado.error) return <div className={gridClass}>{emptyState}</div>;

              return (
                <div key={`${estado.gridKey}-${filtros.filtro}`} className={`${gridClass} fade-slide-up`}>
                  {vagasOrdenadas.map(renderCard)}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <footer className="border-t border-black/5 dark:border-white/10 py-8 text-center text-xs text-slate-400 dark:text-slate-600">
        Vagas de TI em Bauru ·{' '}
        <a href="https://www.linkedin.com/in/daniel-op/" target="_blank" rel="noopener noreferrer"
          className="hover:text-indigo-500 transition-colors font-medium">
          Daniel Ortega Pereira
        </a>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 flex items-center justify-around h-16 px-2 safe-area-bottom">
        <Link href="/" className="flex flex-col items-center justify-center gap-1 w-16 h-full text-indigo-600 dark:text-indigo-400">
          <BriefcaseIcon className="h-5 w-5" />
          <span className="text-[9px] font-bold">Vagas</span>
        </Link>
        <Link href="/candidaturas" className="relative flex flex-col items-center justify-center gap-1 w-16 h-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
          <KanbanIcon className="h-5 w-5" />
          <span className="text-[9px] font-medium">Kanban</span>
          {estado.kanban.size > 0 && <span className="absolute top-2.5 right-3 w-3.5 h-3.5 bg-indigo-600 text-[7px] text-white font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#111]">{estado.kanban.size}</span>}
        </Link>
        <Link href="/perfil" className="flex flex-col items-center justify-center gap-1 w-16 h-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
          <AwardIcon className="h-5 w-5" />
          <span className="text-[9px] font-medium">Perfil</span>
        </Link>
      </nav>

      <ScrollToTopButton />

      {selectedVaga && (() => {
        const idx  = vagasOrdRef.current.findIndex(v => v.link === selectedVaga.link);
        const prev = idx > 0 ? vagasOrdRef.current[idx - 1] : null;
        const next = idx < vagasOrdRef.current.length - 1 ? vagasOrdRef.current[idx + 1] : null;
        return (
          <VagaModal
            vaga={selectedVaga}
            vagas={estado.vagas}
            onClose={() => setSelectedVaga(null)}
            onOpen={abrirVaga}
            onPrev={prev ? () => abrirVaga(prev) : null}
            onNext={next ? () => abrirVaga(next) : null}
          />
        );
      })()}
    </div>
  );
}

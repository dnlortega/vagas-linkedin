'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeftIcon, TrashIcon, ExternalLinkIcon, MapPinIcon, ClockIcon, DownloadIcon, StickyNoteIcon, BellIcon, UserIcon, DollarSignIcon, BarChart2Icon, ChevronDownIcon, ChevronUpIcon, TagIcon, XIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';

const LS_KANBAN = 'vagas_kanban';
const LS_FAV    = 'vagas_favoritas';

const COLUNAS = [
  { id: 'salvo',       label: 'Salvos',         dot: 'bg-slate-400',   header: 'bg-slate-50 border-slate-200',   card: 'border-slate-200'  },
  { id: 'candidatado', label: 'Candidatado',    dot: 'bg-blue-500',    header: 'bg-blue-50 border-blue-200',     card: 'border-blue-200'   },
  { id: 'entrevista',  label: 'Em entrevista',  dot: 'bg-amber-500',   header: 'bg-amber-50 border-amber-200',   card: 'border-amber-200'  },
  { id: 'rejeitado',   label: 'Rejeitado',      dot: 'bg-rose-400',    header: 'bg-rose-50 border-rose-200',     card: 'border-rose-200'   },
  { id: 'arquivado',   label: 'Arquivado',      dot: 'bg-gray-300',    header: 'bg-gray-50 border-gray-200',     card: 'border-gray-200'   },
];

const STATUS_OPTIONS = COLUNAS.map(c => ({ value: c.id, label: c.label }));

const ETIQUETAS = [
  { id: 'urgente',    label: 'Urgente',     bg: 'bg-rose-100',   text: 'text-rose-700',   border: 'border-rose-300'   },
  { id: 'interesse',  label: 'Interesse',   bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  { id: 'remoto',     label: 'Remoto',      bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300'   },
  { id: 'senioridade',label: 'Sênior',      bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  { id: 'estagio',    label: 'Estágio',     bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300'  },
];

function diasDesde(isoDate) {
  if (!isoDate) return null;
  return Math.floor((Date.now() - new Date(isoDate)) / 86400000);
}

function exportarKanbanCSV(kanban) {
  const header = 'Título,Empresa,Local,Fonte,Status,Adicionado em,Prazo,Lembrete,Salário,Contato RH,Etiquetas,Notas';
  const rows = Object.values(kanban).map(v =>
    [
      v.titulo, v.empresa, v.local, v.fonte, v.status,
      v.adicionadoEm || '', v.prazo || '', v.lembrete || '',
      v.salario || '', v.contatoRH || '',
      (v.etiquetas || []).join(';'),
      (v.notas || '').replace(/\n/g, ' '),
    ]
      .map(x => `"${String(x || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: `candidaturas-${new Date().toISOString().split('T')[0]}.csv` }).click();
  URL.revokeObjectURL(url);
}

function EtiquetaChip({ id, onRemove }) {
  const et = ETIQUETAS.find(e => e.id === id);
  if (!et) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${et.bg} ${et.text} ${et.border}`}>
      {et.label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
          <XIcon className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

function StatsPanel({ vagas }) {
  const total       = vagas.length;
  const candidatados = vagas.filter(v => v.status === 'candidatado' || v.status === 'entrevista' || v.status === 'rejeitado').length;
  const entrevistas  = vagas.filter(v => v.status === 'entrevista').length;
  const rejeitados   = vagas.filter(v => v.status === 'rejeitado').length;
  const taxaEntrev   = candidatados > 0 ? Math.round((entrevistas / candidatados) * 100) : 0;
  const taxaRejeicao = candidatados > 0 ? Math.round((rejeitados  / candidatados) * 100) : 0;

  const statCards = [
    { label: 'Total no quadro',      value: total,        color: 'text-gray-900',   bg: 'bg-gray-50'   },
    { label: 'Candidaturas enviadas', value: candidatados, color: 'text-blue-700',   bg: 'bg-blue-50'   },
    { label: 'Entrevistas',           value: entrevistas,  color: 'text-amber-700',  bg: 'bg-amber-50'  },
    { label: 'Taxa de entrevista',    value: `${taxaEntrev}%`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Taxa de rejeição',      value: `${taxaRejeicao}%`, color: 'text-rose-700', bg: 'bg-rose-50'  },
  ];

  return (
    <div className="mb-6 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Estatísticas</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barra de progresso do funil */}
      {candidatados > 0 && (
        <div className="mt-4">
          <p className="text-[11px] text-gray-400 font-semibold mb-1.5">Funil de candidaturas</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 gap-px">
            <div className="bg-blue-400 transition-all" style={{ width: `${Math.round(((candidatados - entrevistas - rejeitados) / total) * 100)}%` }} title="Candidatado" />
            <div className="bg-amber-400 transition-all" style={{ width: `${Math.round((entrevistas / total) * 100)}%` }} title="Em entrevista" />
            <div className="bg-rose-400 transition-all" style={{ width: `${Math.round((rejeitados / total) * 100)}%` }} title="Rejeitado" />
          </div>
          <div className="flex gap-4 mt-1.5">
            {[['bg-blue-400','Candidatado'],['bg-amber-400','Entrevista'],['bg-rose-400','Rejeitado']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className={`h-2 w-2 rounded-full ${c}`} />{l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Candidaturas() {
  const [kanban,     setKanban]     = useState({});
  const [favoritas,  setFavoritas]  = useState([]);
  const [editNota,   setEditNota]   = useState(null);
  const [expandido,  setExpandido]  = useState(null);
  const [mostrarStats, setMostrarStats] = useState(false);
  const [buscaKanban,  setBuscaKanban]  = useState('');
  const [ordemKanban,  setOrdemKanban]  = useState('adicionado');
  const [dragLinkId,   setDragLinkId]   = useState(null);
  const [dragOverCol,  setDragOverCol]  = useState(null);

  useEffect(() => {
    try { setKanban(JSON.parse(localStorage.getItem(LS_KANBAN) || '{}')); } catch (_) {}
    try { setFavoritas(JSON.parse(localStorage.getItem(LS_FAV) || '[]')); } catch (_) {}
  }, []);

  function save(next) {
    setKanban(next);
    localStorage.setItem(LS_KANBAN, JSON.stringify(next));
  }

  function update(link, patch) {
    save({ ...kanban, [link]: { ...kanban[link], ...patch } });
  }

  function remover(link) {
    const next = { ...kanban };
    delete next[link];
    save(next);
    if (expandido === link) setExpandido(null);
  }

  function adicionarFavorita(link) {
    if (kanban[link]) return;
    save({
      ...kanban,
      [link]: { link, titulo: 'Vaga favorita', empresa: '—', local: '—', data: null, status: 'salvo', fonte: '', adicionadoEm: new Date().toISOString() },
    });
  }

  function toggleEtiqueta(link, etId) {
    const atual = kanban[link]?.etiquetas || [];
    const nova  = atual.includes(etId) ? atual.filter(e => e !== etId) : [...atual, etId];
    update(link, { etiquetas: nova });
  }

  const todasVagasBruto = Object.entries(kanban).map(([link, v]) => ({ ...v, link }));
  const todasVagas = todasVagasBruto
    .filter(v => !buscaKanban || `${v.titulo} ${v.empresa}`.toLowerCase().includes(buscaKanban.toLowerCase()))
    .sort((a, b) => {
      if (ordemKanban === 'empresa') return (a.empresa || '').localeCompare(b.empresa || '', 'pt-BR');
      if (ordemKanban === 'titulo')  return (a.titulo  || '').localeCompare(b.titulo  || '', 'pt-BR');
      const da = a.adicionadoEm ? new Date(a.adicionadoEm) : 0;
      const db = b.adicionadoEm ? new Date(b.adicionadoEm) : 0;
      return db - da;
    });
  const favsForaBoard = favoritas.filter(l => !kanban[l]);
  const hoje          = new Date().toISOString().split('T')[0];
  const lembreteVencido = link => { const l = kanban[link]?.lembrete; return l && l < hoje; };
  const prazoVencido    = link => { const p = kanban[link]?.prazo;    return p && p < hoje; };
  const total = todasVagas.filter(v => v.status !== 'arquivado').length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900">Minhas Candidaturas</h1>
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{total}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Busca kanban */}
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar candidatura…"
                value={buscaKanban}
                onChange={e => setBuscaKanban(e.target.value)}
                className="pl-8 pr-3 h-9 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-400 w-44"
              />
              {buscaKanban && (
                <button onClick={() => setBuscaKanban('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Ordenar kanban */}
            <select value={ordemKanban} onChange={e => setOrdemKanban(e.target.value)}
              className="h-9 text-xs border border-gray-200 rounded-xl px-2 bg-white focus:outline-none text-gray-600">
              <option value="adicionado">Mais recente</option>
              <option value="empresa">Empresa A–Z</option>
              <option value="titulo">Título A–Z</option>
            </select>

            <button
              onClick={() => setMostrarStats(s => !s)}
              className={`inline-flex items-center gap-1.5 text-sm border rounded-xl px-3 py-2 transition-all font-medium ${mostrarStats ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 hover:text-gray-800 border-gray-200 bg-white hover:border-gray-400'}`}
            >
              <BarChart2Icon className="h-4 w-4" />
              Stats
            </button>
            <button
              onClick={() => exportarKanbanCSV(kanban)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:border-gray-400 transition-all font-medium"
            >
              <DownloadIcon className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Stats panel */}
        {mostrarStats && todasVagas.length > 0 && <StatsPanel vagas={todasVagas} />}

        {/* Favoritas fora da board */}
        {favsForaBoard.length > 0 && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <p className="text-sm text-rose-700 font-bold mb-3">
              ❤️ {favsForaBoard.length} vaga{favsForaBoard.length > 1 ? 's favoritas' : ' favorita'} fora do quadro
            </p>
            <div className="flex flex-wrap gap-2">
              {favsForaBoard.map(link => (
                <button key={link} onClick={() => adicionarFavorita(link)}
                  className="text-xs bg-rose-500 text-white px-3 py-1.5 rounded-full hover:bg-rose-600 transition-colors font-semibold">
                  + Adicionar ao quadro
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Board vazio */}
        {todasVagas.length === 0 ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-sm border border-gray-100 mb-5">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <p className="font-bold text-gray-800 text-xl">Nenhuma candidatura ainda</p>
            <p className="text-base text-gray-400 mt-2 mb-6">Abra uma vaga e clique em "Ao quadro" para acompanhar</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors">
              <ArrowLeftIcon className="h-4 w-4" /> Ver vagas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {COLUNAS.map(col => {
              const vagas = todasVagas.filter(v => (v.status || 'salvo') === col.id);
              const isDropTarget = dragOverCol === col.id && dragLinkId !== null;
              return (
                <div key={col.id}
                  className={`flex flex-col gap-3 transition-all duration-200 ${isDropTarget ? 'scale-[1.02]' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
                  onDrop={() => {
                    if (dragLinkId) update(dragLinkId, { status: col.id });
                    setDragLinkId(null);
                    setDragOverCol(null);
                  }}
                >
                  {/* Cabeçalho coluna */}
                  <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${col.header} ${isDropTarget ? 'shadow-md' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                      <span className="text-xs font-bold text-gray-700">{col.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">{vagas.length}</span>
                  </div>

                  {/* Cards */}
                  <div className={`flex flex-col gap-2.5 min-h-16 rounded-xl transition-all duration-200 ${isDropTarget ? 'bg-blue-50/60 ring-2 ring-blue-200 ring-dashed p-1.5' : ''}`}>
                    {vagas.map(vaga => {
                      const dias     = diasDesde(vaga.adicionadoEm);
                      const vencLemb = lembreteVencido(vaga.link);
                      const vencPraz = prazoVencido(vaga.link);
                      const editando = editNota === vaga.link;
                      const aberto   = expandido === vaga.link;
                      const isDragging = dragLinkId === vaga.link;

                      return (
                        <div key={vaga.link}
                          draggable
                          onDragStart={() => setDragLinkId(vaga.link)}
                          onDragEnd={() => { setDragLinkId(null); setDragOverCol(null); }}
                          className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 transition-all cursor-grab active:cursor-grabbing select-none
                            ${isDragging ? 'opacity-40 scale-95 shadow-none' : 'hover:shadow-md'}
                            ${col.card} ${vencLemb || vencPraz ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                        >
                          {/* Alertas */}
                          {(vencLemb || vencPraz) && (
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                              <BellIcon className="h-3.5 w-3.5 flex-shrink-0" />
                              {vencPraz ? `Prazo vencido: ${vaga.prazo}` : `Lembrete: ${vaga.lembrete}`}
                            </div>
                          )}

                          {/* Etiquetas */}
                          {(vaga.etiquetas || []).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(vaga.etiquetas || []).map(id => (
                                <EtiquetaChip key={id} id={id} onRemove={() => toggleEtiqueta(vaga.link, id)} />
                              ))}
                            </div>
                          )}

                          {/* Título */}
                          <div>
                            <p className="text-[11px] text-gray-400 font-semibold truncate mb-1">{vaga.empresa || '—'}</p>
                            <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{vaga.titulo || vaga.link}</p>
                          </div>

                          {/* Metadados */}
                          <div className="flex flex-col gap-1 text-xs text-gray-400">
                            {vaga.local && vaga.local !== 'N/A' && (
                              <span className="flex items-center gap-1.5"><MapPinIcon className="h-3 w-3" />{vaga.local}</span>
                            )}
                            {vaga.adicionadoEm && (
                              <span className="flex items-center gap-1.5">
                                <ClockIcon className="h-3 w-3" />
                                {dias === 0 ? 'Adicionado hoje' : dias === 1 ? 'Adicionado ontem' : `Adicionado há ${dias} dias`}
                              </span>
                            )}
                            {vaga.salario && (
                              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                                <DollarSignIcon className="h-3 w-3" />{vaga.salario}
                              </span>
                            )}
                          </div>

                          {/* Notas rápidas */}
                          {editando ? (
                            <textarea
                              autoFocus
                              value={vaga.notas || ''}
                              onChange={e => update(vaga.link, { notas: e.target.value })}
                              onBlur={() => setEditNota(null)}
                              placeholder="Sua nota…"
                              rows={3}
                              className="text-xs border border-blue-300 rounded-lg px-2.5 py-2 resize-none focus:outline-none text-gray-700"
                            />
                          ) : (
                            <button
                              onClick={() => setEditNota(vaga.link)}
                              className="flex items-start gap-1.5 text-left text-xs text-gray-400 hover:text-blue-600 transition-colors group"
                            >
                              <StickyNoteIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 group-hover:text-blue-500" />
                              <span className="line-clamp-2">
                                {vaga.notas ? vaga.notas : <span className="italic">Adicionar nota…</span>}
                              </span>
                            </button>
                          )}

                          {/* Expandir / recolher campos extras */}
                          <button
                            onClick={() => setExpandido(aberto ? null : vaga.link)}
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors font-medium"
                          >
                            {aberto ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                            {aberto ? 'Menos detalhes' : 'Mais detalhes'}
                          </button>

                          {aberto && (
                            <div className="flex flex-col gap-2.5 pt-1 border-t border-gray-100">

                              {/* Contato RH */}
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                                  <UserIcon className="h-3 w-3" /> Contato RH
                                </label>
                                <input
                                  type="text"
                                  value={vaga.contatoRH || ''}
                                  onChange={e => update(vaga.link, { contatoRH: e.target.value })}
                                  placeholder="Nome, e-mail ou telefone"
                                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-700"
                                />
                              </div>

                              {/* Salário combinado */}
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                                  <DollarSignIcon className="h-3 w-3" /> Salário combinado
                                </label>
                                <input
                                  type="text"
                                  value={vaga.salario || ''}
                                  onChange={e => update(vaga.link, { salario: e.target.value })}
                                  placeholder="Ex: R$ 4.500"
                                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-700"
                                />
                              </div>

                              {/* Prazo da vaga */}
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                                  📅 Prazo da vaga
                                </label>
                                <input
                                  type="date"
                                  value={vaga.prazo || ''}
                                  onChange={e => update(vaga.link, { prazo: e.target.value || null })}
                                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-600"
                                />
                              </div>

                              {/* Lembrete */}
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                                  <BellIcon className="h-3 w-3" /> Lembrete
                                </label>
                                <input
                                  type="date"
                                  value={vaga.lembrete || ''}
                                  onChange={e => update(vaga.link, { lembrete: e.target.value || null })}
                                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-600"
                                />
                              </div>

                              {/* Etiquetas */}
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
                                  <TagIcon className="h-3 w-3" /> Etiquetas
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {ETIQUETAS.map(et => {
                                    const ativa = (vaga.etiquetas || []).includes(et.id);
                                    return (
                                      <button
                                        key={et.id}
                                        onClick={() => toggleEtiqueta(vaga.link, et.id)}
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${ativa ? `${et.bg} ${et.text} ${et.border}` : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400'}`}
                                      >
                                        {et.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Ações */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                            <select
                              value={vaga.status || 'salvo'}
                              onChange={e => update(vaga.link, { status: e.target.value })}
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-blue-400 font-medium"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <a href={vaga.link} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                              <ExternalLinkIcon className="h-4 w-4" />
                            </a>
                            <button onClick={() => remover(vaga.link)}
                              className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

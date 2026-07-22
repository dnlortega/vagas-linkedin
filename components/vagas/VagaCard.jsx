import { 
  HeartIcon, EyeOffIcon, AlertTriangleIcon, 
  ChevronRightIcon, MapPinIcon, CalendarIcon, KanbanIcon 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  tipoLocalidade, LOCALIDADE_CONFIG, FONTE_CONFIG, formatData, 
  detectSenioridade, detectarTechs, TECHS, iniciais 
} from '@/lib/constants';
import { Highlight } from './SharedUI';

export function VagaCard({ vaga, isNovo, isFavorita, ehDuplicata, foiVisitada, noKanban, onOpen, onToggleFav, onOcultar, onEmpresaClick, onTechClick, onKanban, onReport, busca = '', vista = 'grade', tamanho = 'normal', index = 0, userPreferencias = [] }) {
  const tipo     = tipoLocalidade(vaga.local);
  const loc      = LOCALIDADE_CONFIG[tipo];
  const fonteCfg = FONTE_CONFIG[vaga.fonte] || { label: vaga.fonte, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  const dataRel  = formatData(vaga.data);
  const senior   = detectSenioridade(vaga.titulo);
  const techsRegex = detectarTechs(vaga.titulo);
  const techsIA = (vaga.competencias || []).map(comp => {
    const regexMatch = TECHS.find(t => t.label.toLowerCase() === comp.toLowerCase() || t.regex.test(comp));
    return { label: comp, color: regexMatch ? regexMatch.color : 'bg-slate-100 text-slate-700 border-slate-200' };
  });
  const techsMap = new Map();
  techsRegex.forEach(t => techsMap.set(t.label.toLowerCase(), t));
  techsIA.forEach(t => techsMap.set(t.label.toLowerCase(), t));
  const techs = Array.from(techsMap.values());

  const TI_REGEX = /\b(desenvolvedor|programador|software|fullstack|full[- ]?stack|front[- ]?end|back[- ]?end|devops|sre|cloud|dados|data|bi\b|power\s?bi|analista.*(sistemas?|t\.?i\.?|dados|suporte|infra|seguran[çc]a)|engenheiro.*(software|dados|cloud)|arquiteto.*(t\.?i\.?|software|solu)|dba|suporte.*(t\.?i\.?|t[ée]cnico)|help.*desk|service.*desk|infra|segurança|cyber|tecnologia|tech|sistemas?|computação|c#|java|python|php|javascript|typescript|node)/i;
  const isTI = TI_REGEX.test(vaga.titulo);

  const matchPref = userPreferencias.filter(p => techs.some(t => t.label.toLowerCase() === p.toLowerCase()) || vaga.titulo.toLowerCase().includes(p.toLowerCase()));

  if (vista === 'lista') {
    return (
      <div style={{ animationDelay: `${Math.min(index * 15, 200)}ms` }} className="card-in">
        <div
          onClick={() => onOpen(vaga)}
          className={`cursor-pointer flex items-center gap-3 bg-white rounded-[14px] px-4 py-3.5 group relative transition-all duration-150
            shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] hover:-translate-y-px ${
              foiVisitada ? 'border border-slate-100 opacity-60' :
              isTI ? 'border-2 border-indigo-200/60 bg-indigo-50/5 hover:border-indigo-400' :
              'border border-slate-100 hover:border-slate-200'
            }`}
        >
          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: isTI ? '#6366f1' : (fonteCfg.accent || loc.accent) }} />
          <div className="h-11 w-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ml-2 shadow-sm ring-[3px] ring-white" style={{ backgroundColor: isTI ? '#6366f1' : loc.accent }}>
            {iniciais(vaga.empresa)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1 mb-1">
              <span className={`inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-bold uppercase ${fonteCfg.color}`}>{fonteCfg.label}</span>
              {isTI && (
                <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 animate-pulse shadow-sm shadow-indigo-150">
                  ✨ DESTAQUE TI
                </span>
              )}
              {matchPref.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm border border-emerald-200 cursor-help" title={`Match: ${matchPref.join(', ')}`}>🌟 MATCH ({matchPref.length})</span>}
              {senior && <span className={`text-[10px] font-semibold px-1.5 py-px rounded-md border ${senior === 'junior' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : senior === 'senior' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}>{senior === 'junior' ? 'Jr' : senior === 'senior' ? 'Sr' : 'Pl'}</span>}
              {isNovo && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-px rounded-full">Novo</span>}
              {noKanban && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-px rounded-md border border-indigo-200">📋</span>}
              {ehDuplicata && <Tooltip><TooltipTrigger asChild><span className="bg-orange-50 text-orange-600 text-[10px] font-semibold px-1.5 py-px rounded-md border border-orange-200 cursor-help">2+</span></TooltipTrigger><TooltipContent className="text-xs">Aparece em mais de uma fonte</TooltipContent></Tooltip>}
            </div>
            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 truncate transition-colors leading-snug">
              <Highlight text={vaga.titulo} query={busca} />
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={e => { e.stopPropagation(); onEmpresaClick?.(vaga.empresa); }}>
              {vaga.empresa === 'N/A' ? '—' : vaga.empresa}
              {vaga.local !== 'N/A' && <> · {vaga.local}</>}
              {dataRel && <> · {dataRel}</>}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {techs.slice(0, 2).map(t => (
              <button key={t.label} onClick={e => { e.stopPropagation(); onTechClick?.(t.label); }}
                className={`hidden lg:block text-[10px] font-semibold px-2 py-0.5 rounded-md border hover:scale-105 transition-all flex-shrink-0 ${t.color}`}>{t.label}</button>
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); onToggleFav(vaga.link, e); }} className="p-1.5 flex-shrink-0 hover:scale-110 transition-transform">
            <HeartIcon className={`h-4 w-4 transition-colors ${isFavorita ? 'fill-rose-500 text-rose-500' : 'text-gray-300 hover:text-rose-400'}`} />
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={e => { e.stopPropagation(); onOcultar?.(vaga.link, e); }} className="p-1.5 flex-shrink-0 text-gray-200 hover:text-gray-500 transition-colors">
                <EyeOffIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Ocultar</TooltipContent>
          </Tooltip>
          {onReport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={e => onReport(vaga, e)} className="p-1.5 flex-shrink-0 text-red-200 hover:text-red-500 transition-colors">
                  <AlertTriangleIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-red-600 border-red-700">Reportar: Não é TI</TooltipContent>
            </Tooltip>
          )}
          <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
        </div>
      </div>
    );
  }

  const compact = tamanho === 'compacto';
  return (
    <div style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }} className="card-in h-full">
      <div
        onClick={() => onOpen(vaga)}
        className={`cursor-pointer h-full flex flex-col bg-white rounded-[14px] overflow-hidden border transition-all duration-200 group relative
          shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.03)]
          hover:shadow-[0_10px_28px_rgba(15,23,42,0.10),0_4px_10px_rgba(15,23,42,0.05)]
          hover:-translate-y-1 ${
            foiVisitada ? 'border-slate-100 opacity-60' : 
            isTI ? 'border-indigo-150/90 bg-indigo-50/5 hover:border-indigo-400 shadow-indigo-100/30' :
            'border-slate-100 hover:border-slate-200'
          }`}
      >
        <div className="h-[3.5px] w-full flex-shrink-0" style={{ background: isTI ? 'linear-gradient(90deg, #6366f1, #a855f7)' : `linear-gradient(90deg, ${fonteCfg.accent || loc.accent}, ${fonteCfg.accent || loc.accent}20)` }} />

        <div className="absolute top-3.5 right-3 z-10 flex items-center gap-0.5">
          {ehDuplicata && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] bg-orange-50 text-orange-500 border border-orange-200 px-1.5 py-0.5 rounded-full cursor-help font-semibold">2+</span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Aparece em mais de uma fonte</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={e => { e.stopPropagation(); onOcultar?.(vaga.link, e); }}
                className="p-1.5 rounded-full text-gray-200 hover:text-gray-500 hover:bg-gray-100 transition-all">
                <EyeOffIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Ocultar vaga</TooltipContent>
          </Tooltip>
          {onReport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={e => onReport(vaga, e)}
                  className="p-1.5 rounded-full text-red-200 hover:text-red-500 hover:bg-red-50 transition-all">
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-red-600 border-red-700 text-white">Reportar: Não é TI</TooltipContent>
            </Tooltip>
          )}
          <button onClick={e => onToggleFav(vaga.link, e)}
            className="p-1.5 rounded-full transition-all hover:scale-110 active:scale-95">
            <HeartIcon className={`h-4 w-4 transition-colors ${isFavorita ? 'fill-rose-500 text-rose-500' : 'text-gray-300 hover:text-rose-400'}`} />
          </button>
        </div>

        {isNovo && (
          <span className="absolute top-4 right-20 z-10 bg-green-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm">Novo</span>
        )}
        {noKanban && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute top-11 right-20 z-10 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">📋</span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Já no seu quadro</TooltipContent>
          </Tooltip>
        )}

        <div className={`${compact ? 'px-3.5 pt-3.5 pb-2' : 'px-5 pt-5 pb-3'} flex gap-3 items-start`}>
          <div className={`${compact ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base'} rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-sm ring-[3px] ring-white transition-transform duration-200 group-hover:scale-105`}
            style={{ backgroundColor: loc.accent }}>
            {iniciais(vaga.empresa)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-xs font-semibold text-gray-400 truncate leading-none mb-1.5 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={e => { e.stopPropagation(); onEmpresaClick?.(vaga.empresa); }}
              title="Clique para filtrar por empresa">
              {vaga.empresa === 'N/A' ? '—' : vaga.empresa}
            </p>
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${fonteCfg.color}`}>
              {fonteCfg.label}
            </span>
            {isTI && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ml-1.5 animate-pulse shadow-sm shadow-indigo-100">
                ✨ Destaque TI
              </span>
            )}
            {matchPref.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ml-1.5 shadow-sm shadow-emerald-100 cursor-help" title={`Match: ${matchPref.join(', ')}`}>
                🌟 Match ({matchPref.length})
              </span>
            )}
          </div>
        </div>

        <div className={`${compact ? 'px-3.5 pb-2' : 'px-5 pb-4'} flex-1`}>
          <h3 className={`${compact ? 'text-[0.82rem]' : 'text-[0.95rem]'} font-bold leading-snug line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-150`}>
            <Highlight text={vaga.titulo} query={busca} />
          </h3>
        </div>

        <div className={`${compact ? 'px-3.5 pb-2' : 'px-5 pb-4'} space-y-2`}>
          {!compact && (
            <div className="flex flex-col gap-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate">{vaga.local !== 'N/A' ? vaga.local : '—'}</span>
              </span>
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{dataRel ?? <span className="italic text-gray-400">sem data</span>}</span>
              </span>
            </div>
          )}
          {compact && (
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
              <MapPinIcon className="h-3 w-3 shrink-0" />
              {vaga.local !== 'N/A' ? vaga.local : '—'} {dataRel ? `· ${dataRel}` : ''}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {loc.label && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${loc.badge}`}>{loc.label}</span>}
            {senior && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                senior === 'junior' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                senior === 'senior' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                     'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                {senior === 'junior' ? 'Jr' : senior === 'senior' ? 'Sr' : 'Pl'}
              </span>
            )}
            {techs.slice(0, compact ? 2 : 3).map(t => (
              <button key={t.label} onClick={e => { e.stopPropagation(); onTechClick?.(t.label); }}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all hover:scale-105 active:scale-95 ${t.color}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {!compact && (
          <div className="px-5 pb-5 flex gap-2">
            <div className="flex-1 h-9 rounded-[10px] bg-slate-50 group-hover:bg-blue-600 border border-slate-200 group-hover:border-blue-600
              text-slate-500 group-hover:text-white text-xs font-semibold tracking-wide
              transition-all duration-200 flex items-center justify-center gap-1.5">
              Ver detalhes
              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.stopPropagation(); onKanban?.(vaga, e); }}
                  disabled={noKanban}
                  className={`h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl border text-xs transition-all ${
                    noKanban ? 'bg-indigo-50 border-indigo-200 text-indigo-400 cursor-default' : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <KanbanIcon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{noKanban ? 'Já no quadro' : 'Adicionar ao quadro'}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

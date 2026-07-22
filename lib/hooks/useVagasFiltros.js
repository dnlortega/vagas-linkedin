import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const LS_HISTORICO = 'vagas_historico_busca';
const LS_FILTROS_SALVOS = 'vagas_filtros_salvos';

export function useVagasFiltros() {
  const [filtro, setFiltro] = useState('bauru');
  const [senioridade, setSenioridade] = useState('todas');
  const [modalidade, setModalidade] = useState(null);
  const [periodo, setPeriodo] = useState('7d');
  const [busca, setBusca] = useState('');
  const [techFiltro, setTechFiltro] = useState(null);
  const [modoTrabalho, setModoTrabalho] = useState(null); // 'remoto'|'hibrido'|'presencial'
  const [somenteNovas, setSomenteNovas] = useState(false);
  const [naoVisitadas, setNaoVisitadas] = useState(false);
  const [empresaBusca, setEmpresaBusca] = useState('');
  const [somenteTI, setSomenteTI] = useState(false);
  
  const [historicoBusca, setHistoricoBusca] = useState([]);
  const [filtrosSalvos, setFiltrosSalvos] = useState([]);
  const [mostrarSalvos, setMostrarSalvos] = useState(false);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);
  const [ordem, setOrdem] = useState('data');
  const [agrupar, setAgrupar] = useState('nenhum');
  const [vista, setVista] = useState('grade');
  const [tamanho, setTamanho] = useState('normal'); // 'compacto' | 'normal'
  const [pinarFavoritas, setPinarFavoritas] = useState(false);

  useEffect(() => {
    try { setHistoricoBusca(JSON.parse(localStorage.getItem(LS_HISTORICO) || '[]')); } catch (_) {}
    try { setFiltrosSalvos(JSON.parse(localStorage.getItem(LS_FILTROS_SALVOS) || '[]')); } catch (_) {}
  }, []);

  function limparFiltros() {
    setFiltro('bauru');
    setSenioridade('todas');
    setModalidade(null);
    setTechFiltro(null);
    setModoTrabalho(null);
    setBusca('');
    setPeriodo('24h');
    setPinarFavoritas(false);
    setSomenteNovas(false);
    setNaoVisitadas(false);
    setEmpresaBusca('');
    setSomenteTI(false);
    toast('Filtros limpos');
  }

  function salvarFiltroAtual() {
    const nome = window.prompt('Nome para esses filtros (ex: "React Sênior Bauru"):');
    if (!nome?.trim()) return;
    const preset = { nome: nome.trim(), filtro, senioridade, modalidade, techFiltro, modoTrabalho, periodo, ordem, busca };
    const novos = [preset, ...filtrosSalvos.filter(f => f.nome !== preset.nome)].slice(0, 6);
    setFiltrosSalvos(novos);
    localStorage.setItem(LS_FILTROS_SALVOS, JSON.stringify(novos));
    toast.success(`Filtros "${preset.nome}" salvos! 🔖`);
  }

  function restaurarFiltro(preset) {
    setFiltro(preset.filtro || 'todas');
    setSenioridade(preset.senioridade || 'todas');
    setModalidade(preset.modalidade || null);
    setTechFiltro(preset.techFiltro || null);
    setModoTrabalho(preset.modoTrabalho || null);
    setPeriodo(preset.periodo || '24h');
    setOrdem(preset.ordem || 'data');
    setBusca(preset.busca || '');
    setMostrarSalvos(false);
    toast(`Filtros "${preset.nome}" aplicados`);
  }

  function removerFiltroSalvo(nome) {
    const novos = filtrosSalvos.filter(f => f.nome !== nome);
    setFiltrosSalvos(novos);
    localStorage.setItem(LS_FILTROS_SALVOS, JSON.stringify(novos));
  }

  function salvarHistorico(termo) {
    if (!termo.trim() || termo.length < 2) return;
    setHistoricoBusca(prev => {
      const next = [termo, ...prev.filter(t => t !== termo)].slice(0, 8);
      localStorage.setItem(LS_HISTORICO, JSON.stringify(next));
      return next;
    });
  }

  return {
    filtro, setFiltro,
    senioridade, setSenioridade,
    modalidade, setModalidade,
    periodo, setPeriodo,
    busca, setBusca,
    techFiltro, setTechFiltro,
    modoTrabalho, setModoTrabalho,
    somenteNovas, setSomenteNovas,
    naoVisitadas, setNaoVisitadas,
    empresaBusca, setEmpresaBusca,
    somenteTI, setSomenteTI,
    historicoBusca, setHistoricoBusca,
    filtrosSalvos, setFiltrosSalvos,
    mostrarSalvos, setMostrarSalvos,
    filtrosVisiveis, setFiltrosVisiveis,
    ordem, setOrdem,
    agrupar, setAgrupar,
    vista, setVista,
    tamanho, setTamanho,
    pinarFavoritas, setPinarFavoritas,
    limparFiltros, salvarFiltroAtual, restaurarFiltro, removerFiltroSalvo, salvarHistorico
  };
}

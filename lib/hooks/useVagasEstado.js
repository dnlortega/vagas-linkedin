import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { LS_KEY, LS_FAV, LS_KANBAN, LS_OCULTAS, LS_VISITADAS, AUTO_REFRESH_MS } from '@/lib/constants';

export function useVagasEstado({ silencioso, setFiltro, setPeriodo, setBusca }) {
  const [vagas, setVagas] = useState([]);
  const [novasLinks, setNovasLinks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [geradoEm, setGeradoEm] = useState(null);
  const [fontes, setFontes] = useState({});
  const [novosCount, setNovosCount] = useState(0);
  const [gridKey, setGridKey] = useState(0);

  const [favoritas, setFavoritas] = useState(new Set());
  const [ocultas, setOcultas] = useState(new Set());
  const [visitadas, setVisitadas] = useState(new Set());
  const [kanban, setKanbanState] = useState(new Set());

  const toastIdRef = useRef(null);
  const silenciosoRef = useRef(false);

  useEffect(() => { silenciosoRef.current = silencioso; }, [silencioso]);

  const fetchVagas = useCallback(async (opts = {}) => {
    const { force = false, silent = false } = opts;
    if (!silent) { if (force) setRefreshing(true); else setLoading(true); }
    setError(null);
    try {
      const res  = await fetch(force ? '/api/vagas?refresh=1' : '/api/vagas');
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const data = await res.json();
      const novasVagas = data.vagas || [];

      let novos = new Set();
      try {
        const vistos = new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
        if (vistos.size > 0) {
          novasVagas.forEach(v => { if (!vistos.has(v.link)) novos.add(v.link); });
          const qtd = novos.size;
          if (qtd > 0) {
            setNovosCount(qtd);
            if (typeof window !== 'undefined' && Notification?.permission === 'granted') {
              new Notification(`${qtd} nova${qtd > 1 ? 's vagas' : ' vaga'} de TI em Bauru!`, {
                body: 'Clique para ver as novidades.', icon: '/icon-192.png',
              });
            }
            if (!silenciosoRef.current) {
              if (toastIdRef.current) toast.dismiss(toastIdRef.current);
              toastIdRef.current = toast.success(
                `${qtd} nova${qtd > 1 ? 's vagas' : ' vaga'} encontrada${qtd > 1 ? 's' : ''}! 🎉`,
                { description: 'Novas vagas destacadas em verde.', duration: 8000,
                  action: { label: 'Ver novas', onClick: () => { setFiltro('todas'); setPeriodo('todos'); setBusca(''); window.scrollTo({ top: 0, behavior: 'smooth' }); } } }
              );
            }
          }
        }
        localStorage.setItem(LS_KEY, JSON.stringify(novasVagas.map(v => v.link)));
      } catch (_) {}

      setNovasLinks(novos);
      setVagas(novasVagas);
      setGeradoEm(data.gerado_em);
      setFontes(data.fontes || {});
      setGridKey(k => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setFiltro, setPeriodo, setBusca]);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);
  useEffect(() => {
    const id = setInterval(() => fetchVagas({ silent: true }), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchVagas]);

  useEffect(() => {
    try { setFavoritas(new Set(JSON.parse(localStorage.getItem(LS_FAV) || '[]'))); } catch (_) {}
    try { setOcultas(new Set(JSON.parse(localStorage.getItem(LS_OCULTAS) || '[]'))); } catch (_) {}
    try { setVisitadas(new Set(JSON.parse(localStorage.getItem(LS_VISITADAS) || '[]'))); } catch (_) {}
    try { setKanbanState(new Set(Object.keys(JSON.parse(localStorage.getItem(LS_KANBAN) || '{}')))); } catch (_) {}
  }, []);

  const toggleFavorita = useCallback((link, e) => {
    e?.stopPropagation();
    setFavoritas(prev => {
      const next = new Set(prev);
      if (next.has(link)) { next.delete(link); toast('Removida dos favoritos'); }
      else { next.add(link); toast.success('Adicionada aos favoritos! ❤️'); }
      localStorage.setItem(LS_FAV, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const adicionarKanbanRapido = useCallback((vaga, e) => {
    e?.stopPropagation();
    if (kanban.has(vaga.link)) return;
    try {
      const kb = JSON.parse(localStorage.getItem(LS_KANBAN) || '{}');
      kb[vaga.link] = {
        link: vaga.link, titulo: vaga.titulo, empresa: vaga.empresa,
        local: vaga.local, data: vaga.data, status: 'salvo', fonte: vaga.fonte,
        adicionadoEm: new Date().toISOString(),
      };
      localStorage.setItem(LS_KANBAN, JSON.stringify(kb));
      setKanbanState(prev => new Set([...prev, vaga.link]));
      toast.success('Adicionada ao quadro! 📋');
    } catch (_) {}
  }, [kanban]);

  const ocultarVaga = useCallback((link, e) => {
    e?.stopPropagation();
    setOcultas(prev => {
      const next = new Set(prev);
      next.add(link);
      localStorage.setItem(LS_OCULTAS, JSON.stringify([...next]));
      return next;
    });
    toast('Vaga ocultada', {
      action: { label: 'Desfazer', onClick: () => setOcultas(prev => {
        const next = new Set(prev); next.delete(link);
        localStorage.setItem(LS_OCULTAS, JSON.stringify([...next]));
        return next;
      })},
      duration: 5000,
    });
  }, []);

  function marcarVisitada(link) {
    setVisitadas(prev => {
      if (prev.has(link)) return prev;
      const next = new Set(prev);
      next.add(link);
      localStorage.setItem(LS_VISITADAS, JSON.stringify([...next]));
      return next;
    });
  }

  return {
    vagas, novasLinks, loading, refreshing, error, geradoEm, fontes, novosCount, gridKey,
    favoritas, ocultas, visitadas, kanban,
    fetchVagas, toggleFavorita, adicionarKanbanRapido, ocultarVaga, marcarVisitada,
    setGridKey
  };
}

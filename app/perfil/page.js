'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, ClipboardCopyIcon,
  CheckIcon, UploadIcon, DownloadIcon, SearchIcon, StarIcon,
  ExternalLinkIcon, XIcon, Award, GraduationCap, ChevronDownIcon,
  ChevronUpIcon, InfoIcon, FileTextIcon, EyeIcon
} from 'lucide-react';

const LS_CERTS = 'vagas_certificados';

const EMISSORES_CONHECIDOS = [
  { nome: 'Udemy', dominio: 'udemy.com' },
  { nome: 'Coursera', dominio: 'coursera.org' },
  { nome: 'Alura', dominio: 'alura.com.br' },
  { nome: 'DIO', dominio: 'dio.me' },
  { nome: 'Google', dominio: 'google.com' },
  { nome: 'Microsoft', dominio: 'microsoft.com' },
  { nome: 'AWS', dominio: 'aws.amazon.com' },
  { nome: 'LinkedIn Learning', dominio: 'linkedin.com' },
  { nome: 'Oracle', dominio: 'oracle.com' },
  { nome: 'IBM', dominio: 'ibm.com' },
  { nome: 'Rocketseat', dominio: 'rocketseat.com.br' },
  { nome: 'FIAP', dominio: 'fiap.com.br' },
  { nome: 'Senai', dominio: 'senai.br' },
  { nome: 'Fundação Bradesco', dominio: 'ev.org.br' },
  { nome: 'Fundação Getulio Vargas', dominio: 'fgv.br' },
  { nome: 'SEBRAE', dominio: 'sebrae.com.br' },
  { nome: 'Cisco', dominio: 'cisco.com' },
  { nome: 'CompTIA', dominio: 'comptia.org' },
  { nome: 'Scrum.org', dominio: 'scrum.org' },
  { nome: 'PMI', dominio: 'pmi.org' },
  { nome: 'Meta', dominio: 'meta.com' },
  { nome: 'HubSpot Academy', dominio: 'academy.hubspot.com' },
  { nome: 'edX', dominio: 'edx.org' },
  { nome: 'Origamid', dominio: 'origamid.com' },
  { nome: 'FullCycle', dominio: 'fullcycle.com.br' },
];

function faviconUrl(dominio) {
  return `https://www.google.com/s2/favicons?domain=${dominio}&sz=64`;
}

function emissoresMatch(nome) {
  const n = nome.toLowerCase();
  return EMISSORES_CONHECIDOS.find(e => e.nome.toLowerCase().includes(n) || n.includes(e.nome.toLowerCase()));
}

function formatarDataGupy(dataISO) {
  if (!dataISO) return '';
  const [ano, mes] = dataISO.split('-');
  if (!ano) return dataISO;
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return mes ? `${meses[parseInt(mes,10)-1]}/${ano}` : ano;
}

function parsarCSVLinkedIn(texto) {
  const linhas = texto.trim().split('\n');
  if (linhas.length < 2) return [];
  const headers = linhas[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase());
  const certs = [];
  for (let i = 1; i < linhas.length; i++) {
    const vals = linhas[i].match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const clean = vals.map(v => v.replace(/^"|"$/g,'').trim());
    const get = (...keys) => {
      for (const k of keys) {
        const idx = headers.findIndex(h => h.includes(k));
        if (idx >= 0 && clean[idx]) return clean[idx];
      }
      return '';
    };
    const nome = get('name','nome');
    if (!nome) continue;
    const url = get('url');
    const emissor = get('authority','organiz','emissor','issuer');
    const dataInicio = get('started','inicio','start');
    const dataFim = get('finished','fim','finish','expir');
    const credencial = get('license','licen','credencial','number');
    certs.push({
      id: `li_${Date.now()}_${i}`,
      nome,
      emissor: emissor || '',
      data: dataFim || dataInicio || '',
      dataExpiracao: '',
      credencial: credencial || '',
      url: url || '',
      logoUrl: '',
    });
  }
  return certs;
}

function gerarTextoGupy(cert) {
  const linhas = [];
  linhas.push(`📌 Nome: ${cert.nome}`);
  if (cert.emissor) linhas.push(`🏢 Organização emissora: ${cert.emissor}`);
  if (cert.data) linhas.push(`📅 Data de emissão: ${formatarDataGupy(cert.data)}`);
  if (cert.dataExpiracao) linhas.push(`⏰ Data de expiração: ${formatarDataGupy(cert.dataExpiracao)}`);
  if (cert.credencial) linhas.push(`🔑 Código da credencial: ${cert.credencial}`);
  if (cert.url) linhas.push(`🔗 URL da credencial: ${cert.url}`);
  return linhas.join('\n');
}

function gerarTextoGupyTodos(certs) {
  return certs.map((c, i) => `${'─'.repeat(40)}\n[${i+1}] ${c.nome}\n${gerarTextoGupy(c)}`).join('\n\n');
}

function CertCard({ cert, onEdit, onDelete, onCopySingle, copiado }) {
  const emissor = emissoresMatch(cert.emissor || '');
  const logoSrc = cert.logoUrl || (emissor ? faviconUrl(emissor.dominio) : null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex gap-3 hover:shadow-md transition-all group fade-slide-up">
      <div className="h-12 w-12 rounded-xl flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={cert.emissor}
            className="h-8 w-8 object-contain"
            onError={e => { e.currentTarget.src = ''; e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }}
          />
        ) : null}
        <div style={{display: logoSrc ? 'none' : 'flex'}} className="h-full w-full items-center justify-center">
          <Award className="h-5 w-5 text-indigo-400" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{cert.nome}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cert.emissor || <span className="italic text-gray-300">Emissor não definido</span>}</p>
        {cert.data && <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-0.5 font-medium">{formatarDataGupy(cert.data)}</p>}
        {cert.credencial && <p className="text-[11px] text-gray-400 mt-0.5 font-mono">ID: {cert.credencial}</p>}
        {cert.url && (
          <a href={cert.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 mt-0.5">
            <ExternalLinkIcon className="h-3 w-3" /> Ver certificado
          </a>
        )}
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onCopySingle(cert)}
          title="Copiar para Gupy"
          className="flex items-center gap-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg font-medium transition-colors"
        >
          {copiado === cert.id ? <CheckIcon className="h-3 w-3" /> : <ClipboardCopyIcon className="h-3 w-3" />}
          {copiado === cert.id ? 'Copiado!' : 'Copiar'}
        </button>
        <button onClick={() => onEdit(cert)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <PencilIcon className="h-3 w-3 inline mr-1" />Editar
        </button>
        <button onClick={() => onDelete(cert.id)} className="text-xs text-rose-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
          <TrashIcon className="h-3 w-3 inline mr-1" />Excluir
        </button>
      </div>
    </div>
  );
}

function FormCertificado({ cert, onSave, onCancel }) {
  const [form, setForm] = useState(cert || {
    nome: '', emissor: '', data: '', dataExpiracao: '', credencial: '', url: '', logoUrl: '',
  });
  const [sugestoes, setSugestoes] = useState([]);
  const emissorRef = useRef();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function onEmissorChange(v) {
    set('emissor', v);
    if (v.length > 1) {
      const s = EMISSORES_CONHECIDOS.filter(e => e.nome.toLowerCase().includes(v.toLowerCase())).slice(0, 5);
      setSugestoes(s);
    } else {
      setSugestoes([]);
    }
  }

  function selecionarEmissor(e) {
    set('emissor', e.nome);
    setSugestoes([]);
  }

  function onSubmit(ev) {
    ev.preventDefault();
    if (!form.nome.trim()) return;
    onSave({ ...form, id: form.id || `c_${Date.now()}` });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-lg p-5 flex flex-col gap-3">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Award className="h-4 w-4 text-indigo-500" />
        {cert?.id ? 'Editar certificado' : 'Novo certificado'}
      </h3>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome do certificado *</label>
        <input
          value={form.nome}
          onChange={e => set('nome', e.target.value)}
          placeholder="Ex: AWS Certified Solutions Architect"
          required
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Organização emissora</label>
        <input
          ref={emissorRef}
          value={form.emissor}
          onChange={e => onEmissorChange(e.target.value)}
          placeholder="Ex: Amazon Web Services"
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {sugestoes.length > 0 && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
            {sugestoes.map(e => (
              <button key={e.nome} type="button" onClick={() => selecionarEmissor(e)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <img src={faviconUrl(e.dominio)} alt="" className="h-4 w-4 rounded" />
                {e.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data de emissão</label>
          <input
            type="month"
            value={form.data}
            onChange={e => set('data', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data de expiração</label>
          <input
            type="month"
            value={form.dataExpiracao}
            onChange={e => set('dataExpiracao', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Código da credencial / Licença</label>
        <input
          value={form.credencial}
          onChange={e => set('credencial', e.target.value)}
          placeholder="Ex: UC-abc12345"
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL da credencial</label>
        <input
          type="url"
          value={form.url}
          onChange={e => set('url', e.target.value)}
          placeholder="https://..."
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL da logo/imagem <span className="text-gray-400">(opcional)</span></label>
        <input
          type="url"
          value={form.logoUrl}
          onChange={e => set('logoUrl', e.target.value)}
          placeholder="https://... (PNG, JPG)"
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl py-2 transition-colors flex items-center justify-center gap-2">
          <CheckIcon className="h-4 w-4" /> Salvar
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PreviewGupy({ certs }) {
  const [expandido, setExpandido] = useState(false);
  const preview = expandido ? certs : certs.slice(0, 3);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <EyeIcon className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview — Como ficará no Gupy</span>
      </div>
      <div className="space-y-2">
        {preview.map(cert => (
          <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {gerarTextoGupy(cert)}
          </div>
        ))}
      </div>
      {certs.length > 3 && (
        <button onClick={() => setExpandido(e => !e)} className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
          {expandido ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
          {expandido ? 'Mostrar menos' : `Ver mais ${certs.length - 3} certificados`}
        </button>
      )}
    </div>
  );
}

export default function PerfilPage() {
  const [certs, setCerts] = useState([]);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState('');
  const [copiado, setCopiado] = useState(null);
  const [copiadoTodos, setCopiadoTodos] = useState(false);
  const [importando, setImportando] = useState(false);
  const [csvTexto, setCsvTexto] = useState('');
  const [msgImport, setMsgImport] = useState('');
  const [dark, setDark] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_CERTS);
      if (saved) setCerts(JSON.parse(saved));
      setDark(localStorage.getItem('darkMode') === 'true');
    } catch {}
  }, []);

  function salvar(novosCerts) {
    setCerts(novosCerts);
    localStorage.setItem(LS_CERTS, JSON.stringify(novosCerts));
  }

  function onSaveCert(cert) {
    const novos = editando
      ? certs.map(c => c.id === cert.id ? cert : c)
      : [...certs, cert];
    salvar(novos);
    setFormAberto(false);
    setEditando(null);
  }

  function onDelete(id) {
    if (confirm('Excluir certificado?')) salvar(certs.filter(c => c.id !== id));
  }

  function onEdit(cert) {
    setEditando(cert);
    setFormAberto(false);
  }

  function onCopySingle(cert) {
    const texto = gerarTextoGupy(cert);
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(cert.id);
      setTimeout(() => setCopiado(null), 2000);
    });
  }

  function onCopyTodos() {
    const texto = gerarTextoGupyTodos(certsFiltered);
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoTodos(true);
      setTimeout(() => setCopiadoTodos(false), 2500);
    });
  }

  function onExportarJSON() {
    const blob = new Blob([JSON.stringify(certs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'certificados.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function onImportarCSV() {
    if (!csvTexto.trim()) { setMsgImport('Cole o conteúdo do CSV do LinkedIn acima.'); return; }
    const novos = parsarCSVLinkedIn(csvTexto);
    if (novos.length === 0) { setMsgImport('Nenhum certificado encontrado. Verifique o formato do CSV.'); return; }
    const combinados = [...certs, ...novos];
    salvar(combinados);
    setCsvTexto('');
    setImportando(false);
    setMsgImport(`✓ ${novos.length} certificado(s) importado(s) com sucesso!`);
    setTimeout(() => setMsgImport(''), 4000);
  }

  function onArquivoCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvTexto(ev.target.result);
    reader.readAsText(file, 'UTF-8');
  }

  const certsFiltered = certs.filter(c => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return c.nome?.toLowerCase().includes(q) || c.emissor?.toLowerCase().includes(q);
  });

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 flex-1">
              <Award className="h-5 w-5 text-indigo-500" />
              <span className="font-bold text-gray-900 dark:text-white">Certificados</span>
              {certs.length > 0 && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">{certs.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setImportando(i => !i); setFormAberto(false); setEditando(null); }}
                className="text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
              >
                <UploadIcon className="h-3.5 w-3.5" /> Importar CSV
              </button>
              <button
                onClick={() => { setFormAberto(true); setEditando(null); setImportando(false); }}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 font-medium"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Banner de instrução */}
          {certs.length === 0 && !formAberto && !importando && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 text-center">
              <Award className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
              <h2 className="font-bold text-gray-800 dark:text-white mb-1">Gerencie seus certificados</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Adicione seus certificados do LinkedIn, Udemy, Coursera e outros.<br />
                Depois copie formatado para preencher o Gupy rapidamente.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => setFormAberto(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl px-5 py-2 transition-colors flex items-center gap-2 justify-center"
                >
                  <PlusIcon className="h-4 w-4" /> Adicionar manualmente
                </button>
                <button
                  onClick={() => setImportando(true)}
                  className="border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl px-5 py-2 transition-colors flex items-center gap-2 justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  <UploadIcon className="h-4 w-4" /> Importar do LinkedIn (CSV)
                </button>
              </div>
            </div>
          )}

          {/* Mensagem de importação */}
          {msgImport && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msgImport.startsWith('✓') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {msgImport}
            </div>
          )}

          {/* Formulário de adição */}
          {(formAberto || editando) && (
            <FormCertificado
              cert={editando}
              onSave={onSaveCert}
              onCancel={() => { setFormAberto(false); setEditando(null); }}
            />
          )}

          {/* Painel de importação CSV */}
          {importando && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
              <div className="flex items-start gap-3">
                <UploadIcon className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Importar certificados do LinkedIn</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Acesse seu LinkedIn → <strong>Eu → Configurações → Privacidade de dados → Obter uma cópia dos seus dados</strong><br />
                    Marque <strong>&quot;Licenças e certificados&quot;</strong>, solicite e aguarde o e-mail.<br />
                    Abra o arquivo <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">Certifications.csv</code> e cole o conteúdo abaixo:
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-700 rounded-xl p-3">
                <textarea
                  value={csvTexto}
                  onChange={e => setCsvTexto(e.target.value)}
                  placeholder={'Name,Url,Authority,Started At,Finished At,License Number\n"AWS Certified...","https://...","Amazon Web Services","2023-01","2026-01","ABC123"'}
                  rows={5}
                  className="w-full text-xs font-mono bg-transparent text-gray-700 dark:text-gray-300 resize-none focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">ou</span>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-xs border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                >
                  <FileTextIcon className="h-3.5 w-3.5" /> Carregar arquivo .csv
                </button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onArquivoCSV} className="hidden" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onImportarCSV}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl py-2 transition-colors flex items-center justify-center gap-2"
                >
                  <UploadIcon className="h-4 w-4" /> Importar
                </button>
                <button onClick={() => { setImportando(false); setCsvTexto(''); }}
                  className="px-4 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de certificados */}
          {certs.length > 0 && (
            <>
              {/* Barra de ações */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar certificado..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {busca && (
                    <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onCopyTodos}
                    title="Copiar todos para Gupy"
                    className="flex items-center gap-1.5 text-xs border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 px-3 py-2 rounded-xl font-medium transition-colors"
                  >
                    {copiadoTodos ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardCopyIcon className="h-3.5 w-3.5" />}
                    {copiadoTodos ? 'Copiado!' : 'Copiar todos'}
                  </button>
                  <button
                    onClick={onExportarJSON}
                    title="Exportar JSON"
                    className="flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-xl transition-colors"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" /> JSON
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {certsFiltered.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">Nenhum certificado encontrado para &quot;{busca}&quot;</p>
                )}
                {certsFiltered.map(cert => (
                  <CertCard
                    key={cert.id}
                    cert={cert}
                    onEdit={c => { setEditando(c); setFormAberto(false); setImportando(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    onDelete={onDelete}
                    onCopySingle={onCopySingle}
                    copiado={copiado}
                  />
                ))}
              </div>

              {/* Preview para Gupy */}
              {certsFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Como usar no Gupy</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-4 text-xs text-blue-800 dark:text-blue-300 space-y-1.5">
                    <p className="font-semibold flex items-center gap-1.5"><InfoIcon className="h-3.5 w-3.5" /> Passo a passo no Gupy:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                      <li>Clique em <strong>Copiar</strong> em um certificado (ou &quot;Copiar todos&quot; para exportar tudo)</li>
                      <li>No Gupy, vá em <strong>Perfil → Licenças e certificados → Adicionar</strong></li>
                      <li>Cole o conteúdo copiado como referência para preencher cada campo</li>
                      <li>Salve cada certificado individualmente</li>
                    </ol>
                  </div>
                  <PreviewGupy certs={certsFiltered} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

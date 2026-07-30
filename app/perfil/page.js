// Sistema de Vagas de TI em Bauru — Perfil do usuário
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, ClipboardCopyIcon,
  CheckIcon, UploadIcon, DownloadIcon, SearchIcon, XIcon, Award,
  ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, InfoIcon,
  FileTextIcon, EyeIcon, ZapIcon, PrinterIcon, Trash2Icon, BriefcaseIcon, TagIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';

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
  const n = (nome || '').toLowerCase();
  return EMISSORES_CONHECIDOS.find(e => e.nome.toLowerCase().includes(n) || n.includes(e.nome.toLowerCase()));
}

function formatarDataGupy(dataISO) {
  if (!dataISO) return '';
  const meses = { jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06', jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12' };
  // already YYYY-MM
  if (/^\d{4}-\d{2}$/.test(dataISO)) {
    const [ano, mes] = dataISO.split('-');
    const nomeMes = Object.keys(meses)[parseInt(mes, 10) - 1];
    return `${nomeMes}/${ano}`;
  }
  // "jan de 2024" or "jan. de 2024"
  const m = dataISO.match(/(\w{3})\.?\s+(?:de\s+)?(\d{4})/i);
  if (m) return `${m[1].toLowerCase()}/${m[2]}`;
  return dataISO;
}

function parsarCSVLinkedIn(texto) {
  const linhas = texto.trim().split('\n');
  if (linhas.length < 2) return [];
  const headers = linhas[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  const certs = [];
  for (let i = 1; i < linhas.length; i++) {
    const vals = linhas[i].match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const clean = vals.map(v => v.replace(/^"|"$/g, '').trim());
    const get = (...keys) => {
      for (const k of keys) {
        const idx = headers.findIndex(h => h.includes(k));
        if (idx >= 0 && clean[idx]) return clean[idx];
      }
      return '';
    };
    const nome = get('name', 'nome');
    if (!nome) continue;
    certs.push({
      id: `li_csv_${Date.now()}_${i}`,
      nome,
      emissor: get('authority', 'organiz', 'emissor', 'issuer'),
      data: get('finished', 'fim', 'finish') || get('started', 'inicio', 'start'),
      dataExpiracao: '',
      credencial: get('license', 'licen', 'credencial', 'number'),
      url: get('url'),
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
  return certs.map((c, i) => `${'─'.repeat(40)}\n[${i + 1}] ${c.nome}\n${gerarTextoGupy(c)}`).join('\n\n');
}

const MESES_PT = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
function parsarDataTS(str) {
  if (!str) return 0;
  const m = str.match(/([a-zA-ZÀ-ú]{3})\.?\s+(?:de\s+)?(\d{4})/i);
  if (m) return new Date(parseInt(m[2]), MESES_PT[m[1].toLowerCase().slice(0, 3)] ?? 0).getTime();
  const a = str.match(/(\d{4})/);
  return a ? new Date(parseInt(a[1]), 0).getTime() : 0;
}
function extrairAno(str) {
  if (!str) return null;
  const m = str.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

// Script que roda no navegador do usuário enquanto está no LinkedIn
const BOOKMARKLET_FN = `(function(){
  if(!location.hostname.includes('linkedin.com')){alert('Abra no LinkedIn!');return;}
  if(!location.pathname.includes('certif')){
    var p=location.pathname.match(/\\/in\\/[^/?]+/)?.[0];
    if(p&&confirm('Ir para certificados?')){location.href='https://www.linkedin.com'+p+'/details/certifications/';}
    return;
  }
  Array.from(document.querySelectorAll('button')).filter(function(b){return /ver mais|show more/i.test(b.innerText||'');}).forEach(function(b){try{b.click();}catch(e){}});
  setTimeout(function(){
    var main=document.querySelector('main,[role="main"],.scaffold-layout__main')||document.body;
    var linhas=(main.innerText||'').split('\\n').map(function(l){return l.trim();}).filter(function(l){return l.length>2;});
    var certs=[],cert=null,state='WAIT';
    function isEnd(l){return /^competências:/i.test(l);}
    function isCred(l){return /^código da credencial/i.test(l);}
    function isDate(l){return /^(emitida?\\s*em|expedid[ao]\\s*em|data de emiss|issued)/i.test(l)||/^[a-zA-Z\\u00C0-\\u024F]{3,6}\\.?\\s+de\\s+\\d{4}/i.test(l);}
    function isExpiry(l){return /^expira\\s/i.test(l);}
    function isSkip(l){return /^(certificado$|certficado$|exibir credencial|ver credencial|·|•)/i.test(l);}
    function isFooter(l){return /^(sobre$|acessibilidade$|soluções de talentos|carreiras$|publicidade$|dispositivo móvel|linkedin corp|dúvidas\\?|acesse a nossa|gerencie sua|visibilidade da|selecionar idioma)/i.test(l);}
    function push(){if(cert&&cert.nome.length>2)certs.push(cert);cert=null;}
    for(var i=0;i<linhas.length;i++){
      var l=linhas[i];
      if(isFooter(l))break;
      if(isEnd(l)){push();state='WAIT';continue;}
      if(isCred(l)){if(cert)cert.credencial=l.replace(/^[^:]+:\\s*/,'').trim();continue;}
      if(isDate(l)){if(cert){var m=l.match(/[a-zA-Z\\u00C0-\\u024F]+\\.?\\s+de\\s+\\d{4}/);if(m&&!cert.data)cert.data=m[0];var mx=l.match(/expira[^d]+([a-zA-Z\\u00C0-\\u024F]+\\.?\\s+de\\s+\\d{4})/i);if(mx&&!cert.dataExpiracao)cert.dataExpiracao=mx[1];}continue;}
      if(isExpiry(l)){if(cert){var m=l.match(/[a-zA-Z\\u00C0-\\u024F]+\\.?\\s+de\\s+\\d{4}/);if(m&&!cert.dataExpiracao)cert.dataExpiracao=m[0];}continue;}
      if(isSkip(l))continue;
      if(state==='WAIT'){cert={nome:l,emissor:'',data:'',dataExpiracao:'',credencial:'',url:'',logoUrl:''};state='NAME';}
      else if(state==='NAME'){cert.emissor=l;state='ISSUER';}
      else{push();cert={nome:l,emissor:'',data:'',dataExpiracao:'',credencial:'',url:'',logoUrl:''};state='NAME';}
    }
    push();
    var seen=new Set();
    certs=certs.filter(function(c){var k=c.nome.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
    if(!certs.length){alert('Nenhum certificado encontrado. Role a página até o fim e tente novamente.');return;}
    // Copia para clipboard e abre o app para colar
    var json=JSON.stringify(certs);
    navigator.clipboard.writeText(json).then(function(){
      alert('\\u2713 '+certs.length+' certificado(s) copiado(s)!\\n\\nVOLTE para o app e clique em "Colar do clipboard".');
      window.open('http://localhost:3000/perfil?paste=1','_blank');
    }).catch(function(){prompt('Copie o JSON abaixo e cole no app:',json);});
  },1200);
})()`;

const BOOKMARKLET_CODE = 'javascript:' + encodeURIComponent(BOOKMARKLET_FN);

function CertCard({ cert, onEdit, onDelete, onCopySingle, copiado }) {
  const [copiadoUrl, setCopiadoUrl] = useState(null);
  const emissor = emissoresMatch(cert.emissor || '');
  const logoSrc = cert.logoUrl || (emissor ? faviconUrl(emissor.dominio) : null);

  function copiarUrl(campo) {
    const val = campo === 'logo' ? cert.logoUrl : cert.url;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      setCopiadoUrl(campo);
      setTimeout(() => setCopiadoUrl(null), 2000);
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-800 transition-all p-3 flex items-start gap-3 group">
      {/* Logo */}
      <div className="h-10 w-10 rounded-lg flex-shrink-0 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 relative">
        {logoSrc ? (
          <img src={logoSrc} alt={cert.emissor} className="h-7 w-7 object-contain"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <Award className="h-4 w-4 text-indigo-400" />
        )}
        {cert.logoUrl && (
          <button onClick={() => copiarUrl('logo')} title="Copiar URL da imagem"
            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            {copiadoUrl === 'logo' ? <CheckIcon className="h-3 w-3" /> : <ClipboardCopyIcon className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate" title={cert.nome}>{cert.nome}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {cert.emissor && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{cert.emissor}</span>}
          {cert.data && (
            <span className="inline-flex items-center text-[11px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium">
              {formatarDataGupy(cert.data)}{cert.dataExpiracao ? ` → ${formatarDataGupy(cert.dataExpiracao)}` : ''}
            </span>
          )}
        </div>
        {cert.url && (
          <div className="flex items-center gap-1.5 mt-1">
            <a href={cert.url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-[11px] text-blue-500 hover:text-blue-700 truncate max-w-[140px]" title={cert.url}>
              <ExternalLinkIcon className="h-2.5 w-2.5 flex-shrink-0" /> Ver certificado
            </a>
            <button onClick={() => copiarUrl('url')} title="Copiar URL do certificado"
              className="text-[11px] text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-0.5">
              {copiadoUrl === 'url' ? <CheckIcon className="h-3 w-3 text-emerald-500" /> : <ClipboardCopyIcon className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-0.5 flex-shrink-0 self-start">
        <button onClick={() => onCopySingle(cert)} title="Copiar texto para Gupy"
          className={`p-1.5 rounded-lg transition-colors ${copiado === cert.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
          {copiado === cert.id ? <CheckIcon className="h-4 w-4" /> : <ClipboardCopyIcon className="h-4 w-4" />}
        </button>
        <button onClick={() => onEdit(cert)} title="Editar"
          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100">
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(cert.id)} title="Excluir"
          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors opacity-0 group-hover:opacity-100">
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FormCertificado({ cert, onSave, onCancel }) {
  const [form, setForm] = useState(cert || { nome: '', emissor: '', data: '', dataExpiracao: '', credencial: '', url: '', logoUrl: '' });
  const [sugestoes, setSugestoes] = useState([]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function onEmissorChange(v) {
    set('emissor', v);
    if (v.length > 1) {
      setSugestoes(EMISSORES_CONHECIDOS.filter(e => e.nome.toLowerCase().includes(v.toLowerCase())).slice(0, 5));
    } else {
      setSugestoes([]);
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); if (!form.nome.trim()) return; onSave({ ...form, id: form.id || `c_${Date.now()}` }); }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-lg p-5 flex flex-col gap-3">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Award className="h-4 w-4 text-indigo-500" />
        {cert?.id ? 'Editar certificado' : 'Novo certificado'}
      </h3>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome do certificado *</label>
        <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: AWS Certified Solutions Architect" required
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Organização emissora</label>
        <input value={form.emissor} onChange={e => onEmissorChange(e.target.value)} placeholder="Ex: Amazon Web Services"
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        {sugestoes.length > 0 && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
            {sugestoes.map(e => (
              <button key={e.nome} type="button" onClick={() => { set('emissor', e.nome); setSugestoes([]); }}
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
          <input type="month" value={form.data} onChange={e => set('data', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data de expiração</label>
          <input type="month" value={form.dataExpiracao} onChange={e => set('dataExpiracao', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Código da credencial</label>
        <input value={form.credencial} onChange={e => set('credencial', e.target.value)} placeholder="Ex: UC-abc12345"
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL da credencial</label>
        <input type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..."
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
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
  const preview = expandido ? certs : certs.slice(0, 2);
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <EyeIcon className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview — Como copiar para o Gupy</span>
      </div>
      <div className="space-y-2">
        {preview.map(cert => (
          <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {gerarTextoGupy(cert)}
          </div>
        ))}
      </div>
      {certs.length > 2 && (
        <button onClick={() => setExpandido(e => !e)} className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
          {expandido ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
          {expandido ? 'Mostrar menos' : `Ver mais ${certs.length - 2} certificados`}
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
  const [abaImport, setAbaImport] = useState(null); // null | 'auto' | 'csv' | 'json'
  const [csvTexto, setCsvTexto] = useState('');
  const [jsonTexto, setJsonTexto] = useState('');
  const [msg, setMsg] = useState(null); // {tipo: 'ok'|'erro', texto: '...'}
  const [dark, setDark] = useState(false);
  const [colando, setColando] = useState(false);
  const fileRef = useRef();
  
  const { data: session } = useSession();
  const [preferencias, setPreferencias] = useState([]);
  const [filtrosPadrao, setFiltrosPadrao] = useState({});
  const [novaPref, setNovaPref] = useState('');
  const [novaBusca, setNovaBusca] = useState('');
  const [salvandoPref, setSalvandoPref] = useState(false);
  const [salvandoFiltros, setSalvandoFiltros] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/perfil').then(r => r.json()).then(data => {
        if (data.preferencias) setPreferencias(data.preferencias);
        if (data.filtrosPadrao) setFiltrosPadrao(data.filtrosPadrao);
      }).catch(e => console.error(e));
    }
  }, [session]);

  async function salvarPreferencias(novas) {
    if (!session?.user) return mostrarMsg('erro', 'Faça login para salvar preferências');
    setSalvandoPref(true);
    setPreferencias(novas);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferencias: novas })
      });
      if (res.ok) mostrarMsg('ok', 'Preferências salvas com sucesso!');
      else mostrarMsg('erro', 'Erro ao salvar preferências');
    } catch {
      mostrarMsg('erro', 'Erro de conexão ao salvar preferências');
    } finally {
      setSalvandoPref(false);
    }
  }

  function addBusca(e) {
    e.preventDefault();
    if (!novaBusca.trim()) return;
    const word = novaBusca.trim();
    const atuais = (filtrosPadrao.busca || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!atuais.includes(word)) {
      atualizarFiltroPadrao('busca', [...atuais, word].join(', '));
    }
    setNovaBusca('');
  }

  function remBusca(word) {
    const atuais = (filtrosPadrao.busca || '').split(',').map(x => x.trim()).filter(Boolean);
    const novos = atuais.filter(w => w !== word);
    atualizarFiltroPadrao('busca', novos.join(', '));
  }

  function atualizarFiltroPadrao(chave, valor) {
    setFiltrosPadrao(prev => ({ ...prev, [chave]: valor }));
  }

  async function salvarFiltrosPadrao() {
    if (!session?.user) return mostrarMsg('erro', 'Faça login para salvar configurações');
    setSalvandoFiltros(true);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filtrosPadrao })
      });
      if (res.ok) mostrarMsg('ok', 'Filtros padrão salvos com sucesso!');
      else mostrarMsg('erro', 'Erro ao salvar filtros');
    } catch {
      mostrarMsg('erro', 'Erro de conexão');
    } finally {
      setSalvandoFiltros(false);
    }
  }

  function addPref(e) {
    e.preventDefault();
    if (!novaPref.trim()) return;
    const p = novaPref.trim();
    if (preferencias.some(x => x.toLowerCase() === p.toLowerCase())) { setNovaPref(''); return; }
    salvarPreferencias([...preferencias, p]);
    setNovaPref('');
  }

  function remPref(p) {
    salvarPreferencias(preferencias.filter(x => x !== p));
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_CERTS);
      if (saved) setCerts(JSON.parse(saved));
      setDark(localStorage.getItem('darkMode') === 'true');
      // Se o bookmarklet abriu esta aba com ?paste=1, lê o clipboard automaticamente
      if (window.location.search.includes('paste=1')) {
        setTimeout(() => colarDoClipboard(), 800);
      }
    } catch { }
  }, []);

  function salvar(novosCerts) {
    setCerts(novosCerts);
    localStorage.setItem(LS_CERTS, JSON.stringify(novosCerts));
  }

  function mostrarMsg(tipo, texto) {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 5000);
  }

  async function colarDoClipboard() {
    setColando(true);
    try {
      const texto = await navigator.clipboard.readText();
      const parsed = JSON.parse(texto);
      const lista = Array.isArray(parsed) ? parsed : [parsed];
      if (!lista.length || !lista[0].nome) throw new Error('JSON inválido');
      const novos = lista.map((c, i) => ({
        id: c.id || `clip_${Date.now()}_${i}`,
        nome: c.nome || '', emissor: c.emissor || '', data: c.data || '',
        dataExpiracao: c.dataExpiracao || '', credencial: c.credencial || '',
        url: c.url || '', logoUrl: c.logoUrl || '',
      }));
      salvar(mergeUnique([...certs, ...novos]));
      setAbaImport(null);
      mostrarMsg('ok', `✓ ${novos.length} certificado(s) importado(s) do LinkedIn!`);
      // Limpa o ?paste=1 da URL
      window.history.replaceState({}, '', '/perfil');
    } catch (e) {
      mostrarMsg('erro', 'Não encontrei dados no clipboard. Clique no favorito no LinkedIn primeiro.');
    } finally {
      setColando(false);
    }
  }

  function mergeUnique(lista) {
    const vistos = new Set();
    return lista.filter(c => {
      const key = c.nome.toLowerCase();
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });
  }

  function onSaveCert(cert) {
    const novos = editando ? certs.map(c => c.id === cert.id ? cert : c) : [...certs, cert];
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
    setAbaImport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onCopySingle(cert) {
    navigator.clipboard.writeText(gerarTextoGupy(cert)).then(() => {
      setCopiado(cert.id);
      setTimeout(() => setCopiado(null), 2000);
    });
  }

  function onCopyTodos() {
    navigator.clipboard.writeText(gerarTextoGupyTodos(certsFiltered)).then(() => {
      setCopiadoTodos(true);
      setTimeout(() => setCopiadoTodos(false), 2500);
    });
  }

  function onExportarJSON() {
    const blob = new Blob([JSON.stringify(certs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'certificados.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function onLimparTudo() {
    if (confirm(`Excluir todos os ${certs.length} certificados? Esta ação não pode ser desfeita.`)) {
      salvar([]);
      mostrarMsg('ok', 'Todos os certificados foram removidos.');
    }
  }

  function onImprimirPDF() {
    window.print();
  }

  function onImportarCSV() {
    if (!csvTexto.trim()) { mostrarMsg('erro', 'Cole o conteúdo do CSV acima.'); return; }
    const novos = parsarCSVLinkedIn(csvTexto);
    if (!novos.length) { mostrarMsg('erro', 'Nenhum certificado encontrado. Verifique o formato.'); return; }
    salvar(mergeUnique([...certs, ...novos]));
    setCsvTexto(''); setAbaImport(null);
    mostrarMsg('ok', `✓ ${novos.length} certificado(s) importado(s)!`);
  }

  function onImportarJSON() {
    try {
      const parsed = JSON.parse(jsonTexto);
      const lista = Array.isArray(parsed) ? parsed : [parsed];
      const novos = lista.map((c, i) => ({ id: `json_${Date.now()}_${i}`, nome: c.nome || '', emissor: c.emissor || '', data: c.data || '', dataExpiracao: c.dataExpiracao || '', credencial: c.credencial || '', url: c.url || '', logoUrl: c.logoUrl || '' }));
      salvar(mergeUnique([...certs, ...novos]));
      setJsonTexto(''); setAbaImport(null);
      mostrarMsg('ok', `✓ ${novos.length} certificado(s) importado(s)!`);
    } catch { mostrarMsg('erro', 'JSON inválido. Verifique o formato.'); }
  }

  function onArquivoCSV(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvTexto(ev.target.result);
    reader.readAsText(file, 'UTF-8');
  }

  const certsFiltered = certs.filter(c => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return c.nome?.toLowerCase().includes(q) || c.emissor?.toLowerCase().includes(q);
  });

  const certsSorted = [...certsFiltered].sort((a, b) => parsarDataTS(b.data) - parsarDataTS(a.data));
  const gruposPorAno = certsSorted.reduce((acc, c) => {
    const ano = extrairAno(c.data) ?? 'Sem data';
    if (!acc[ano]) acc[ano] = [];
    acc[ano].push(c);
    return acc;
  }, {});
  const anosOrdenados = Object.keys(gruposPorAno).sort((a, b) =>
    a === 'Sem data' ? 1 : b === 'Sem data' ? -1 : Number(b) - Number(a)
  );

  const bookmarkRef = useRef(null);
  const [copiouBookmarklet, setCopiouBookmarklet] = useState(false);

  // Injeta o href via DOM para contornar a restrição de segurança do React com javascript:
  useEffect(() => {
    if (bookmarkRef.current) {
      bookmarkRef.current.setAttribute('href', BOOKMARKLET_CODE);
    }
  }, [abaImport]);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
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
                onClick={() => { setAbaImport(a => a === 'auto' ? null : 'auto'); setFormAberto(false); setEditando(null); }}
                className={`text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 font-medium border ${abaImport === 'auto' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
              >
                <ZapIcon className="h-3.5 w-3.5" /> Importar do LinkedIn
              </button>
              <button
                onClick={() => { setFormAberto(true); setEditando(null); setAbaImport(null); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors flex items-center justify-center" title="Adicionar Certificado"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

          {/* Mensagem de feedback */}
          {msg && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tipo === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {msg.texto}
            </div>
          )}

          {/* Seção de Preferências de Vagas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BriefcaseIcon className="h-5 w-5 text-indigo-500" />
              <h2 className="font-bold text-gray-900 dark:text-white">Minhas Preferências de Vaga</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Adicione tecnologias e competências que você possui ou busca. O sistema usará isso para calcular a correspondência de vagas para você.
            </p>
            
            {session?.user ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {preferencias.map((p, idx) => (
                    <span key={idx} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50">
                      <TagIcon className="h-3 w-3" /> {p}
                      <button onClick={() => remPref(p)} className="hover:text-rose-500 transition-colors ml-1"><XIcon className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>

                <form onSubmit={addPref} className="flex gap-2 relative">
                  <input value={novaPref} onChange={e => setNovaPref(e.target.value)} disabled={salvandoPref} placeholder="Ex: React, Node.js, AWS..."
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50" />
                  <button type="submit" disabled={salvandoPref || !novaPref.trim()} title="Adicionar Preferência"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center rounded-xl p-2.5 transition-colors disabled:opacity-50">
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Para configurar suas preferências e ver o <strong>"Match"</strong> automático, você precisa estar conectado à sua conta.
                </p>
                <Link href="/login" className="whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Fazer Login Agora
                </Link>
              </div>
            )}
          </div>
          
          {/* Seção de Filtros Padrão */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ⚙️ Filtros Padrão de Busca
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure as opções que devem vir preenchidas automaticamente quando você abrir a tela inicial de Vagas.
            </p>
            {session?.user ? (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Localidade (Filtro)</label>
                  <select value={filtrosPadrao.filtro || 'todas'} onChange={e => atualizarFiltroPadrao('filtro', e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="todas">Todas as Vagas</option>
                    <option value="bauru">Minha Cidade</option>
                    <option value="regiao">Minha Região</option>
                    <option value="remoto">Apenas Vagas Remotas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cidade Base do Perfil</label>
                  <input type="text" value={filtrosPadrao.cidade || ''} onChange={e => atualizarFiltroPadrao('cidade', e.target.value)} placeholder="Ex: Bauru" className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Senioridade</label>
                  <select value={filtrosPadrao.senioridade || 'todas'} onChange={e => atualizarFiltroPadrao('senioridade', e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="todas">Todas as Níveis</option>
                    <option value="junior">Júnior / Estágio</option>
                    <option value="pleno">Pleno</option>
                    <option value="senior">Sênior / Especialista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modelo de Contratação</label>
                  <select value={filtrosPadrao.modalidade || ''} onChange={e => atualizarFiltroPadrao('modalidade', e.target.value || null)} className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Qualquer Modelo</option>
                    <option value="clt">CLT</option>
                    <option value="pj">PJ</option>
                    <option value="estagio">Estágio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modo de Trabalho</label>
                  <select value={filtrosPadrao.modoTrabalho || ''} onChange={e => atualizarFiltroPadrao('modoTrabalho', e.target.value || null)} className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Qualquer Modo</option>
                    <option value="remoto">100% Remoto</option>
                    <option value="hibrido">Híbrido</option>
                    <option value="presencial">Presencial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Período de Busca</label>
                  <select value={filtrosPadrao.periodo || '7d'} onChange={e => atualizarFiltroPadrao('periodo', e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="24h">Últimas 24 horas</option>
                    <option value="3d">Últimos 3 dias</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="15d">Últimos 15 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="todos">Qualquer data</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fonte da Vaga</label>
                  <select value={filtrosPadrao.fonteFiltro || 'todas'} onChange={e => atualizarFiltroPadrao('fonteFiltro', e.target.value)} className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="todas">Todas as Fontes</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="vagasbauru">VagasBauru</option>
                    <option value="indeed">Indeed</option>
                    <option value="vagascom">Vagas.com</option>
                    <option value="catho">Catho</option>
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Palavras-chave (Busca)</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {((filtrosPadrao.busca || '').split(',').map(x => x.trim()).filter(Boolean)).map((word, idx) => (
                        <span key={idx} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50">
                          <SearchIcon className="h-3 w-3" /> {word}
                          <button type="button" onClick={() => remBusca(word)} className="hover:text-rose-500 transition-colors ml-1"><XIcon className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                    <form onSubmit={addBusca} className="flex gap-2">
                      <input 
                        type="text" 
                        value={novaBusca} 
                        onChange={e => setNovaBusca(e.target.value)} 
                        placeholder='Adicione palavras (ex: desenvolvedor)'
                        className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                      />
                      <button type="submit" disabled={!novaBusca.trim()} title="Adicionar Palavra-chave"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center rounded-xl p-2.5 transition-colors disabled:opacity-50">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={salvarFiltrosPadrao} disabled={salvandoFiltros} title="Salvar Filtros Padrão"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center rounded-xl p-2.5 transition-colors disabled:opacity-50">
                  <CheckIcon className="h-5 w-5" />
                </button>
              </div>
              </>
            ) : (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
                Faça login para configurar seus filtros padrão.
              </div>
            )}
          </div>

          {/* Formulário de adição/edição */}
          {(formAberto || editando) && (
            <FormCertificado cert={editando} onSave={onSaveCert} onCancel={() => { setFormAberto(false); setEditando(null); }} />
          )}

          {/* Painel: Importação automática via bookmarklet */}
          {abaImport === 'auto' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <ZapIcon className="h-5 w-5" />
                  <span className="font-bold">Importar automaticamente do LinkedIn</span>
                </div>
                <p className="text-indigo-100 text-xs">3 passos simples — sem instalar nada</p>
              </div>

              <div className="p-5 space-y-5">
                {/* Passo 1 */}
                <div className="flex gap-4">
                  <div className="h-7 w-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Arraste o botão abaixo para sua barra de favoritos</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No Chrome/Edge: clique e arraste para a barra de favoritos (Ctrl+Shift+B para mostrar).<br />
                      No Firefox: clique com o botão direito → &quot;Adicionar aos favoritos&quot;.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      {/* href injetado via DOM no useEffect para contornar bloqueio do React */}
                      <a
                        ref={bookmarkRef}
                        href="#"
                        onClick={e => e.preventDefault()}
                        draggable="true"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl cursor-grab active:cursor-grabbing select-none shadow-md"
                        title="Arraste para a barra de favoritos"
                      >
                        <Award className="h-4 w-4" />
                        📥 Importar Certificados LinkedIn
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
                            setCopiouBookmarklet(true);
                            setTimeout(() => setCopiouBookmarklet(false), 2500);
                          });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        {copiouBookmarklet ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardCopyIcon className="h-3.5 w-3.5" />}
                        {copiouBookmarklet ? 'Copiado!' : 'Copiar código'}
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1">
                      <InfoIcon className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span><strong>Arraste</strong> o botão roxo para os favoritos. Ou copie o código → crie um favorito manualmente → cole o código como URL.</span>
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-4">
                  <div className="h-7 w-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Abra o LinkedIn e vá para seus certificados</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Acesse seu perfil → role até &quot;Licenças e certificados&quot; → clique em &quot;Mostrar todos os certificados&quot;.<br />
                      Ou acesse diretamente: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-[11px]">linkedin.com/in/daniel-op/details/certifications/</code>
                    </p>
                    <a
                      href="https://www.linkedin.com/in/daniel-op/details/certifications/"
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLinkIcon className="h-3 w-3" /> Abrir meus certificados no LinkedIn
                    </a>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-4">
                  <div className="h-7 w-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Role até o fim da página e clique no favorito</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Role a página do LinkedIn até carregar <strong>todos os certificados</strong> (você tem 65 — pode precisar rolar bastante).<br />
                      Depois clique em <strong>&quot;📥 Importar Certificados LinkedIn&quot;</strong> na barra de favoritos. Os dados chegam aqui automaticamente.
                    </p>
                  </div>
                </div>

                {/* Botão de colar */}
                <button
                  onClick={colarDoClipboard}
                  disabled={colando}
                  className="w-full rounded-xl p-3 border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-60 transition-colors"
                >
                  <ClipboardCopyIcon className="h-4 w-4" />
                  {colando ? 'Colando…' : 'Colar do clipboard'}
                </button>

                {/* Alternativas */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-xs text-gray-400 mb-3">Outras formas de importar:</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setAbaImport('csv')}
                      className="text-xs border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5">
                      <FileTextIcon className="h-3.5 w-3.5" /> CSV do LinkedIn
                    </button>
                    <button onClick={() => setAbaImport('json')}
                      className="text-xs border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5">
                      <DownloadIcon className="h-3.5 w-3.5" /> Colar JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Painel: CSV */}
          {abaImport === 'csv' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
              <div className="flex items-start gap-3">
                <UploadIcon className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Importar via CSV do LinkedIn</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    LinkedIn → Eu → Configurações → Privacidade de dados → Obter uma cópia dos seus dados<br />
                    Marque <strong>&quot;Licenças e certificados&quot;</strong> → solicite → aguarde o e-mail → abra <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">Certifications.csv</code>
                  </p>
                </div>
              </div>
              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-700 rounded-xl p-3">
                <textarea value={csvTexto} onChange={e => setCsvTexto(e.target.value)} rows={5}
                  placeholder={'Name,Url,Authority,Started At,Finished At,License Number\n"AWS Certified...","https://...","Amazon Web Services","2023-01","2026-01","ABC123"'}
                  className="w-full text-xs font-mono bg-transparent text-gray-700 dark:text-gray-300 resize-none focus:outline-none placeholder-gray-300 dark:placeholder-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">ou</span>
                <button onClick={() => fileRef.current?.click()}
                  className="text-xs border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5">
                  <FileTextIcon className="h-3.5 w-3.5" /> Carregar .csv
                </button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onArquivoCSV} className="hidden" />
              </div>
              <div className="flex gap-2">
                <button onClick={onImportarCSV}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl py-2 transition-colors flex items-center justify-center gap-2">
                  <UploadIcon className="h-4 w-4" /> Importar
                </button>
                <button onClick={() => { setAbaImport(null); setCsvTexto(''); }}
                  className="px-4 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Painel: JSON */}
          {abaImport === 'json' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <DownloadIcon className="h-4 w-4 text-indigo-500" /> Colar JSON de backup
              </h3>
              <textarea value={jsonTexto} onChange={e => setJsonTexto(e.target.value)} rows={6}
                placeholder='[{"nome":"AWS Certified...","emissor":"Amazon","data":"2024-01",...}]'
                className="w-full text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-300" />
              <div className="flex gap-2">
                <button onClick={onImportarJSON}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl py-2 transition-colors flex items-center justify-center gap-2">
                  <CheckIcon className="h-4 w-4" /> Importar
                </button>
                <button onClick={() => { setAbaImport(null); setJsonTexto(''); }}
                  className="px-4 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Banner inicial vazio */}
          {certs.length === 0 && !formAberto && !editando && !abaImport && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 text-center">
              <Award className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
              <h2 className="font-bold text-gray-800 dark:text-white mb-1">Importe seus certificados do LinkedIn</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Use o bookmarklet para importar automaticamente, ou adicione manualmente.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button onClick={() => setAbaImport('auto')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl px-5 py-2 transition-colors flex items-center gap-2 justify-center">
                  <ZapIcon className="h-4 w-4" /> Importar do LinkedIn
                </button>
                <button onClick={() => setFormAberto(true)}
                  className="border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl px-5 py-2 transition-colors flex items-center gap-2 justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                  <PlusIcon className="h-4 w-4" /> Adicionar manualmente
                </button>
              </div>
            </div>
          )}

          {/* Lista de certificados */}
          {certs.length > 0 && (
            <>
              {/* Stats */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{certs.length} certificados</span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span>{new Set(certs.map(c => c.emissor).filter(Boolean)).size} emissores</span>
                {(() => {
                  const anos = certs.map(c => extrairAno(c.data)).filter(Boolean);
                  if (!anos.length) return null;
                  const min = Math.min(...anos), max = Math.max(...anos);
                  return [
                    <span key="d" className="text-gray-300 dark:text-gray-600">·</span>,
                    <span key="r">{min === max ? min : `${min}–${max}`}</span>,
                  ];
                })()}
              </div>

              {/* Barra de ações */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar certificado..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><XIcon className="h-3.5 w-3.5" /></button>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={onCopyTodos}
                    className="flex items-center gap-1.5 text-xs border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 px-3 py-2 rounded-xl font-medium transition-colors">
                    {copiadoTodos ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardCopyIcon className="h-3.5 w-3.5" />}
                    {copiadoTodos ? 'Copiado!' : 'Copiar todos'}
                  </button>
                  <button onClick={onExportarJSON}
                    className="flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-xl transition-colors">
                    <DownloadIcon className="h-3.5 w-3.5" /> JSON
                  </button>
                  <button onClick={onImprimirPDF} title="Exportar como PDF / Imprimir"
                    className="flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-xl transition-colors">
                    <PrinterIcon className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button onClick={onLimparTudo} title="Limpar todos os certificados"
                    className="flex items-center gap-1.5 text-xs border border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-2 rounded-xl transition-colors">
                    <Trash2Icon className="h-3.5 w-3.5" /> Limpar
                  </button>
                </div>
              </div>

              {/* Certificados agrupados por ano */}
              <div className="space-y-6">
                {certsFiltered.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">Nenhum resultado para &quot;{busca}&quot;</p>
                )}
                {anosOrdenados.map(ano => (
                  <div key={ano}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">{ano}</span>
                      <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                      <span className="text-[11px] text-gray-300 dark:text-gray-600">{gruposPorAno[ano].length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {gruposPorAno[ano].map(cert => (
                        <CertCard key={cert.id} cert={cert} onEdit={onEdit} onDelete={onDelete} onCopySingle={onCopySingle} copiado={copiado} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {certsFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 mt-2">
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Export para Gupy</span>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-4 text-xs text-blue-800 dark:text-blue-300 space-y-1.5">
                    <p className="font-semibold flex items-center gap-1.5"><InfoIcon className="h-3.5 w-3.5" /> Como usar no Gupy:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                      <li>Clique em <strong>Copiar</strong> no certificado desejado (ou <strong>Copiar todos</strong>)</li>
                      <li>No Gupy: <strong>Perfil → Licenças e certificados → Adicionar</strong></li>
                      <li>Use o texto copiado como referência para preencher cada campo</li>
                    </ol>
                  </div>
                  <PreviewGupy certs={certsSorted} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, ClipboardCopyIcon,
  CheckIcon, UploadIcon, DownloadIcon, SearchIcon, XIcon, Award,
  ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, InfoIcon,
  FileTextIcon, EyeIcon, ZapIcon, RefreshCwIcon, Loader2Icon,
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

// Script que roda no navegador do usuário enquanto está no LinkedIn
const BOOKMARKLET_FN = `(function(){
  'use strict';
  if(!location.hostname.includes('linkedin.com')){alert('Abra no LinkedIn primeiro!');return;}
  if(!location.pathname.includes('certif')){
    var base=location.pathname.match(/\\/in\\/[^/]+/)?.[0];
    if(base&&confirm('Ir para sua página de certificados?')){location.href='https://www.linkedin.com'+base+'/details/certifications/';}
    return;
  }
  var certs=[];
  var items=document.querySelectorAll('li.artdeco-list__item');
  if(!items.length)items=document.querySelectorAll('.pvs-list__item--line-separated,.pvs-list__item--no-padding-in-columns');
  if(!items.length)items=document.querySelectorAll('[data-view-name="profile-component-entity"]');
  items.forEach(function(item){
    var spans=item.querySelectorAll('span[aria-hidden="true"]');
    var texts=Array.from(spans).map(function(s){return s.textContent.trim();}).filter(function(t){return t&&t!=='·'&&t!=='•';});
    if(!texts.length||!texts[0])return;
    var c={nome:texts[0],emissor:'',data:'',dataExpiracao:'',credencial:'',url:'',logoUrl:''};
    var img=item.querySelector('img[src*="media.licdn"],img[src*="logo"],.ivm-image-view-model img,img');
    if(img&&img.src&&!img.src.includes('data:'))c.logoUrl=img.src;
    for(var i=1;i<texts.length;i++){
      var t=texts[i],tl=t.toLowerCase();
      if(i===1&&!tl.includes('expedido')&&!tl.includes('issued')&&!tl.match(/\d{4}/)&&!tl.includes('id da cred')&&!tl.includes('sem data')){
        c.emissor=t;
      }else if(tl.includes('id da credencial')||tl.includes('credential id')||tl.includes('license number')){
        c.credencial=t.replace(/^[^:]+:\s*/,'').trim();
      }else if(tl.includes('sem data de expira')||tl.includes('no expiration')){
        // nenhuma expiração
      }else if(tl.includes('expira')||tl.includes('expires')){
        var m=t.match(/([a-záéíóúãõ]+\\.?\\s+de\\s+\\d{4}|\\d{4}-\\d{2})/i);
        if(m)c.dataExpiracao=m[1];
      }else if(tl.includes('expedido')||tl.includes('issued')||t.match(/[a-z]{3}\\.?\\s+de\\s+\\d{4}/i)){
        var m=t.match(/([a-záéíóúãõ]+\\.?\\s+de\\s+\\d{4}|\\d{4}-\\d{2})/i);
        if(m)c.data=m[1];
      }
    }
    var lk=item.querySelector('a[href*="certif"],a[href*="credential"],a[href*="fsd_certification"]')||item.querySelector('a');
    if(lk)c.url=lk.href.split('?')[0];
    if(c.nome)certs.push(c);
  });
  if(!certs.length){alert('Nenhum certificado encontrado.\\nAbra: linkedin.com/in/daniel-op/details/certifications/');return;}
  fetch('http://localhost:3000/api/import-certs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({certs:certs})})
    .then(function(r){if(r.ok)alert('✓ '+certs.length+' certificado(s) enviado(s)!\\nVolte para a aba do app.');else fallback();})
    .catch(fallback);
  function fallback(){
    navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(certs)).then(function(){alert(certs.length+' cert(s) copiado(s) como JSON. Cole no campo de importação do app.');});
  }
})();`;

const BOOKMARKLET_CODE = 'javascript:' + encodeURIComponent(BOOKMARKLET_FN);

function CertCard({ cert, onEdit, onDelete, onCopySingle, copiado }) {
  const emissor = emissoresMatch(cert.emissor || '');
  const logoSrc = cert.logoUrl || (emissor ? faviconUrl(emissor.dominio) : null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex gap-3 hover:shadow-md transition-all group">
      <div className="h-12 w-12 rounded-xl flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600">
        {logoSrc ? (
          <img src={logoSrc} alt={cert.emissor} className="h-8 w-8 object-contain"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <Award className="h-5 w-5 text-indigo-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{cert.nome}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cert.emissor || <span className="italic text-gray-300">Sem emissor</span>}</p>
        {cert.data && <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-0.5 font-medium">{formatarDataGupy(cert.data)}{cert.dataExpiracao ? ` → ${formatarDataGupy(cert.dataExpiracao)}` : ''}</p>}
        {cert.credencial && <p className="text-[11px] text-gray-400 mt-0.5 font-mono">ID: {cert.credencial}</p>}
        {cert.url && (
          <a href={cert.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 mt-0.5">
            <ExternalLinkIcon className="h-3 w-3" /> Ver certificado
          </a>
        )}
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onCopySingle(cert)}
          className="flex items-center gap-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg font-medium transition-colors">
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
  const [aguardando, setAguardando] = useState(false); // polling ativo
  const [dark, setDark] = useState(false);
  const fileRef = useRef();
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_CERTS);
      if (saved) setCerts(JSON.parse(saved));
      setDark(localStorage.getItem('darkMode') === 'true');
    } catch { }
  }, []);

  function salvar(novosCerts) {
    setCerts(novosCerts);
    localStorage.setItem(LS_CERTS, JSON.stringify(novosCerts));
  }

  function mostrarMsg(tipo, texto) {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 4000);
  }

  // Polling para pegar certificados enviados pelo bookmarklet
  const iniciarPolling = useCallback(() => {
    if (pollRef.current) return;
    setAguardando(true);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/import-certs');
        const data = await res.json();
        if (data.certs && data.certs.length > 0) {
          pararPolling();
          const merged = mergeUnique([...certs, ...data.certs]);
          salvar(merged);
          setAbaImport(null);
          mostrarMsg('ok', `✓ ${data.certs.length} certificado(s) importado(s) do LinkedIn!`);
        }
      } catch { }
    }, 2000);
  }, [certs]);

  function pararPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setAguardando(false);
  }

  useEffect(() => () => pararPolling(), []);

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
                onClick={() => { setAbaImport(a => a === 'auto' ? null : 'auto'); if (abaImport !== 'auto') iniciarPolling(); else pararPolling(); setFormAberto(false); setEditando(null); }}
                className={`text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 font-medium border ${abaImport === 'auto' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
              >
                <ZapIcon className="h-3.5 w-3.5" /> Importar do LinkedIn
              </button>
              <button
                onClick={() => { setFormAberto(true); setEditando(null); setAbaImport(null); pararPolling(); }}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 font-medium"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Mensagem de feedback */}
          {msg && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tipo === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {msg.texto}
            </div>
          )}

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
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Clique no favorito salvo — os dados chegam aqui</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Clique em <strong>&quot;📥 Importar Certificados LinkedIn&quot;</strong> na barra de favoritos. O app receberá os dados automaticamente.
                    </p>
                  </div>
                </div>

                {/* Status de aguardo */}
                <div className={`rounded-xl p-3 border flex items-center gap-3 ${aguardando ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                  {aguardando ? (
                    <>
                      <Loader2Icon className="h-4 w-4 text-indigo-500 animate-spin flex-shrink-0" />
                      <span className="text-xs text-indigo-700 dark:text-indigo-300">Aguardando dados do LinkedIn… Clique no favorito agora.</span>
                      <button onClick={pararPolling} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                    </>
                  ) : (
                    <>
                      <RefreshCwIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Clique em &quot;Importar do LinkedIn&quot; para iniciar a espera.</span>
                      <button onClick={iniciarPolling} className="ml-auto text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700">Aguardar</button>
                    </>
                  )}
                </div>

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
                <button onClick={() => { setAbaImport('auto'); iniciarPolling(); }}
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
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar certificado..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><XIcon className="h-3.5 w-3.5" /></button>}
                </div>
                <div className="flex gap-2">
                  <button onClick={onCopyTodos}
                    className="flex items-center gap-1.5 text-xs border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 px-3 py-2 rounded-xl font-medium transition-colors">
                    {copiadoTodos ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardCopyIcon className="h-3.5 w-3.5" />}
                    {copiadoTodos ? 'Copiado!' : 'Copiar todos'}
                  </button>
                  <button onClick={onExportarJSON}
                    className="flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-xl transition-colors">
                    <DownloadIcon className="h-3.5 w-3.5" /> JSON
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {certsFiltered.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">Nenhum resultado para &quot;{busca}&quot;</p>
                )}
                {certsFiltered.map(cert => (
                  <CertCard key={cert.id} cert={cert} onEdit={onEdit} onDelete={onDelete} onCopySingle={onCopySingle} copiado={copiado} />
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

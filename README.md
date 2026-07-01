# 🖥️ Vagas de TI — Bauru

Agregador de vagas de tecnologia para Bauru (SP) e região. Busca automaticamente em 7 fontes e apresenta tudo em uma interface moderna com filtros avançados, kanban de candidaturas e muito mais.

## ✨ Funcionalidades

### Busca e Filtros
- **7 fontes de vagas** simultâneas: LinkedIn, VagasBauru, Indeed, Vagas.com, CIEE, Catho e Empregos.com.br
- **Busca inteligente** com exclusão de termos (`-palavra`), histórico e sugestões
- **Busca por empresa** — campo dedicado na barra de filtros
- **Filtros de localidade**: Todas, Bauru, Região, Remoto
- **Filtros de senioridade**: Júnior, Pleno, Sênior (detecção automática no título)
- **Filtros de modalidade**: CLT, PJ, Estágio, Trainee
- **Filtros de modo de trabalho**: Presencial, Híbrido, Remoto (detecção automática)
- **Filtro por fonte** de cada plataforma
- **Filtro por tecnologia** — pills clicáveis com top 10 techs detectadas
- **Filtros rápidos**: Somente Novas, Não Visitadas, Favoritas
- **Período**: Últimas 24h / Semana / Mês / 3 meses / Todas as datas
- **Limpar filtros** com um clique
- **Salvar filtros** — até 6 combinações nomeadas salvas no navegador

### Visualização
- **Vista em grade** (3 colunas) ou **grade compacta** (4 colunas)
- **Vista em lista** — horizontal, mais densa
- **Agrupamento por empresa ou fonte** — seções com contagem
- **Ordenação**: Mais recente, Empresa A–Z, Título A–Z
- **Fixar favoritas no topo**
- **Animações de carregamento**: loader central animado + skeleton cards shimmer
- **Barra de progresso** no topo durante atualizações
- **Highlight** dos termos buscados no título das vagas

### Cards de Vaga
- **Badge "Novo"** — vagas que apareceram desde a última visita
- **Badge "📋"** — indica que a vaga já está no seu quadro kanban
- **Badge "2+"** — vaga duplicada em mais de uma fonte
- **Tecnologias detectadas** no título como chips clicáveis
- **Senioridade** identificada automaticamente (Jr / Pl / Sr)
- **Ocultar vaga** com desfazer
- **Favoritar** com um clique
- **Adicionar ao kanban** direto do card (sem abrir a modal)
- **Opacity reduzida** para vagas já visitadas

### Modal de Detalhe
- **Descrição completa** da vaga (LinkedIn)
- **Navegação ← →** entre vagas pela modal
- **Barra de tempo** — indica quanto a vaga está aberta (verde → vermelho)
- **Avaliação por estrelas** (1–5) salva localmente
- **Notas pessoais** com autosave e indicador "✓ Salvo"
- **Tecnologias detectadas** exibidas como badges
- **Vagas similares** da mesma empresa ou fonte
- **Localização** clicável → abre Google Maps
- **Empresa** com links para LinkedIn e Glassdoor
- **Compartilhar**: WhatsApp, Telegram, E-mail, Copiar link
- **Buscar no Google**, **Imprimir** a vaga
- **Adicionar ao kanban** e **Favoritar** direto da modal

### Kanban de Candidaturas (`/candidaturas`)
- **5 colunas**: Salvos → Candidatado → Em entrevista → Rejeitado → Arquivado
- **Campos por card**: Contato RH, Salário combinado, Prazo da vaga, Lembrete, Notas
- **Etiquetas coloridas**: Urgente, Interesse, Remoto, Sênior, Estágio
- **Alertas visuais** para lembrete e prazo vencidos
- **Expandir/recolher** campos extras por card
- **Buscar candidaturas** por título ou empresa
- **Ordenar por**: Data de adição, Empresa A–Z, Título A–Z
- **Mudar status** pelo select em cada card
- **Painel de estatísticas**: total, candidaturas enviadas, entrevistas, taxa de entrevista %, funil visual
- **Exportar CSV** com todos os campos
- **Badge de contagem** no link do header principal

### Performance e UX
- **Cache stale-while-revalidate** (5 min fresco / 15 min válido)
- **Auto-refresh** a cada 10 minutos em background
- **Debounce** de 220ms na busca — sem renderizações a cada tecla
- **useMemo** nas listagens filtradas e ordenadas
- **Scroll to top** — botão flutuante aparece ao rolar
- **Atalhos de teclado**: `/` para focar a busca, `Esc` para limpar/fechar, `←→` para navegar entre vagas
- **Histórico de buscas** com dropdown e botão limpar
- **Onboarding** na primeira visita
- **Resumo de retorno** — exibe quantas vagas novas desde a última visita
- **Notificações de desktop** (requer permissão do navegador)
- **Modo silencioso** — desativa toasts e notificações
- **Dark mode** com persistência no localStorage
- **Contagem de vagas novas** no título da aba do navegador

### Descoberta e Analytics
- **Painel Top** — top 5 tecnologias e top 5 empresas com barra clicável
- **Painel Stats** — distribuição por localidade, senioridade, fontes e gráfico de vagas por dia (7 dias)
- **Detecção de duplicatas** — vagas iguais em múltiplas fontes marcadas com "2+"
- **Vagas visitadas** — opacidade reduzida nos cards já abertos
- **Vagas ocultadas** — botão para restaurar todas

### Certificados (`/perfil`)
- **Gerenciador de certificados** com logos automáticos de 25+ emissores conhecidos (Udemy, Coursera, AWS, Alura, DIO, Google, Microsoft…)
- **Adicionar manualmente**: nome, emissor, data de emissão/expiração, código de credencial, URL do certificado, logo personalizada
- **Importar do LinkedIn**: suporte ao CSV oficial (`Certifications.csv`) do export de dados do LinkedIn — cole o conteúdo ou carregue o arquivo
- **Exportar para Gupy**: botão "Copiar" por certificado ou "Copiar todos" — gera texto formatado com todos os campos prontos para colar nos formulários do Gupy
- **Preview ao vivo** mostrando exatamente como ficará o texto exportado
- **Busca** por nome ou emissor
- **Exportar JSON** para backup
- **Persistência** em localStorage (`vagas_certificados`)

### Plataformas Externas (botões de acesso rápido)
LinkedIn · VagasBauru · Gupy · Solides · TalentBrand · Indeed · Vagas.com · CIEE · Catho · Empregos.com.br

---

## 🛠️ Stack

| Tecnologia       | Versão     | Uso                                  |
|-----------------|------------|--------------------------------------|
| Next.js         | 16.2.9     | Framework (App Router + Turbopack)   |
| React           | 19         | UI                                   |
| Tailwind CSS    | v4         | Estilos                              |
| shadcn/ui       | v4         | Componentes (@base-ui/react)         |
| Sonner          | —          | Toasts                               |
| Axios           | —          | Scraping (server-side)               |
| Cheerio         | —          | Parse HTML                           |
| Lucide React    | —          | Ícones                               |

---

## 🚀 Como rodar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
# Acesse http://localhost:3000

# Build de produção
npm run build
npm start
```

---

## 📁 Estrutura

```
app/
├── page.js                  # Página principal — lista de vagas
├── candidaturas/
│   └── page.js              # Kanban de candidaturas
├── perfil/
│   └── page.js              # Gerenciador de certificados + export Gupy
├── api/
│   ├── vagas/route.js       # API de scraping (7 fontes)
│   └── vaga/[id]/route.js   # Detalhe da vaga LinkedIn
├── components/
│   └── VagaModal.js         # Modal/sidebar de detalhe
└── globals.css              # Animações e estilos globais
```

---

## 🔒 Dados locais

Tudo é salvo no `localStorage` do navegador — nenhum dado é enviado para servidores externos:

| Chave                     | Conteúdo                          |
|--------------------------|-----------------------------------|
| `vagas_ids_vistos`        | IDs de vagas já vistas            |
| `vagas_favoritas`         | Links das vagas favoritas         |
| `vagas_kanban`            | Candidaturas e seus dados         |
| `vagas_ocultas`           | Vagas ocultadas                   |
| `vagas_notas`             | Notas pessoais por vaga           |
| `vagas_estrelas`          | Avaliação por estrelas            |
| `vagas_historico_busca`   | Histórico de buscas               |
| `vagas_visitadas`         | Links das vagas abertas           |
| `vagas_filtros_salvos`    | Combinações de filtros salvas     |
| `darkMode`                | Preferência de tema               |
| `silencioso`              | Modo silencioso                   |
| `ultima_visita`           | Timestamp da última visita        |
| `onboarding_done`         | Flag do onboarding inicial        |
| `vagas_certificados`      | Certificados salvos (perfil)      |

---

## 📝 Licença

MIT — uso livre, pessoal.

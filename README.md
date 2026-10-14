# 🖥️ Vagas de Emprego — Bauru

Agregador de vagas de emprego para Bauru (SP) e região, incluindo oportunidades de todas as áreas. Busca automaticamente em várias fontes e apresenta tudo em uma interface moderna com filtros avançados, kanban de candidaturas e muito mais.

## ✨ Funcionalidades

### Busca e Filtros
- **12 fontes de vagas** simultâneas: LinkedIn, VagasBauru, **Agile Bauru**, Indeed, Vagas.com, CIEE, Catho, Empregos.com.br, QueroVagas Tech, Programathor, InfoJobs e Trabalha Brasil
- **Busca inteligente** com exclusão de termos (`-palavra`), OR por vírgula (,), histórico e sugestões
- **Busca por empresa** — campo dedicado na barra de filtros
- **Filtros de localidade**: Todas, Minha Cidade, Região, **Remoto** e Favoritas (padrão: todas as vagas)
- **Filtros de senioridade**: Júnior, Pleno, Sênior (detecção automática no título)
- **Filtros de modalidade**: CLT, PJ, Estágio, Trainee
- **Filtros de modo de trabalho**: Presencial, Híbrido, Remoto (detecção automática)
- **Filtro por fonte** de cada plataforma
- **Status por fonte** — mostra consultas concluídas, vagas encontradas e falhas
- **Filtro por tecnologia** — pills clicáveis com top 10 techs detectadas
- **Filtros rápidos**: Somente Novas, Não Visitadas
- **Período**: 24h / 3, 7, 15, 30 ou 90 dias / Todas as datas
- **Limpar filtros** com um clique
- **Salvar filtros** — até 6 combinações nomeadas salvas no navegador

### Visualização
- **Vista em grade** (3 colunas) ou **grade compacta**
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
- **Adicionar ao kanban** e **Favoritar** direto da modal

### Kanban de Candidaturas (/candidaturas)
- **5 colunas**: Salvos → Candidatado → Em entrevista → Rejeitado → Arquivado
- **Campos por card**: Contato RH, Salário combinado, Prazo da vaga, Lembrete, Notas
- **Etiquetas coloridas**: Urgente, Interesse, Remoto, Sênior, Estágio
- **Alertas visuais** para lembrete e prazo vencidos
- **Buscar candidaturas** por título ou empresa
- **Painel de estatísticas**: total, candidaturas enviadas, entrevistas, taxa de entrevista %, funil visual
- **Exportar CSV** com todos os campos

### Perfil e Certificados (/perfil)
- **Gerenciador de certificados** com logos automáticos de 25+ emissores (Udemy, Coursera, AWS, Alura, DIO, Google, Microsoft…)
- **Importar do LinkedIn**: suporte ao CSV oficial (Certifications.csv)
- **Exportar para Gupy**: texto formatado com todos os campos pronto para colar
- **Filtros padrão**: salva seus filtros preferidos no servidor (requer conta)

### Performance e UX
- **Cache stale-while-revalidate** (1 hora)
- **Auto-refresh** a cada 10 minutos em background
- **Debounce** de 220ms na busca
- **Atalhos de teclado**: `/` para focar a busca, `Esc` para limpar/fechar, `←→` para navegar
- **Dark mode** com persistência no localStorage
- **Contagem de vagas novas** no título da aba do navegador

---

## 📡 Fontes de Vagas

| Fonte            | URL                             | Cobertura        |
|-----------------|---------------------------------|------------------|
| LinkedIn         | linkedin.com/jobs               | Bauru + Remoto   |
| VagasBauru       | vagasbauru.com.br               | Bauru e região   |
| **Agile Bauru**  | agile-bauru.hera.app.br/vagas   | Bauru            |
| Indeed           | br.indeed.com                   | Bauru            |
| Vagas.com        | vagas.com.br                    | Bauru            |
| CIEE             | portal.ciee.org.br              | Bauru (estágios) |
| Catho            | catho.com.br                    | Bauru            |
| Empregos.com.br  | empregos.com.br                 | Bauru            |
| QueroVagas Tech  | querovagastech.com.br           | Brasil/Remoto    |
| Programathor     | programathor.com.br             | Brasil/Remoto    |
| InfoJobs         | infojobs.com.br                 | Bauru            |
| Trabalha Brasil  | trabalhabrasil.com.br           | Bauru            |

---

## 🛠️ Stack

| Tecnologia        | Uso                                        |
|------------------|--------------------------------------------|
| Next.js 15        | Framework (App Router + Turbopack)        |
| React 19          | UI                                         |
| Tailwind CSS v4   | Estilos                                    |
| shadcn/ui         | Componentes                               |
| Sonner            | Toasts                                     |
| Axios             | Scraping (server-side)                    |
| Cheerio           | Parse HTML                                |
| Prisma + Postgres | Banco de dados (vagas, usuários, perfil)  |
| NextAuth.js       | Autenticação                              |
| Lucide React      | Ícones                                    |

---

## 🚀 Como rodar

```bash
npm install
cp .env.local.example .env.local
# edite .env.local com DATABASE_URL, NEXTAUTH_SECRET etc.
npm run dev
# Acesse http://localhost:3000
```

---

## 📁 Estrutura

```
app/
├── page.js                  # Página principal — lista de vagas
├── candidaturas/page.js     # Kanban de candidaturas
├── perfil/page.js           # Certificados + export Gupy
├── api/vagas/route.js       # API de scraping (12 fontes)
└── components/VagaModal.js  # Modal de detalhe

components/vagas/
├── VagaCard.js              # Card de vaga individual
├── VagaCardSkeleton.js      # Skeleton de carregamento
└── SharedUI.js              # LoadingBar, ScrollToTopButton…

lib/
├── constants.js             # Constantes e funções utilitárias
├── prisma.js                # Cliente Prisma
└── hooks/
    ├── useVagasFiltros.js   # Hook de filtros e estado de UI
    └── useVagasEstado.js    # Hook de estado global (vagas, fetch, kanban…)
```

---

## 📝 Licença

MIT — uso livre, pessoal.

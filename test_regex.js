const vagas = [
  "COORDENADOR DE TI ( TECH SQUAD LEADER)",
  "Estágio em Tecnologia da Informação (Gestão de Acessos)",
  "Analista de Testes de Software",
  "ANALISTA DE INFRAESTRUTURA DE T.I (SERVICE DESK) - BAURU",
  "Desenvolvedor Full Stack (foco em front-end)",
  "Desenvolvedor (a) Full Stack Júnior",
  "DBA JR",
  "Analista de Infraestrutura",
  "Analista de Dados Jr.",
  "Consultor de Sistemas",
  "Analista de Sistemas Pleno",
  "Engenheiro de Software",
  "Desenvolvedor Vibe Coding Pl",
  "Estagiário(a) em desenvolvimento Java",
  "Desenvolvedor front-end junior",
  "Programador(a) Full Stack Pleno"
];

const TI_REGEX    = /\b(desenvolvedor|programador|software|fullstack|full[- ]?stack|front[- ]?end|back[- ]?end|devops|sre|cloud|dados|data|bi\b|power\s?bi|analista.*(sistema|ti|dados|suporte|infra|seguran[çc]a)|engenheiro.*(software|dados|cloud)|arquiteto.*(ti|software|solu)|dba|suporte.*(ti|t[ée]cnico)|help.*desk|service.*desk|infra|segurança|cyber|tecnologia|tech|sistemas|computação|c#|java|python|php|javascript|typescript|node)\b/i;
const EXCLUDE_TI_REGEX = /\b(fiscal|cont[áa]bil|contabilidade|financeiro|rh|recursos humanos|departamento pessoal|vendas|comercial|marketing|faturamento|tribut[áa]rio|cobran[çc]a|telemarketing|atendimento)\b/i;

vagas.forEach(titulo => {
  const isTI = (TI_REGEX.test(titulo)) && !EXCLUDE_TI_REGEX.test(titulo);
  console.log(`${isTI ? '✅' : '❌'} ${titulo}`);
});

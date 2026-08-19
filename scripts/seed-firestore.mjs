// Script descartável: sobe as edições de exemplo (antigo EDICOES_MOCK) para o
// Firestore. Rodar uma única vez com `node scripts/seed-firestore.mjs`.
//
// Pré-requisito: as regras do Firestore precisam permitir escrita (a Auth
// ainda não está integrada ao app). Depois de rodar, este arquivo pode ser
// apagado.

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBvQmd9ZRTczIo_RC_DkTlHNC3MX27Dz3I',
  authDomain: 'conecta-news-cc.firebaseapp.com',
  projectId: 'conecta-news-cc',
  storageBucket: 'conecta-news-cc.firebasestorage.app',
  messagingSenderId: '176718362145',
  appId: '1:176718362145:web:122bd8d9016861f0289560',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const edicoes = [
  {
    titulo: 'Atualizações da Semana',
    resumo:
      'Ajustes de performance e novas automações de atendimento, além da Wallet Digital em fase final de testes.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-08-25', dataFim: '2026-08-31' },
    status: 'publico',
    criadoEm: '2026-08-31',
    servicoDestaque: {
      titulo: 'Wallet Digital chega para todos os municípios',
      descricao:
        'A carteira digital do cidadão sai da fase de testes e passa a armazenar documentos, comprovantes e benefícios em um único lugar, direto pelo app.',
      imagemUrl: 'https://loremflickr.com/900/650/fintech',
      imagemPosicao: 'centro',
      cor: 'roxo',
    },
    atualizacoes: [
      {
        id: 'atualizacao-01',
        categoria: 'novidades',
        icone: 'bi-diagram-3',
        titulo: 'Seleção por departamento',
        descricao: 'Em validação a seleção de serviços e departamentos para atendimento por perfil.',
        impacto: 'Garante maior precisão na organização dos serviços.',
        midia: { tipo: 'imagem', url: 'https://loremflickr.com/900/650/office,teamwork,technology' },
        visivel: true,
      },
      {
        id: 'atualizacao-02',
        categoria: 'melhorias',
        icone: 'bi-zoom-in',
        titulo: 'Melhoria no zoom dos mapas do admin',
        descricao: 'Ajuste no comportamento do zoom dos mapas utilizados nas áreas administrativas.',
        impacto: 'Facilita a visualização de informações georreferenciadas.',
        midia: { tipo: 'imagem', url: 'https://loremflickr.com/900/650/citystreet,aerial' },
        visivel: true,
      },
      {
        id: 'atualizacao-03',
        categoria: 'correcoes',
        icone: 'bi-bell',
        titulo: 'Correção na notificação de reagendamento',
        descricao: 'Correção no fluxo de notificação enviada após o reagendamento de atendimentos.',
        impacto: 'Evita retrabalho nas agendas das equipes.',
        visivel: false,
      },
      {
        id: 'atualizacao-04',
        categoria: 'testes',
        icone: 'bi-shield-lock',
        titulo: 'Restrição de módulos por tags',
        descricao: 'Em testes a possibilidade de restringir o acesso a módulos via tags de configuração.',
        impacto: 'Permite maior flexibilidade na gestão de permissões.',
        midia: { tipo: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4' },
        visivel: true,
      },
      {
        id: 'atualizacao-06',
        categoria: 'proximos-passos',
        icone: 'bi-bell',
        titulo: 'Central de notificações unificada',
        descricao: 'Reunir alertas de atendimento, tributos e serviços em um único painel de notificações.',
        impacto: 'Reduz a dispersão de avisos entre os diferentes módulos.',
        visivel: true,
      },
    ],
  },
  {
    titulo: 'Atualizações da Semana',
    resumo: 'Assinatura digital de requerimentos e um novo assistente de atendimento em fase de testes.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-08-18', dataFim: '2026-08-24' },
    status: 'publico',
    criadoEm: '2026-08-24',
    atualizacoes: [
      {
        id: 'atualizacao-07',
        categoria: 'novidades',
        icone: 'bi-file-earmark-text',
        titulo: 'Assinatura digital de requerimentos',
        descricao: 'Cidadãos agora podem assinar requerimentos digitalmente, sem precisar comparecer presencialmente.',
        impacto: 'Reduz deslocamentos e agiliza a abertura de processos.',
        midia: { tipo: 'imagem', url: 'https://loremflickr.com/900/650/handshake,business' },
        visivel: true,
      },
      {
        id: 'atualizacao-08',
        categoria: 'correcoes',
        icone: 'bi-tools',
        titulo: 'Ajuste no cálculo de taxas municipais',
        descricao: 'Correção em um arredondamento incorreto no cálculo de taxas de alguns serviços.',
        impacto: 'Garante que os valores exibidos batem exatamente com a guia de pagamento.',
        visivel: true,
      },
      {
        id: 'atualizacao-09',
        categoria: 'testes',
        icone: 'bi-lightning-charge',
        titulo: 'Assistente de atendimento com IA',
        descricao: 'Em teste com equipes internas um assistente que sugere respostas para dúvidas frequentes.',
        impacto: 'Deve reduzir o tempo médio de resposta ao cidadão.',
        midia: { tipo: 'video', url: 'https://download.samplelib.com/mp4/sample-5s.mp4' },
        visivel: true,
      },
      {
        id: 'atualizacao-10',
        categoria: 'proximos-passos',
        icone: 'bi-signpost-2',
        titulo: 'Integração com o Portal da Transparência',
        descricao: 'Planejada a integração automática de dados públicos com o Portal da Transparência do município.',
        impacto: 'Aumenta a visibilidade dos gastos públicos para a população.',
        visivel: true,
      },
    ],
  },
  {
    titulo: 'Wallet Digital em Testes',
    resumo: 'Uma nova visão sobre carteira digital e benefícios.',
    tipo: 'especial',
    periodo: { tipo: 'especial', tema: 'Wallet Digital' },
    status: 'arquivado',
    criadoEm: '2026-08-17',
    atualizacoes: [
      {
        id: 'atualizacao-05',
        categoria: 'proximos-passos',
        icone: 'bi-wallet2',
        titulo: 'Armazenamento de documentos',
        descricao: 'Continuidade dos testes de armazenamento de documentos e benefícios digitais.',
        impacto: 'Amplia o alcance da carteira digital para novos serviços.',
        visivel: true,
      },
    ],
  },
  {
    titulo: 'Especial: Dia dos Pais',
    resumo:
      'Uma homenagem aos pais que também são cidadãos, servidores públicos e usuários do Conecta Cidades todos os dias.',
    tipo: 'especial',
    periodo: { tipo: 'especial', tema: 'Dia dos Pais' },
    status: 'publico',
    criadoEm: '2026-08-09',
    servicoDestaque: {
      titulo: 'Feliz Dia dos Pais!',
      descricao:
        'Para celebrar a data, destacamos as funcionalidades que ajudam famílias a organizar o dia a dia com o poder público de forma mais leve e prática.',
      imagemUrl: 'https://loremflickr.com/900/650/fatherdaughter',
      imagemPosicao: 'centro',
      cor: 'laranja',
    },
    atualizacoes: [
      {
        id: 'atualizacao-11',
        categoria: 'novidades',
        icone: 'bi-person-check',
        titulo: 'Agendamento em família',
        descricao: 'Agora é possível agendar atendimentos para mais de um membro da família em um único horário.',
        impacto: 'Facilita a vida de pais que cuidam da agenda de toda a casa.',
        midia: { tipo: 'imagem', url: 'https://loremflickr.com/900/650/appointment,schedule' },
        visivel: true,
      },
      {
        id: 'atualizacao-12',
        categoria: 'proximos-passos',
        icone: 'bi-calendar-check',
        titulo: 'Ampliação do horário de atendimento aos sábados',
        descricao: 'Em estudo a extensão do horário de atendimento presencial para os sábados pela manhã.',
        impacto: 'Facilita o acesso de quem trabalha durante a semana.',
        visivel: true,
      },
    ],
  },
  {
    titulo: 'Resumo de Agosto',
    resumo: 'Panorama das principais entregas do mês, com destaque para os novos painéis de indicadores.',
    tipo: 'mensal',
    periodo: { tipo: 'mensal', mes: 8, ano: 2026 },
    status: 'publico',
    criadoEm: '2026-08-10',
    atualizacoes: [
      {
        id: 'atualizacao-13',
        categoria: 'novidades',
        icone: 'bi-graph-up-arrow',
        titulo: 'Painel de indicadores por secretaria',
        descricao: 'Cada secretaria agora tem um painel próprio com indicadores de atendimento em tempo real.',
        impacto: 'Facilita o acompanhamento de metas por gestores setoriais.',
        midia: { tipo: 'imagem', url: 'https://loremflickr.com/900/650/chart,report' },
        visivel: true,
      },
      {
        id: 'atualizacao-14',
        categoria: 'melhorias',
        icone: 'bi-file-earmark-text',
        titulo: 'Nova busca por CPF/CNPJ nos processos',
        descricao: 'A busca de processos administrativos agora aceita CPF e CNPJ além do número do protocolo.',
        impacto: 'Agiliza a localização de processos pelos atendentes.',
        visivel: true,
      },
    ],
  },
  {
    titulo: 'Atualizações da Semana',
    resumo: 'Aprimoramentos nos fluxos de atendimento.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-07-21', dataFim: '2026-07-24' },
    status: 'publico',
    criadoEm: '2026-07-24',
    atualizacoes: [
      {
        id: 'atualizacao-15',
        categoria: 'novidades',
        icone: 'bi-geo-alt',
        titulo: 'Mapa de pontos de atendimento',
        descricao: 'Novo mapa interativo com todos os pontos de atendimento presencial da prefeitura.',
        impacto: 'Ajuda o cidadão a encontrar a unidade mais próxima.',
        midia: { tipo: 'imagem', url: 'https://loremflickr.com/900/650/citystreet,aerial' },
        visivel: true,
      },
    ],
  },
  {
    titulo: 'Resumo de Julho',
    resumo: 'Principais entregas e correções do mês.',
    tipo: 'mensal',
    periodo: { tipo: 'mensal', mes: 7, ano: 2026 },
    status: 'publico',
    criadoEm: '2026-07-15',
    atualizacoes: [],
  },
  {
    titulo: 'Atualizações da Semana',
    resumo: 'Correções e melhorias de desempenho.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-07-07', dataFim: '2026-07-08' },
    status: 'arquivado',
    criadoEm: '2026-07-08',
    atualizacoes: [],
  },
  {
    titulo: 'Destaques do Semestre',
    resumo: 'Os principais avanços da plataforma no primeiro semestre.',
    tipo: 'anual',
    periodo: { tipo: 'anual', ano: 2026 },
    status: 'publico',
    criadoEm: '2026-06-15',
    atualizacoes: [],
  },
];

async function seed() {
  const colecao = collection(db, 'edicoes');
  for (const edicao of edicoes) {
    const referencia = await addDoc(colecao, edicao);
    console.log(`Criada: ${edicao.titulo} (${edicao.criadoEm}) -> ${referencia.id}`);
  }
  console.log(`\n${edicoes.length} edições criadas com sucesso.`);
}

seed()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error('Erro ao popular o Firestore:', erro);
    process.exit(1);
  });

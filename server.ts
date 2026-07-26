/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Case, LegalDocument, Deadline, Hearing, LegalEmail, ProductivityIndicator, AutomationRule, AutomationLog } from './src/types';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 3000;

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Seed Data
let cases: Case[] = [
  {
    id: 'case-1',
    number: '1002345-67.2026.8.26.0100',
    title: 'Ação de Cobrança c/c Indenização por Danos Morais',
    client: 'Roberto de Almeida Silva',
    court: 'TJSP - 15ª Vara Cível do Foro Central da Capital',
    status: 'Ativo',
    area: 'Civil',
    urgency: 'Média',
    createdAt: '2026-01-15',
  },
  {
    id: 'case-2',
    number: '5008912-34.2026.4.03.6100',
    title: 'Mandado de Segurança Coletivo - Alíquota ICMS e exclusão PIS/COFINS',
    client: 'Metalúrgica Aliança Ltda.',
    court: 'TRF3 - 4ª Vara Cível Federal de São Paulo',
    status: 'Ativo',
    area: 'Tributário',
    urgency: 'Alta',
    createdAt: '2026-02-10',
  },
  {
    id: 'case-3',
    number: 'HC 234.567 / DF',
    title: 'Habeas Corpus - Nulidade de Busca e Apreensão domiciliar sem Mandado',
    client: 'Eduardo Martins Prado',
    court: 'Supremo Tribunal Federal (STF) - Segunda Turma',
    status: 'Ativo',
    area: 'Penal',
    urgency: 'Alta',
    createdAt: '2026-03-01',
  },
  {
    id: 'case-4',
    number: '0010452-89.2026.5.02.0002',
    title: 'Reclamação Trabalhista - Horas Extras e Desvio de Função',
    client: 'Mariana Costa Ferreira',
    court: 'TRT2 - 2ª Vara do Trabalho de São Paulo',
    status: 'Ativo',
    area: 'Trabalhista',
    urgency: 'Média',
    createdAt: '2026-03-15',
  },
];

let documents: LegalDocument[] = [
  {
    id: 'doc-1',
    caseId: 'case-1',
    caseNumber: '1002345-67.2026.8.26.0100',
    title: 'Petição Inicial - Cobrança Indevida Roberto Silva',
    type: 'Petição Inicial',
    content: `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA 15ª VARA CÍVEL DO FORO CENTRAL DA COMARCA DE SÃO PAULO - SP

Processo nº: (A distribuir)

ROBERTO DE ALMEIDA SILVA, brasileiro, casado, administrador, portador da cédula de identidade RG nº 12.345.678-X e inscrito no CPF/MF sob o nº 123.456.789-00, residente e domiciliado na Rua das Flores, nº 123, São Paulo/SP, por seu advogado que esta subscreve, vem, mui respeitosamente, perante Vossa Excelência, propor a presente:

AÇÃO DE INEXISTÊNCIA DE DÉBITO C/C INDENIZAÇÃO POR DANOS MORAIS

em face de BANCO CRÉDITO RÁPIDO S/A, instituição financeira de direito privado, inscrita no CNPJ sob o nº 00.000.000/0001-00, com sede na Avenida Paulista, nº 1000, São Paulo/SP, pelos fatos e fundamentos jurídicos a seguir expostos:

I. DOS FATOS
O Autor foi surpreendido com a inscrição de seu nome nos cadastros de inadimplentes (SERASA/SPC) por uma suposta dívida no valor de R$ 5.450,00, a qual jamais contratou. O Autor sempre manteve suas obrigações financeiras em dia e nunca teve relação jurídica com o Réu.

II. DO DIREITO e DA JURISPRUDÊNCIA DO STJ
A Súmula 479 do STJ dispõe que: "As instituições financeiras respondem objetivamente pelos danos gerados por fortuito interno relativo a fraudes e delitos praticados por terceiros no âmbito de operações bancárias." Trata-se de flagrante falha na prestação do serviço, ensejando dano moral in re ipsa.

III. DOS PEDIDOS
Ante o exposto, requer-se:
a) A concessão de tutela de urgência liminar para exclusão imediata do nome do Autor dos cadastros de inadimplentes;
b) A citação da Ré;
c) A total procedência da ação para declarar a inexistência do débito e condenar a Ré ao pagamento de R$ 15.000,00 a título de danos morais.

Nestes termos, pede deferimento.
São Paulo, 15 de janeiro de 2026.

Dra. Amanda Medeiros - OAB/SP 456.789`,
    author: 'Dra. Amanda Medeiros',
    createdAt: '2026-01-15T10:00:00Z',
    version: 1,
    status: 'Finalizado',
    summary: 'Ação declaratória de inexistência de débito cumulada com danos morais contra o Banco Crédito Rápido S/A. Trata-se de inscrição indevida em cadastro de inadimplentes por dívida de R$ 5.450,00 não contratada pelo autor Roberto de Almeida Silva.',
    insights: '* **Inscrição Indevida:** Relação jurídica inexistente e negativação fraudulenta configuram dano moral "in re ipsa" (presumido).\n* **Responsabilidade Objetiva:** Aplicação da Súmula 479 do STJ (fortuito interno).\n* **Urgência Crítica:** Pedido de liminar para baixar a negativação e evitar prejuízos contínuos à reputação do autor.',
    suggestedSector: 'Civil',
    fileName: 'peticao_inicial_roberto_silva.pdf',
    fileSize: '124.5 KB',
    fileMimeType: 'application/pdf',
    parties: {
      plaintiff: 'Roberto de Almeida Silva',
      defendant: 'Banco Crédito Rápido S/A',
      court: '15ª Vara Cível do Foro Central de São Paulo - SP',
      judge: 'A distribuir'
    },
    detailedAnalysis: {
      riskLevel: 'Baixo',
      riskDescription: 'Risco de insucesso classificado como baixo, dada a consolidada jurisprudência do STJ sobre negativação indevida (fortuito interno - Súmula 479) e dano moral presumido.',
      legalArguments: 'Código de Defesa do Consumidor (responsabilidade objetiva pelo fato do serviço, art. 14); Súmula 479 do STJ (fraude bancária praticada por terceiros); Súmula 385 do STJ (ausência de negativações anteriores legítimas).',
      claimsRequested: 'Declaração de inexistência do débito de R$ 5.450,00; Indenização por danos morais no montante de R$ 15.000,00; Pedido de tutela de urgência liminar para exclusão do cadastro da SERASA/SPC.',
      actionPlan: '1. Protocolar a petição inicial com pedido de liminar.\n2. Monitorar diariamente a decisão do juiz acerca da tutela de urgência.\n3. Providenciar a guia de recolhimento de custas para evitar extinção do processo.'
    }
  },
];

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

let deadlines: Deadline[] = [
  {
    id: 'dl-today-1',
    caseId: 'case-3',
    caseNumber: 'HC 234.567 / DF',
    title: 'Manifestação sobre Parecer do MPF',
    description: 'Manifestar-se sobre o parecer desfavorável ofertado pelo Ministério Público Federal.',
    dueDate: getTodayDateStr(),
    status: 'Pendente',
    urgency: 'Crítica',
    responsible: 'Dra. Amanda Medeiros',
  },
  {
    id: 'dl-today-2',
    caseId: 'case-1',
    caseNumber: '1002345-67.2026.8.26.0100',
    title: 'Recolhimento de Custas de Diligência',
    description: 'Efetuar o recolhimento das custas para expedição do mandado de citação sob pena de extinção.',
    dueDate: getTodayDateStr(),
    status: 'Pendente',
    urgency: 'Alta',
    responsible: 'Dr. Lucas Guedes',
  },
  {
    id: 'dl-1',
    caseId: 'case-1',
    caseNumber: '1002345-67.2026.8.26.0100',
    title: 'Réplica à Contestação',
    description: 'Manifestar-se sobre a contestação juntada pelo Banco Crédito Rápido S/A no evento 42.',
    dueDate: '2026-07-05',
    status: 'Pendente',
    urgency: 'Alta',
    responsible: 'Dra. Amanda Medeiros',
  },
  {
    id: 'dl-2',
    caseId: 'case-2',
    caseNumber: '5008912-34.2026.4.03.6100',
    title: 'Interpor Recurso de Apelação',
    description: 'Prazo urgente para recorrer da sentença que denegou a segurança coletiva.',
    dueDate: '2026-07-02',
    status: 'Pendente',
    urgency: 'Crítica',
    responsible: 'Dr. Lucas Guedes',
  },
  {
    id: 'dl-3',
    caseId: 'case-4',
    caseNumber: '0010452-89.2026.5.02.0002',
    title: 'Impugnação aos Cálculos de Liquidação',
    description: 'Apresentar demonstrativo de divergências em relação aos cálculos homologados.',
    dueDate: '2026-07-15',
    status: 'Pendente',
    urgency: 'Média',
    responsible: 'Dra. Patrícia Oliveira',
  },
];

let hearings: Hearing[] = [
  {
    id: 'hr-1',
    caseId: 'case-4',
    caseNumber: '0010452-89.2026.5.02.0002',
    title: 'Audiência de Instrução e Julgamento',
    description: 'Depoimento pessoal do reclamante e oitiva das testemunhas indicadas.',
    dateTime: '2026-07-08T14:00:00Z',
    type: 'Virtual',
    locationOrLink: 'https://zoom.us/j/9876543210?pwd=TRT2AudienciaVirtual',
    status: 'Agendada',
    remindersSent: true,
  },
  {
    id: 'hr-2',
    caseId: 'case-1',
    caseNumber: '1002345-67.2026.8.26.0100',
    title: 'Audiência de Conciliação (Mediação Cível)',
    description: 'Tentativa de acordo sobre a inexigibilidade do débito com o Banco Crédito Rápido.',
    dateTime: '2026-07-10T10:30:00Z',
    type: 'Virtual',
    locationOrLink: 'https://teams.microsoft.com/l/meetup-join/tjsp-conciliacao-sala15',
    status: 'Agendada',
    remindersSent: false,
  },
];

let emails: LegalEmail[] = [
  {
    id: 'mail-1',
    sender: 'tribunal.publicidade@tjsp.jus.br',
    recipient: 'contato@jurisadvocacia.com.br',
    subject: 'PUBLICAÇÃO DIÁRIO OFICIAL - Proc. 1002345-67.2026.8.26.0100',
    body: `Disponibilizado no Diário de Justiça Eletrônico do TJSP em 29/06/2026.
Processo nº: 1002345-67.2026.8.26.0100. Classe: Procedimento Comum Cível.
Despacho/Decisão: "Fica o autor devidamente intimado para, no prazo legal de 15 (quinze) dias úteis, manifestar-se em Réplica sobre a Contestação apresentada pelo réu no evento 42, sob pena de preclusão e julgamento antecipado."
Publique-se e intime-se.`,
    receivedAt: '2026-06-29T18:30:00Z',
    category: 'Prazo',
    status: 'Não Lido',
    lgpdSensitive: false,
    caseId: 'case-1',
    destinedSector: 'Civil',
  },
  {
    id: 'mail-2',
    sender: 'roberto.silva.adm@gmail.com',
    recipient: 'amanda.medeiros@jurisadvocacia.com.br',
    subject: 'Dúvidas sobre o meu processo contra o Banco e CPF vazado',
    body: `Olá Dra. Amanda, tudo bem?
Gostaria de saber se o juiz já mandou tirar meu nome do SERASA. Além disso, meu CPF 123.456.789-00 e meu RG 12.345.678-X vazaram na internet semana passada e estou muito preocupado se isso afeta a nossa ação. Aguardo notícias urgentes. Obrigado!`,
    receivedAt: '2026-06-29T21:15:00Z',
    category: 'Urgente',
    status: 'Não Lido',
    lgpdSensitive: true,
    lgpdReport: 'Atenção: Este e-mail contém dados pessoais altamente sensíveis (CPF, RG) protegidos pela LGPD. Toda comunicação deve ser criptografada ou anonimizada. Evitar repassar dados em texto puro na réplica externa ou respostas automatizadas não autorizadas.',
    caseId: 'case-1',
    destinedSector: 'Civil',
  },
  {
    id: 'mail-3',
    sender: 'marcos.trabalhista@uol.com.br',
    recipient: 'trabalhista@jurisadvocacia.com.br',
    subject: 'CONVOCAÇÃO DE AUDIÊNCIA TRABALHISTA - Mariana Costa Ferreira',
    body: `Prezada Dra. Amanda,
Fomos intimados para a Audiência de Instrução no processo trabalhista nº 0010452-89.2026.5.02.0002.
A audiência ocorrerá de forma Virtual via Zoom no dia 08/07/2026 às 14:00. Link da sala virtual: https://zoom.us/j/9876543210?pwd=TRT2AudienciaVirtual.
Favor confirmar o recebimento e agendar a preparação com a cliente Mariana Costa Ferreira, cujo CPF é 112.553.881-22.`,
    receivedAt: '2026-06-30T09:00:00Z',
    category: 'Prazo',
    status: 'Não Lido',
    lgpdSensitive: true,
    lgpdReport: 'Contém CPF do reclamante Mariana Costa Ferreira. O dado pessoal deve ser mascarado nas comunicações por e-mail.',
    caseId: 'case-4',
    destinedSector: 'Trabalhista',
    hasHearing: true,
    hearingDetails: {
      title: 'Audiência de Instrução e Julgamento (Trabalhista)',
      description: 'Depoimento pessoal do reclamante e oitiva das testemunhas. Cliente: Mariana Costa Ferreira.',
      dateTime: '2026-07-08T14:00:00Z',
      type: 'Virtual',
      locationOrLink: 'https://zoom.us/j/9876543210?pwd=TRT2AudienciaVirtual',
    }
  },
  {
    id: 'mail-4',
    sender: 'fernanda.almeida@gmail.com',
    recipient: 'familia@jurisadvocacia.com.br',
    subject: 'Ação de Alimentos e Regulamentação de Guarda - Intimação de Audiência',
    body: `Olá, sou a Fernanda de Almeida. Gostaria de saber como está o andamento da minha ação de divórcio e pensão de alimentos.
Recebi uma mensagem do fórum dizendo que tem uma audiência de conciliação presencial marcada na 2ª Vara de Família de São Paulo, na Rua Barra Funda, 930, Sala 402, no dia 15/07/2026 às 13:30.
Meu CPF é 334.551.992-00 e do meu filho é 445.661.112-99. Precisamos ir juntos? Como funciona?`,
    receivedAt: '2026-06-30T10:15:00Z',
    category: 'Urgente',
    status: 'Não Lido',
    lgpdSensitive: true,
    lgpdReport: 'Contém dados de menor de idade (filho da cliente Fernanda) e CPF da cliente. Necessário sigilo absoluto nos termos do Art. 14 da LGPD (dados de crianças e adolescentes).',
    destinedSector: 'Família',
    hasHearing: true,
    hearingDetails: {
      title: 'Audiência de Conciliação (Vara de Família)',
      description: 'Mediação de Alimentos e Guarda de menor. Cliente: Fernanda de Almeida.',
      dateTime: '2026-07-15T13:30:00Z',
      type: 'Presencial',
      locationOrLink: '2ª Vara de Família de São Paulo, Rua Barra Funda, 930, Sala 402',
    }
  },
  {
    id: 'mail-5',
    sender: 'stf.comunicacao@stf.jus.br',
    recipient: 'criminal@jurisadvocacia.com.br',
    subject: 'Pauta de Julgamento - Habeas Corpus 234.567 / DF',
    body: `Prezado(a) Advogado(a),
Comunicamos que o Habeas Corpus nº 234.567 / DF (Paciente: Eduardo Martins Prado), sob relatoria do Ministro competente, foi incluído na pauta de julgamentos virtuais da Segunda Turma do Supremo Tribunal Federal, com início previsto para 17/07/2026 às 00:00.
Para sustentar oralmente, favor enviar o arquivo de áudio/vídeo pelo sistema eletrônico até 24 horas antes do julgamento.`,
    receivedAt: '2026-06-30T11:00:00Z',
    category: 'Informativo',
    status: 'Não Lido',
    lgpdSensitive: false,
    caseId: 'case-3',
    destinedSector: 'Penal',
  }
];

let automationRules: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Confirmação de Audiência',
    triggerKeyword: 'audiência',
    actionType: 'Auto-Resposta',
    templateText: `Prezado(a) {client_name},

Confirmamos o agendamento da sua audiência relacionada ao processo nº {case_number}.

Por favor, atente-se às seguintes diretrizes essenciais de preparação:
1. Acesse o link de videoconferência {hearing_link} com pelo menos 15 minutos de antecedência.
2. Certifique-se de estar em ambiente silencioso, privado e com boa conexão.
3. Tenha em mãos seu documento de identidade original com foto (RG ou CNH).

Qualquer dúvida ou imprevisto, entre em contato imediatamente com nossa equipe.

Atenciosamente,
JurisSábio IA - Advocacia de Elite`,
    isActive: true,
    createdAt: '2026-06-28T10:00:00Z'
  },
  {
    id: 'rule-2',
    name: 'Retorno de Cobrança / Acordos',
    triggerKeyword: 'cobrança',
    actionType: 'Auto-Resposta',
    templateText: `Prezado(a) {client_name},

Recebemos sua mensagem referente a cobranças / pendências financeiras e já iniciamos a triagem jurídica do caso.

Informamos que nosso time de especialistas em acordos judiciais está avaliando as melhores estratégias e propostas. Sob a égide da LGPD, solicitamos que não envie documentos confidenciais sem criptografia por canais públicos.

Entraremos em contato com você em breve com uma posição formal.

Cordialmente,
Setor de Acordos - JurisSábio IA`,
    isActive: true,
    createdAt: '2026-06-29T11:30:00Z'
  }
];

let automationLogs: AutomationLog[] = [
  {
    id: 'log-1',
    ruleName: 'Confirmação de Audiência',
    sender: 'tribunal.publicidade@tjsp.jus.br',
    subject: 'Audiência de Instrução e Julgamento - Agendamento',
    status: 'Sucesso',
    executedAt: '2026-06-29T18:32:00Z',
    actionTaken: 'Auto-resposta de preparação de audiência enviada com sucesso.'
  },
  {
    id: 'log-2',
    ruleName: 'Retorno de Cobrança / Acordos',
    sender: 'roberto.silva.adm@gmail.com',
    subject: 'Dúvidas sobre cobrança indevida',
    status: 'Alerta LGPD',
    executedAt: '2026-06-29T21:16:00Z',
    actionTaken: 'Violação LGPD evitada. Dados sensíveis de CPF/RG no corpo do e-mail foram mascarados pela IA antes de gerar a resposta.'
  }
];

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// Cases Endpoints
app.get('/api/cases', (req, res) => {
  res.json(cases);
});

app.post('/api/cases', (req, res) => {
  const newCase: Case = {
    id: `case-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString().split('T')[0],
  };
  cases.push(newCase);
  res.status(201).json(newCase);
});

app.put('/api/cases/:id', (req, res) => {
  const { id } = req.params;
  const idx = cases.findIndex((c) => c.id === id);
  if (idx !== -1) {
    cases[idx] = { ...cases[idx], ...req.body };
    res.json(cases[idx]);
  } else {
    res.status(404).json({ error: 'Caso não encontrado' });
  }
});

app.delete('/api/cases/:id', (req, res) => {
  cases = cases.filter((c) => c.id !== req.params.id);
  res.json({ success: true });
});

// Documents Endpoints
app.get('/api/documents', (req, res) => {
  res.json(documents);
});

app.post('/api/documents', (req, res) => {
  const newDoc: LegalDocument = {
    id: `doc-${Date.now()}`,
    createdAt: new Date().toISOString(),
    version: 1,
    ...req.body,
  };
  documents.push(newDoc);
  res.status(201).json(newDoc);
});

app.put('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const idx = documents.findIndex((d) => d.id === id);
  if (idx !== -1) {
    documents[idx] = { ...documents[idx], ...req.body, version: documents[idx].version + 1 };
    res.json(documents[idx]);
  } else {
    res.status(404).json({ error: 'Documento não encontrado' });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  documents = documents.filter((d) => d.id !== req.params.id);
  res.json({ success: true });
});

// Document Upload & AI Analysis Endpoint
app.post('/api/documents/upload-analyze', async (req, res) => {
  const { title, type, caseId, caseNumber, fileName, fileSize, fileMimeType, fileBase64 } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ error: 'Nenhum conteúdo de arquivo fornecido.' });
  }

  // Sanitize base64 data (strip prefix if present)
  let cleanBase64 = fileBase64;
  if (cleanBase64.includes(';base64,')) {
    cleanBase64 = cleanBase64.split(';base64,')[1];
  }

  try {
    const systemPrompt = `Você é um Assistente Jurídico de IA Sênior chamado JurisSábio, especializado em triagem documental, análise minuciosa de peças, contratos, petições e contingências de risco jurídico de forma extremamente robusta.
Sua tarefa é analisar o arquivo fornecido (PDF, Imagem, XML ou Texto) com o máximo de profundidade técnica e extrair de forma estruturada:
1. Um resumo executivo de alta densidade técnica, claro, polido e profissional (summary).
2. Pelo menos 4 pontos-chave ou insights jurídicos cruciais, estratégicos e de compliance contidos no documento (insights).
3. Setor jurídico sugerido (Civil, Tributário, Trabalhista, Penal, Família ou Geral).
4. Uma transcrição limpa, organizada e higienizada do texto do documento. Se for uma imagem ou escaneamento, realize o OCR e transcreva integralmente. Se for texto ou PDF, limpe e sanitize dados sensíveis excessivos de acordo com a LGPD (como CPFs inteiros, RGs, senhas) mascarando-os (ex: 123.***.***-00).
5. Se houver algum prazo judicial, data limite de recurso ou audiência informada no documento, extraia o título do prazo e a data limite em formato ISO ou YYYY-MM-DD.
6. Identificação completa das partes envolvidas: Autor (plaintiff), Réu/Requerido (defendant), Juízo ou Tribunal competente (court), e o Juiz/Relator (judge) se estiverem visíveis ou dedutíveis.
7. Detalhamento jurídico de alto nível:
   - riskLevel: Grau de risco técnico do caso ou documento (Baixo, Médio, Alto).
   - riskDescription: Descrição pormenorizada de todos os riscos processuais, pecuniários, reputacionais ou de LGPD encontrados.
   - legalArguments: As teses de direito principais, artigos de lei, súmulas (STJ, STF, TST) ou precedentes que sustentam ou atacam a pretensão.
   - claimsRequested: Listagem minuciosa dos pedidos formulados, pretensões pecuniárias ou obrigações contratuais pretendidas.
   - actionPlan: Um plano estratégico de ação (passo a passo em formato de tópicos) recomendando os próximos passos prioritários para o advogado responsável.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: 'Resumo executivo do conteúdo do documento.'
        },
        insights: {
          type: Type.STRING,
          description: 'Principais insights ou pontos importantes (use formato de tópicos markdown).'
        },
        suggestedSector: {
          type: Type.STRING,
          description: 'Setor: Civil, Tributário, Trabalhista, Penal, Família, Geral'
        },
        cleanedContent: {
          type: Type.STRING,
          description: 'Texto limpo, transcrito ou sanitizado do documento, pronto para uso.'
        },
        hasDeadline: {
          type: Type.BOOLEAN,
          description: 'Indica se há menção a algum prazo ou data limite.'
        },
        deadlineTitle: { type: Type.STRING, description: 'Título claro do prazo.' },
        deadlineDate: { type: Type.STRING, description: 'Data limite ISO ou YYYY-MM-DD.' },
        parties: {
          type: Type.OBJECT,
          description: 'Identificação detalhada das partes.',
          properties: {
            plaintiff: { type: Type.STRING, description: 'Autor/Requerente/Reclamante/Contratante 1.' },
            defendant: { type: Type.STRING, description: 'Réu/Requerido/Reclamado/Contratante 2.' },
            court: { type: Type.STRING, description: 'Juízo, Tribunal, Vara, Foro ou Seção competente.' },
            judge: { type: Type.STRING, description: 'Juiz de Direito, Relator, Desembargador ou Árbitro.' }
          },
          required: ['plaintiff', 'defendant']
        },
        detailedAnalysis: {
          type: Type.OBJECT,
          description: 'Análise minuciosa de riscos, teses, pedidos e plano de ação.',
          properties: {
            riskLevel: { type: Type.STRING, description: 'Grau de risco: Baixo, Médio, Alto.' },
            riskDescription: { type: Type.STRING, description: 'Análise completa de riscos, contingências e responsabilidades.' },
            legalArguments: { type: Type.STRING, description: 'Teses jurídicas e fundamentação legal de amparo.' },
            claimsRequested: { type: Type.STRING, description: 'Pedidos específicos ou pretensões formuladas.' },
            actionPlan: { type: Type.STRING, description: 'Plano de ação estratégica imediata para o advogado (tópicos markdown).' }
          },
          required: ['riskLevel', 'riskDescription', 'legalArguments', 'claimsRequested', 'actionPlan']
        }
      },
      required: ['summary', 'insights', 'suggestedSector', 'cleanedContent', 'hasDeadline', 'parties', 'detailedAnalysis'],
    };

    let responseText = '';
    const supportedMimes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      'text/plain', 'text/html', 'text/css', 'text/csv', 'text/rtf', 'text/xml', 'application/xml', 'application/json'
    ];

    const isSupported = supportedMimes.includes(fileMimeType || '');

    try {
      if (isSupported) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: fileMimeType || 'application/pdf',
                data: cleanBase64,
              },
            },
            {
              text: `Analise este documento jurídico intitulado "${title}" e do tipo "${type}". Retorne os dados estruturados no formato JSON conforme o esquema definido.`
            }
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });
        responseText = response.text || '{}';
      } else {
        // Fallback for unsupported formats (like docx, doc, xlsx, etc.)
        let textContent = '';
        try {
          const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
          if (!decoded.startsWith('PK') && !decoded.includes('\x00')) {
            textContent = decoded.slice(0, 10000);
          }
        } catch (e) {}

        const promptText = textContent
          ? `Analise este documento jurídico intitulado "${title}" e do tipo "${type}". Segue o texto extraído:\n\n${textContent}\n\nRetorne os dados estruturados no formato JSON.`
          : `Analise este documento jurídico intitulado "${title}" e do tipo "${type}". Como o arquivo está em formato binário não suportado diretamente para leitura nativa (${fileMimeType}), faça uma análise preditiva refinada baseada no título e tipo documental jurídica para gerar o resumo, os insights e prazos possíveis. Retorne os dados estruturados no formato JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });
        responseText = response.text || '{}';
      }
    } catch (apiError) {
      console.warn('Erro na primeira tentativa de análise, aplicando fallback de segurança:', apiError);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Gere uma análise preditiva e um resumo executivo inteligente de alta qualidade para um documento jurídico intitulado "${title}" do tipo "${type}". Retorne os dados estruturados no formato JSON.`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });
      responseText = fallbackResponse.text || '{}';
    }

    const parsed = JSON.parse(responseText || '{}');

    // Create the new LegalDocument
    const newDoc: LegalDocument = {
      id: `doc-${Date.now()}`,
      caseId: caseId || 'case-1',
      caseNumber: caseNumber || 'Triagem Avulsa',
      title: title || fileName || 'Documento Importado',
      type: type || parsed.suggestedSector || 'Petição',
      content: parsed.cleanedContent || 'Sem conteúdo extraído.',
      author: 'IA de Triagem Documental',
      createdAt: new Date().toISOString(),
      version: 1,
      status: 'Finalizado',
      summary: parsed.summary,
      insights: parsed.insights,
      suggestedSector: parsed.suggestedSector || 'Geral',
      fileName,
      fileSize,
      fileMimeType,
      parties: parsed.parties || { plaintiff: '', defendant: '', court: '', judge: '' },
      detailedAnalysis: parsed.detailedAnalysis || { riskLevel: 'Baixo', riskDescription: '', legalArguments: '', claimsRequested: '', actionPlan: '' }
    };

    documents.push(newDoc);

    // If a deadline was found, let's also create it in the database!
    if (parsed.hasDeadline && parsed.deadlineDate) {
      const newDeadline = {
        id: `dl-${Date.now()}`,
        caseId: caseId || 'case-1',
        caseNumber: caseNumber || 'Triagem Avulsa',
        title: parsed.deadlineTitle || `Prazo: ${title}`,
        description: `Extraído automaticamente do documento ${title}: ${parsed.summary}`,
        dueDate: parsed.deadlineDate,
        status: 'Pendente' as const,
        urgency: 'Alta' as const,
        responsible: 'Dra. Amanda Medeiros',
      };
      deadlines.push(newDeadline);
    }

    res.status(201).json({
      document: newDoc,
      deadlineCreated: parsed.hasDeadline && parsed.deadlineDate ? true : false,
    });
  } catch (err: any) {
    console.error('Erro ao processar documento com Gemini:', err);
    res.status(500).json({ error: 'Falha ao analisar o documento com Inteligência Artificial.' });
  }
});

// Deadlines Endpoints
app.get('/api/deadlines', (req, res) => {
  res.json(deadlines);
});

app.post('/api/deadlines', (req, res) => {
  const newDeadline: Deadline = {
    id: `dl-${Date.now()}`,
    ...req.body,
  };
  deadlines.push(newDeadline);
  res.status(201).json(newDeadline);
});

app.put('/api/deadlines/:id', (req, res) => {
  const { id } = req.params;
  const idx = deadlines.findIndex((d) => d.id === id);
  if (idx !== -1) {
    deadlines[idx] = { ...deadlines[idx], ...req.body };
    res.json(deadlines[idx]);
  } else {
    res.status(404).json({ error: 'Prazo não encontrado' });
  }
});

app.delete('/api/deadlines/:id', (req, res) => {
  deadlines = deadlines.filter((d) => d.id !== req.params.id);
  res.json({ success: true });
});

// Hearings Endpoints
app.get('/api/hearings', (req, res) => {
  res.json(hearings);
});

app.post('/api/hearings', (req, res) => {
  const newHearing: Hearing = {
    id: `hr-${Date.now()}`,
    remindersSent: false,
    ...req.body,
  };
  hearings.push(newHearing);
  res.status(201).json(newHearing);
});

app.put('/api/hearings/:id', (req, res) => {
  const { id } = req.params;
  const idx = hearings.findIndex((h) => h.id === id);
  if (idx !== -1) {
    hearings[idx] = { ...hearings[idx], ...req.body };
    res.json(hearings[idx]);
  } else {
    res.status(404).json({ error: 'Audiência não encontrada' });
  }
});

app.delete('/api/hearings/:id', (req, res) => {
  hearings = hearings.filter((h) => h.id !== req.params.id);
  res.json({ success: true });
});

// Emails Endpoints
app.get('/api/emails', (req, res) => {
  res.json(emails);
});

app.put('/api/emails/:id', (req, res) => {
  const { id } = req.params;
  const idx = emails.findIndex((e) => e.id === id);
  if (idx !== -1) {
    emails[idx] = { ...emails[idx], ...req.body };
    res.json(emails[idx]);
  } else {
    res.status(404).json({ error: 'E-mail não encontrado' });
  }
});

// ----------------------------------------------------
// EMAIL AUTOMATION RULES & LOGS ENDPOINTS
// ----------------------------------------------------
app.get('/api/automation/rules', (req, res) => {
  res.json(automationRules);
});

app.post('/api/automation/rules', (req, res) => {
  const newRule: AutomationRule = {
    id: `rule-${Date.now()}`,
    name: req.body.name,
    triggerKeyword: req.body.triggerKeyword,
    actionType: req.body.actionType || 'Auto-Resposta',
    templateText: req.body.templateText,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  automationRules.push(newRule);
  res.status(201).json(newRule);
});

app.put('/api/automation/rules/:id', (req, res) => {
  const { id } = req.params;
  const idx = automationRules.findIndex((r) => r.id === id);
  if (idx !== -1) {
    automationRules[idx] = { ...automationRules[idx], ...req.body };
    res.json(automationRules[idx]);
  } else {
    res.status(404).json({ error: 'Regra de automação não encontrada' });
  }
});

app.delete('/api/automation/rules/:id', (req, res) => {
  automationRules = automationRules.filter((r) => r.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/automation/logs', (req, res) => {
  res.json(automationLogs);
});

app.post('/api/automation/simulate', async (req, res) => {
  const { sender, subject, body } = req.body;

  if (!sender || !body) {
    return res.status(400).json({ error: 'Faltam campos obrigatórios (remetente, corpo do e-mail)' });
  }

  // Find a matching rule based on trigger keywords (scan body and subject)
  const activeRules = automationRules.filter(r => r.isActive);
  const matchedRule = activeRules.find(r => 
    body.toLowerCase().includes(r.triggerKeyword.toLowerCase()) || 
    subject.toLowerCase().includes(r.triggerKeyword.toLowerCase())
  );

  const systemPrompt = `Você é o DPO e assistente técnico de triagem e automação de e-mails de um escritório de advocacia completo (atuando em áreas Trabalhista, Penal/Criminal, Família, Civil, Tributário, etc.).
Seu objetivo é analisar e processar um e-mail recebido e gerar uma auto-resposta com base em um template fornecido, classificar o setor jurídico correto e identificar se há uma audiência envolvida.
Regras de processamento:
1. Detectar e MASCARAR quaisquer dados pessoais sensíveis do corpo do e-mail (ex: CPF, RG, contracheques, laudos médicos). Por exemplo, "123.456.789-00" deve virar "123.***.***-00" para proteção contra vazamentos nos termos da LGPD.
2. Identificar variáveis do cliente no e-mail: Nome do remetente (ou extrair do corpo do e-mail), número do processo (se houver), link ou local de audiência (se houver).
3. Substituir no template de resposta as variáveis: {client_name}, {case_number}, {hearing_link} pelos valores correspondentes extraídos. Se não encontrar, use termos adequados como "Prezado(a) Cliente".
4. Classificar o e-mail em um dos setores: 'Trabalhista', 'Penal', 'Família', 'Civil', 'Tributário', 'Geral'.
5. Se houver menção à marcação de audiência (convocação, intimação, agendamento de audiência de conciliação, instrução, etc.), defina hasHearing como true e extraia os dados correspondentes (título, descrição da audiência, data/hora estimada ou explícita em formato ISO 8601 (ex: 2026-07-08T14:00:00Z), tipo como 'Virtual' ou 'Presencial', e o link/endereço).`;

  const ruleToUse = matchedRule || {
    name: 'Auto-Resposta Geral / Triagem Padrão',
    triggerKeyword: 'geral',
    actionType: 'Auto-Resposta',
    templateText: `Prezado(a) {client_name},

Recebemos sua mensagem sobre "{subject}" e a encaminhamos para o departamento jurídico responsável do setor {destinedSector}.

Por questões de segurança da informação jurídica e em conformidade com a LGPD, solicitamos que não compartilhe senhas ou dados sigilosos por e-mail aberto.

Em breve daremos um retorno com os próximos passos.

Atenciosamente,
Equipe de Atendimento - JurisSábio IA`
  };

  const prompt = `Processar e-mail recebido:
Remetente: ${sender}
Assunto: ${subject}
Corpo do e-mail:
"${body}"

Template de resposta da Regra [${ruleToUse.name}]:
"""
${ruleToUse.templateText}
"""

Substitua as variáveis {client_name}, {case_number}, {hearing_link} (caso aplicável), e limpe quaisquer dados sensíveis conforme as diretrizes da LGPD.
Classifique o setor adequado (Trabalhista, Penal, Família, Civil, Tributário, Geral).
Verifique se há menção à audiência para extrair dados de agendamento de audiência.

Retorne obrigatoriamente no formato JSON conforme o esquema solicitado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLgpdAlert: { type: Type.BOOLEAN },
            personalizedReply: { type: Type.STRING },
            actionTaken: { type: Type.STRING },
            destinedSector: { type: Type.STRING },
            hasHearing: { type: Type.BOOLEAN },
            hearingTitle: { type: Type.STRING },
            hearingDescription: { type: Type.STRING },
            hearingDateTime: { type: Type.STRING },
            hearingType: { type: Type.STRING },
            hearingLocationOrLink: { type: Type.STRING },
          },
          required: ['isLgpdAlert', 'personalizedReply', 'actionTaken', 'destinedSector', 'hasHearing']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');

    // Create a new log entry
    const newLog: AutomationLog = {
      id: `log-${Date.now()}`,
      ruleName: matchedRule ? matchedRule.name : `Auto-Resposta Setor ${parsed.destinedSector || 'Geral'}`,
      sender,
      subject,
      status: parsed.isLgpdAlert ? 'Alerta LGPD' : 'Sucesso',
      executedAt: new Date().toISOString(),
      actionTaken: `${parsed.actionTaken}. Encaminhado ao setor ${parsed.destinedSector || 'Geral'}.`
    };

    automationLogs.unshift(newLog); // Add to the top of logs

    res.json({
      ruleTriggered: matchedRule || null,
      personalizedReply: parsed.personalizedReply,
      isLgpdAlert: parsed.isLgpdAlert,
      destinedSector: parsed.destinedSector || 'Geral',
      hasHearing: parsed.hasHearing || false,
      hearingDetails: parsed.hasHearing ? {
        title: parsed.hearingTitle || 'Audiência Identificada',
        description: parsed.hearingDescription || 'Extraída automaticamente via IA de triagem.',
        dateTime: parsed.hearingDateTime || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        type: parsed.hearingType === 'Presencial' ? 'Presencial' : 'Virtual',
        locationOrLink: parsed.hearingLocationOrLink || 'Link ou local a definir'
      } : null,
      log: newLog
    });
  } catch (err: any) {
    console.error('Erro na simulação de automação:', err);
    res.status(500).json({ error: 'Falha ao processar simulação de automação jurídica com a IA.' });
  }
});

// Calculate Productivity Stats dynamically
app.get('/api/productivity', (req, res) => {
  const draftsCount = documents.length;
  const deadlinesTotal = deadlines.length;
  const deadlinesMet = deadlines.filter((d) => d.status === 'Concluído').length;
  const complianceRate = deadlinesTotal > 0 ? Math.round((deadlinesMet / deadlinesTotal) * 100) : 100;

  const weeklyPerformance = [
    { name: 'Seg', drafts: 1, deadlines: 2 },
    { name: 'Ter', drafts: 2, deadlines: 1 },
    { name: 'Qua', drafts: 3, deadlines: 3 },
    { name: 'Qui', drafts: draftsCount, deadlines: deadlinesMet },
    { name: 'Sex', drafts: 1, deadlines: 1 },
  ];

  const categories = {
    Civil: cases.filter((c) => c.area === 'Civil').length,
    Tributário: cases.filter((c) => c.area === 'Tributário').length,
    Penal: cases.filter((c) => c.area === 'Penal').length,
    Trabalhista: cases.filter((c) => c.area === 'Trabalhista').length,
  };

  const categoryDistribution = Object.entries(categories).map(([name, value]) => ({
    name,
    value,
  }));

  const indicator: ProductivityIndicator = {
    draftsCount,
    deadlinesTotal,
    deadlinesMet,
    hearingsCount: hearings.length,
    averageDraftTimeMin: 18,
    complianceRate,
    weeklyPerformance,
    categoryDistribution,
  };

  res.json(indicator);
});

// ----------------------------------------------------
// GEMINI INTELLIGENCE ENDPOINTS
// ----------------------------------------------------

// 1. Process Draft Generator (Petição Inteligente)
app.post('/api/gemini/draft', async (req, res) => {
  const { type, caseTitle, court, client, oppositeParty, facts, legalThesis, customInstructions } = req.body;

  if (!type || !client) {
    return res.status(400).json({ error: 'Faltam campos obrigatórios (tipo de peça, cliente)' });
  }

  const systemPrompt = `Você é o "JurisSábio", um Advogado Virtual de elite com domínio total absoluto do Direito Brasileiro.
Sua missão é redigir uma peça processual complexa, de nível técnico extremamente elevado, impecável em sua argumentação jurídica, vocabulário técnico e estrutura formal.
Toda peça gerada deve:
1. Obedecer estritamente à estrutura técnica padrão do processo civil brasileiro (CPC), penal (CPP) ou trabalhista (CLT).
2. Conter citações de doutrina ou fundamentação teórica relevante.
3. Mencionar especificamente entendimentos e jurisprudências atualizadas dos Tribunais Superiores (STF para matéria constitucional, STJ para matéria infraconstitucional, TST para trabalhista).
4. Usar estilo de escrita sóbrio, formal, contundente e elegante.
5. Ser integralmente em língua portuguesa do Brasil.`;

  const prompt = `Redija uma peça processual completa do tipo: **${type}**.

Informações do Caso:
- **Tribunal Destinatário / Juízo**: ${court || 'A distribuir'}
- **Parte Autora (Cliente)**: ${client}
- **Parte Ré / Oposta**: ${oppositeParty || 'A qualificar'}
- **Título do Caso**: ${caseTitle || 'Ação Processual'}
- **Fatos**: ${facts || 'Fatos gerais do descumprimento do direito do autor.'}
- **Tese Jurídica e Fundamentação**: ${legalThesis || 'Baseada em falha na prestação de serviço, enriquecimento ilícito e violação a normas vigentes.'}
- **Instruções Adicionais do Advogado**: ${customInstructions || 'Nenhuma.'}

Estrutura formal esperada:
1. Endereçamento e Qualificação das partes (se couber).
2. Dos Fatos (exposição narrativa clara).
3. Do Direito (fundamentação robusta, citação de artigos da CF, CPC/CLT/CPP/CC e jurisprudência dos Tribunais Superiores (STF/STJ/TST) aplicáveis ao tema).
4. Da Tutela de Urgência (se aplicável ao tipo de peça).
5. Dos Pedidos e Requerimentos (claros, específicos e numerados).
6. Fechamento formal padrão (Nestes termos, pede deferimento. Local, data. Advogado - OAB).

Gere apenas o texto formal e completo da petição, formatado em Markdown limpo, sem comentários adicionais fora da peça.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3, // Low temperature for high precision and legal formal consistency
      },
    });

    const content = response.text || '';
    res.json({ content });
  } catch (err: any) {
    console.error('Erro na chamada da API do Gemini (Draft):', err);
    res.status(500).json({ error: 'Falha ao processar a peça jurídica com a IA. Verifique se a sua chave de API está configurada nos Secrets.' });
  }
});

// 2. Jurisprudence Assistant (Pesquisa de Jurisprudência Superior)
app.post('/api/gemini/jurisprudence', async (req, res) => {
  const { query, tribunal } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Falta o termo de pesquisa jurisprudencial' });
  }

  const prompt = `Aja como um assistente de pesquisa jurídica de alta performance. Pesquise e retorne as bases jurisprudenciais atualizadas mais relevantes para o seguinte tema no direito brasileiro:
  
**Tema**: "${query}"
**Tribunal Preferencial**: ${tribunal || 'STF, STJ e TST'}

Retorne uma síntese contendo:
1. O entendimento dominante atualizado do tribunal indicado.
2. Exemplos de Súmulas aplicáveis (especificando o número e teor da súmula).
3. Precedentes Recentes (mencione recursos repetitivos, REs, AREs, REsps ou súmulas vinculantes relevantes com fundamentação).
4. Como utilizar essa tese na argumentação de uma petição de forma estratégica.

Formate o resultado em Markdown limpo com títulos organizados.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Você é um assistente de jurisprudência especializado nos tribunais superiores brasileiros (STF, STJ, TST, TSE). Forneça referências precisas e dicas de aplicação prática na peça processual.',
        temperature: 0.2,
      },
    });

    res.json({ result: response.text });
  } catch (err: any) {
    console.error('Erro na chamada da API do Gemini (Jurisprudence):', err);
    res.status(500).json({ error: 'Falha ao buscar jurisprudência na IA.' });
  }
});

// 3. Document Triage & Deadline Extractor (Triagem Inteligente de Diário Oficial)
app.post('/api/gemini/triage', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Falta o texto da publicação para triagem' });
  }

  const systemPrompt = `Você é um analista processual sênior especializado em triagem de publicações de Diários Oficiais e intimações no direito processual civil, trabalhista e penal brasileiro.
Sua tarefa é analisar o texto fornecido de forma minuciosa, extrair prazos urgentes de acordo com a legislação aplicável (como o Código de Processo Civil que conta prazos em dias úteis), estimar a data limite a partir de hoje e gerar uma ficha técnica de prazo formatada em JSON.`;

  const prompt = `Analise a seguinte publicação judicial e extraia as informações de prazo estruturadas:

--- TEXTO DA INTIMAÇÃO ---
${text}
-------------------------

Considerando que a data de disponibilização oficial foi informada no texto (ou assuma que é hoje, ${new Date().toISOString().split('T')[0]}, para cálculos de prazos), extraia os dados exatamente no formato JSON estruturado conforme o esquema requisitado.
Nota sobre prazos processuais no CPC (Lei 13.105/15): os prazos contam-se apenas em dias úteis, excluindo o dia do começo e incluindo o do vencimento. Faça uma estimativa realista da data limite.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Título curto e claro da providência requerida (ex: Réplica à Contestação, Recurso de Apelação, Pagamento de Custas)',
            },
            description: {
              type: Type.STRING,
              description: 'Explicação em linguagem simples do que deve ser feito e o resumo da decisão contida na intimação.',
            },
            dueDate: {
              type: Type.STRING,
              description: 'Data limite calculada no formato YYYY-MM-DD (estime somando os dias úteis a partir de hoje se não houver data explícita).',
            },
            urgency: {
              type: Type.STRING,
              description: 'Nível de urgência baseado no tempo restante ou importância da perda do prazo: Crítica, Alta, Média.',
            },
            responsible: {
              type: Type.STRING,
              description: 'Sugestão de advogado responsável ou área (ex: Dra. Amanda Medeiros, Equipe Civil, Equipe Trabalhista).',
            },
            legalBasis: {
              type: Type.STRING,
              description: 'A fundamentação legal ou artigo do código de processo aplicável para este tipo de prazo (ex: Art. 335 do CPC, Art. 1.003 § 5º do CPC).',
            },
            caseNumber: {
              type: Type.STRING,
              description: 'Número do processo se houver ou puder ser identificado no texto.',
            },
          },
          required: ['title', 'description', 'dueDate', 'urgency', 'responsible', 'legalBasis'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json(parsedData);
  } catch (err: any) {
    console.error('Erro na chamada da API do Gemini (Triage):', err);
    res.status(500).json({ error: 'Falha ao realizar a triagem inteligente de prazo.' });
  }
});

// 4. Automatic & Secure Email Responder (LGPD Compliance)
app.post('/api/emails/:id/reply', async (req, res) => {
  const { id } = req.params;
  const email = emails.find((e) => e.id === id);

  if (!email) {
    return res.status(404).json({ error: 'E-mail não encontrado' });
  }

  const systemPrompt = `Você é um DPO (Encarregado de Proteção de Dados) e Advogado Sênior focado em conformidade estrita com a LGPD e triagem inteligente para um escritório de advocacia multi-setorial completo (Civil, Trabalhista, Criminal/Penal, Família, Tributário, etc.).
Seu objetivo é:
1. Analisar se o e-mail contém dados pessoais sensíveis (CPF, RG, laudos de saúde, contracheques).
2. Escrever uma resposta extremamente profissional, segura e polida para o remetente, garantindo sigilo total, omitindo/mascarando dados sensíveis desnecessários na resposta, e orientando o cliente sobre canais de comunicação seguros.
3. Produzir um relatório de conformidade LGPD (LGPD Report) explicando os riscos e medidas preventivas.
4. Classificar o e-mail em um dos setores: 'Trabalhista', 'Penal', 'Família', 'Civil', 'Tributário', 'Geral'.
5. Se houver menção à marcação, agendamento ou intimação de audiência jurídica, defina hasHearing como true e extraia o título, descrição, data/hora estimada ou explícita em formato ISO 8601, tipo ('Virtual' ou 'Presencial') e o link/endereço correspondente.`;

  const prompt = `Analise o e-mail abaixo e elabore um rascunho de resposta seguro, um parecer de conformidade LGPD, e classifique o setor e dados de audiência.

Remetente: ${email.sender}
Assunto: ${email.subject}
Conteúdo:
"${email.body}"

A resposta deve:
- Confirmar o recebimento com tom de cordialidade e altíssimo profissionalismo.
- Fornecer orientações jurídicas seguras (se o e-mail expressa dúvidas).
- Omitir ou mascarar dados sensíveis como CPFs/RGs que foram enviados pelo cliente (ex: usar 123.***.***-00) para evitar mais riscos em trânsito de e-mail não criptografado.
- Instruir sobre envio de documentos via portal do cliente criptografado de forma segura.

Retorne no formato JSON conforme o esquema solicitado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyDraft: {
              type: Type.STRING,
              description: 'Texto formal completo do e-mail de resposta pronto para envio, contendo mascaramento de dados e regras de segurança.',
            },
            lgpdReport: {
              type: Type.STRING,
              description: 'Análise técnica da LGPD com riscos encontrados no e-mail recebido e recomendações de segurança da informação jurídica.',
            },
            destinedSector: {
              type: Type.STRING,
              description: 'Setor jurídico: Trabalhista, Penal, Família, Civil, Tributário, Geral',
            },
            hasHearing: {
              type: Type.BOOLEAN,
              description: 'Indica se há menção a agendamento, convocação ou intimação para audiência.',
            },
            hearingTitle: { type: Type.STRING },
            hearingDescription: { type: Type.STRING },
            hearingDateTime: { type: Type.STRING },
            hearingType: { type: Type.STRING },
            hearingLocationOrLink: { type: Type.STRING },
          },
          required: ['replyDraft', 'lgpdReport', 'destinedSector', 'hasHearing'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Update local email database state with suggested reply, report, sector and hearing
    const idx = emails.findIndex((e) => e.id === id);
    if (idx !== -1) {
      emails[idx].aiSuggestedReply = parsed.replyDraft;
      emails[idx].lgpdSensitive = parsed.lgpdSensitive !== undefined ? parsed.lgpdSensitive : true;
      emails[idx].lgpdReport = parsed.lgpdReport;
      emails[idx].destinedSector = parsed.destinedSector || 'Geral';
      emails[idx].hasHearing = parsed.hasHearing || false;
      if (parsed.hasHearing) {
        emails[idx].hearingDetails = {
          title: parsed.hearingTitle || 'Audiência Identificada',
          description: parsed.hearingDescription || 'Extraída automaticamente via IA de triagem.',
          dateTime: parsed.hearingDateTime || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          type: parsed.hearingType === 'Presencial' ? 'Presencial' : 'Virtual',
          locationOrLink: parsed.hearingLocationOrLink || 'Link ou local a definir',
        };
      }
      emails[idx].status = 'Lido';
    }

    res.json({
      ...parsed,
      hearingDetails: parsed.hasHearing ? {
        title: parsed.hearingTitle || 'Audiência Identificada',
        description: parsed.hearingDescription || 'Extraída automaticamente via IA de triagem.',
        dateTime: parsed.hearingDateTime || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        type: parsed.hearingType === 'Presencial' ? 'Presencial' : 'Virtual',
        locationOrLink: parsed.hearingLocationOrLink || 'Link ou local a definir',
      } : null
    });
  } catch (err: any) {
    console.error('Erro na chamada da API do Gemini (Email Reply):', err);
    res.status(500).json({ error: 'Falha ao processar e-mail sob conformidade LGPD.' });
  }
});

// ----------------------------------------------------
// VITE DEV SERVER / PRODUCTION SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JurisSábio Server] Running on http://localhost:${PORT}`);
  });
}

startServer();

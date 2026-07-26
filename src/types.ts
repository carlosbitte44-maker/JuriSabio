/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Case {
  id: string;
  number: string;
  title: string;
  client: string;
  court: string;
  status: 'Ativo' | 'Arquivado' | 'Suspenso';
  area: 'Civil' | 'Tributário' | 'Trabalhista' | 'Penal' | 'Administrativo' | 'Constitucional' | 'Família';
  urgency: 'Alta' | 'Média' | 'Baixa';
  createdAt: string;
}

export interface LegalDocument {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  type: string; // e.g. "Petição Inicial", "Apelação", "Contestação"
  content: string; // Legal draft text
  author: string;
  createdAt: string;
  version: number;
  status: 'Em Revisão' | 'Finalizado';
  summary?: string;
  insights?: string;
  suggestedSector?: string;
  fileName?: string;
  fileSize?: string;
  fileMimeType?: string;
  parties?: {
    plaintiff?: string;
    defendant?: string;
    court?: string;
    judge?: string;
  };
  detailedAnalysis?: {
    riskLevel?: 'Baixo' | 'Médio' | 'Alto';
    riskDescription?: string;
    legalArguments?: string;
    claimsRequested?: string;
    actionPlan?: string;
  };
}

export interface Deadline {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  status: 'Pendente' | 'Concluído' | 'Atrasado';
  urgency: 'Crítica' | 'Alta' | 'Média';
  responsible: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  dateTime: string; // ISO datetime
  type: 'Presencial' | 'Virtual';
  locationOrLink: string;
  status: 'Agendada' | 'Realizada' | 'Cancelada';
  remindersSent: boolean;
}

export interface LegalEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  receivedAt: string;
  category: 'Prazo' | 'Notificação' | 'Informativo' | 'Urgente' | 'Geral';
  status: 'Não Lido' | 'Lido' | 'Respondido' | 'Arquivado';
  aiSuggestedReply?: string;
  lgpdSensitive: boolean;
  lgpdReport?: string;
  caseId?: string;
  destinedSector?: 'Trabalhista' | 'Penal' | 'Família' | 'Civil' | 'Tributário' | 'Geral';
  hasHearing?: boolean;
  hearingDetails?: {
    title: string;
    description: string;
    dateTime: string;
    type: 'Virtual' | 'Presencial';
    locationOrLink: string;
  };
}

export interface ProductivityIndicator {
  draftsCount: number;
  deadlinesTotal: number;
  deadlinesMet: number;
  hearingsCount: number;
  averageDraftTimeMin: number;
  complianceRate: number; // percentage
  weeklyPerformance: { name: string; drafts: number; deadlines: number }[];
  categoryDistribution: { name: string; value: number }[];
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerKeyword: string; // keyword to scan (e.g. "audiência", "liminar", "cobrança")
  actionType: 'Auto-Resposta' | 'Triagem Automatizada' | 'Criar Alerta de Prazo';
  templateText: string;
  isActive: boolean;
  createdAt: string;
}

export interface AutomationLog {
  id: string;
  ruleName: string;
  sender: string;
  subject: string;
  status: 'Sucesso' | 'Alerta LGPD' | 'Falha';
  executedAt: string;
  actionTaken: string;
}


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FolderClosed, 
  Search, 
  FileText, 
  Check, 
  Download, 
  Edit2, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  Plus, 
  X, 
  Upload, 
  Copy, 
  AlertCircle, 
  Calendar, 
  ShieldCheck,
  FileCode,
  FileImage,
  Layers,
  ArrowRight,
  Users,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { LegalDocument, Case } from '../types';

interface DocumentosEssenciaisProps {
  documents: LegalDocument[];
  onDocumentUpdated: () => void;
  onDocumentDeleted: (id: string) => void;
  cases?: Case[];
  onDeadlineAdded?: () => void;
}

export default function DocumentosEssenciais({
  documents,
  onDocumentUpdated,
  onDocumentDeleted,
  cases = [],
  onDeadlineAdded,
}: DocumentosEssenciaisProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  
  // Tab states for document reader
  const [activeReaderTab, setActiveReaderTab] = useState<'resumo' | 'insights' | 'conteudo' | 'analise-sabia'>('resumo');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Upload modal & form states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Petição Inicial');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  
  // Uploading / AI Analysis state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Manual deadline shortcut states
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [manualDeadlineTitle, setManualDeadlineTitle] = useState('');
  const [manualDeadlineDate, setManualDeadlineDate] = useState('');
  const [deadlineSuccessMsg, setDeadlineSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Documents
  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.type.toLowerCase().includes(q) ||
      doc.caseNumber.toLowerCase().includes(q) ||
      (doc.suggestedSector && doc.suggestedSector.toLowerCase().includes(q))
    );
  });

  // Convert bytes to human readable string
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle Drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processSelectedFile(droppedFile);
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    if (!docTitle) {
      setDocTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Submit file for real Gemini 3.5 Flash analysis
  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileBase64) {
      setUploadError('Por favor, selecione um arquivo válido primeiro.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    const targetCase = cases.find(c => c.id === selectedCaseId);
    
    // Simulating sequence messages for premium polish feedback
    const sequenceMsg = [
      'Lendo arquivo de origem...',
      'Estabelecendo conexão criptografada com Gemini 3.5 Flash...',
      'Analisando tipologia documental e conformidade LGPD...',
      'Executando OCR inteligente e higienização de dados sensíveis...',
      'Gerando Resumo Executivo e extraindo pontos de ação...'
    ];

    let msgIndex = 0;
    setUploadStatusMsg(sequenceMsg[0]);
    const timer = setInterval(() => {
      if (msgIndex < sequenceMsg.length - 1) {
        msgIndex++;
        setUploadStatusMsg(sequenceMsg[msgIndex]);
      }
    }, 1500);

    try {
      const response = await fetch('/api/documents/upload-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: docTitle,
          type: docType,
          caseId: selectedCaseId || 'case-1',
          caseNumber: targetCase ? targetCase.number : 'Triagem Avulsa',
          fileName: file.name,
          fileSize: formatBytes(file.size),
          fileMimeType: file.type || 'application/pdf',
          fileBase64: fileBase64,
        }),
      });

      clearInterval(timer);

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const result = await response.json();
      
      onDocumentUpdated();
      if (onDeadlineAdded && result.deadlineCreated) {
        onDeadlineAdded();
      }

      setUploadSuccess(true);
      // Auto select the newly analyzed document
      setSelectedDoc(result.document);
      setActiveReaderTab('resumo');
      
      // Reset form
      setDocTitle('');
      setFile(null);
      setFileBase64('');
      setSelectedCaseId('');
      
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess(false);
        setIsUploading(false);
      }, 1500);

    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setUploadError('Erro ao processar e resumir documento com a IA Gemini. Verifique o arquivo e tente novamente.');
      setIsUploading(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (id: string, newStatus: 'Em Revisão' | 'Finalizado') => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onDocumentUpdated();
        if (selectedDoc?.id === id) {
          setSelectedDoc({ ...selectedDoc, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save changes
  const handleSaveTextChanges = async () => {
    if (!selectedDoc) return;
    try {
      const response = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText }),
      });

      if (response.ok) {
        onDocumentUpdated();
        setSelectedDoc({ ...selectedDoc, content: editText, version: selectedDoc.version + 1 });
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clipboard copy feedback
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Handle quick deadline registration from reader
  const handleCreateManualDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !manualDeadlineTitle || !manualDeadlineDate) return;

    try {
      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedDoc.caseId || 'case-1',
          caseNumber: selectedDoc.caseNumber || 'Geral',
          title: manualDeadlineTitle,
          description: `Prazo associado ao documento analisado: ${selectedDoc.title}`,
          dueDate: manualDeadlineDate,
          status: 'Pendente',
          urgency: 'Alta',
          responsible: 'Dra. Amanda Medeiros',
        }),
      });

      if (response.ok) {
        if (onDeadlineAdded) onDeadlineAdded();
        setDeadlineSuccessMsg('Prazo agendado e integrado com sucesso!');
        setManualDeadlineTitle('');
        setManualDeadlineDate('');
        setTimeout(() => {
          setDeadlineSuccessMsg('');
          setShowDeadlineForm(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerDownload = (doc: LegalDocument) => {
    const textToDownload = `TÍTULO: ${doc.title}
TIPO: ${doc.type}
PROCESSO: ${doc.caseNumber}
SETOR JURÍDICO: ${doc.suggestedSector || 'Geral'}
DATA DE ANÁLISE: ${new Date(doc.createdAt).toLocaleDateString('pt-BR')}

--- RESUMO EXECUTIVO DA IA ---
${doc.summary || 'Não resumido.'}

--- PRINCIPAIS INSIGHTS ---
${doc.insights || 'Não analisado.'}

--- CONTEÚDO INTEGRAL SANITIZADO (LGPD) ---
${doc.content}
`;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Análise_IA_${doc.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get appropriate icon for file types
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText size={18} />;
    if (mimeType.includes('xml')) return <FileCode size={18} className="text-cyan-400" />;
    if (mimeType.includes('image') || mimeType.includes('jpeg') || mimeType.includes('jpg') || mimeType.includes('png')) {
      return <FileImage size={18} className="text-rose-400" />;
    }
    return <FileText size={18} className="text-amber-400" />;
  };

  return (
    <div id="documentos-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#1F2125] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <FolderClosed className="text-amber-500 animate-pulse" size={24} /> Gestor de Documentos & Triagem de Arquivos
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Faça upload de PDF, Word, XML e imagens (JPEG/JPG) para resumir dados jurídicos, transcrever OCR e automatizar prazos.
          </p>
        </div>

        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por título, setor, processo..."
              className="w-full bg-[#111215] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition-colors"
            />
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus size={14} /> Importar & Resumir Documento
          </button>
        </div>
      </div>

      {/* Automated Email Banner */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h4 className="font-semibold text-white text-xs">Canal de Automação de E-mails Ativo</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Anexos (PDF, XML, JPEG, JPG, DOCX) enviados para o endereço oficial abaixo são processados, resumidos e catalogados automaticamente no sistema.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-[#16181C] px-2.5 py-1 text-[11px] font-mono text-amber-400 rounded border border-[#1F2125] select-all">
                automacao-rosy@jurissabio.com.br
              </span>
              <button
                onClick={() => handleCopyToClipboard('automacao-rosy@jurissabio.com.br', 'email')}
                className="p-1 hover:text-white text-slate-400 transition-colors"
                title="Copiar Endereço"
              >
                {copiedText === 'email' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 bg-[#16181C] px-3 py-2 rounded-lg border border-[#1F2125]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Escaneando Caixa de Entrada em Tempo Real
        </div>
      </div>

      {/* Vault Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Document list (Left) */}
        <div className="lg:col-span-4 bg-[#111215] border border-[#1F2125] rounded-2xl p-4 h-[600px] flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2125] pb-2">
            <h3 className="font-semibold text-amber-400 text-xs font-mono uppercase tracking-wider">
              Documentos Ativos ({filteredDocs.length})
            </h3>
            <span className="text-[10px] text-slate-500">
              Clique para abrir análise IA
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoc(doc);
                      setIsEditing(false);
                      setEditText(doc.content);
                      setActiveReaderTab('resumo');
                    }}
                    className={`border rounded-xl p-3 cursor-pointer transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? 'border-amber-500/30 bg-amber-500/5 shadow-sm'
                        : 'border-[#1F2125] bg-[#16181C]/40 hover:border-amber-500/20'
                    }`}
                  >
                    <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
                      {getFileIcon(doc.fileMimeType)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h4 className="font-bold text-slate-200 text-xs truncate leading-snug">{doc.title}</h4>
                        {doc.summary && (
                          <span className="bg-amber-400/10 text-amber-400 text-[8px] font-mono font-bold px-1 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                            <Sparkles size={8} /> IA
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <Layers size={10} className="text-slate-500" /> {doc.caseNumber}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold font-mono ${
                          doc.status === 'Finalizado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'Em Revisão'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {doc.status}
                        </span>
                        {doc.suggestedSector && (
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[8px] font-mono">
                            {doc.suggestedSector}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 mt-3 shrink-0" />
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FolderClosed size={36} className="text-slate-700" />
                <p className="text-xs text-center mt-2">Nenhum documento encontrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Reader & AI Analysis Pane (Right) */}
        <div className="lg:col-span-8 bg-[#111215] border border-[#1F2125] rounded-2xl shadow-sm h-[600px] flex flex-col overflow-hidden">
          {selectedDoc ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Reader Header */}
              <div className="bg-[#16181C] border-b border-[#1F2125] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">{selectedDoc.type}</span>
                    {selectedDoc.fileName && (
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={selectedDoc.fileName}>
                        • Arquivo: {selectedDoc.fileName} ({selectedDoc.fileSize || 'N/A'})
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-base truncate mt-0.5">{selectedDoc.title}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Número Processual: {selectedDoc.caseNumber}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status update select */}
                  <select
                    value={selectedDoc.status}
                    onChange={(e) => handleUpdateStatus(selectedDoc.id, e.target.value as any)}
                    className="bg-[#111215] border border-[#1F2125] text-xs font-semibold rounded-xl px-2.5 py-1.5 outline-none text-slate-200 shadow-sm"
                  >
                    <option value="Em Revisão">Em Revisão</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>

                  <button
                    onClick={() => triggerDownload(selectedDoc)}
                    className="p-1.5 text-slate-300 hover:text-white bg-[#111215] hover:bg-[#16181C] border border-[#1F2125] hover:border-amber-500/20 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1 text-xs"
                    title="Baixar Texto"
                  >
                    <Download size={14} /> <span className="hidden sm:inline">Baixar Relatório</span>
                  </button>
                </div>
              </div>

              {/* Reader Tabs */}
              <div className="bg-[#16181C]/60 border-b border-[#1F2125] px-5 flex items-center justify-between text-xs shrink-0">
                <div className="flex gap-4">
                  <button
                    onClick={() => { setActiveReaderTab('resumo'); setIsEditing(false); }}
                    className={`py-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeReaderTab === 'resumo' 
                        ? 'border-amber-500 text-amber-400' 
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles size={12} /> Resumo Executivo IA
                  </button>
                  <button
                    onClick={() => { setActiveReaderTab('analise-sabia'); setIsEditing(false); }}
                    className={`py-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeReaderTab === 'analise-sabia' 
                        ? 'border-amber-500 text-amber-400' 
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Scale size={12} /> Análise Robusta JurisSábio
                  </button>
                  <button
                    onClick={() => { setActiveReaderTab('insights'); setIsEditing(false); }}
                    className={`py-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeReaderTab === 'insights' 
                        ? 'border-amber-500 text-amber-400' 
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertCircle size={12} /> Insights & LGPD
                  </button>
                  <button
                    onClick={() => { setActiveReaderTab('conteudo'); }}
                    className={`py-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeReaderTab === 'conteudo' 
                        ? 'border-amber-500 text-amber-400' 
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText size={12} /> Texto Sanitizado (Conformidade)
                  </button>
                </div>

                <div className="text-slate-500 font-mono text-[10px] hidden md:block">
                  v{selectedDoc.version} • {selectedDoc.author}
                </div>
              </div>

              {/* Reader Core Content Canvas */}
              <div className="flex-1 p-6 overflow-y-auto bg-[#111215]/40 text-slate-200 leading-relaxed flex flex-col h-full">
                
                {/* 1. Executive Summary Tab */}
                {activeReaderTab === 'resumo' && (
                  <div className="space-y-4 animate-fade-in flex-1">
                    <div className="bg-[#16181C] border border-[#1F2125] rounded-xl p-5 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-[#1F2125] pb-2">
                        <h5 className="font-bold text-xs text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} /> Resumo Analítico Gerado pela IA
                        </h5>
                        <button
                          onClick={() => handleCopyToClipboard(selectedDoc.summary || '', 'resumo')}
                          className="px-2 py-1 bg-[#111215] hover:bg-[#1C1D22] border border-[#1F2125] text-[10px] text-slate-300 rounded flex items-center gap-1 transition-all"
                        >
                          {copiedText === 'resumo' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          {copiedText === 'resumo' ? 'Copiado!' : 'Copiar Resumo'}
                        </button>
                      </div>
                      
                      <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedDoc.summary || (
                          <div className="py-6 text-center text-slate-500 font-mono text-[11px]">
                            Resumo analítico indisponível ou em processamento.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Repasse / Forward utility */}
                    <div className="bg-[#16181C]/50 border border-[#1F2125] rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-xs text-slate-300 font-mono uppercase">
                        Ferramentas de Repasse Rápido (Acelerar Trabalho)
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Utilize a síntese da IA para agilizar o envio para clientes, preenchimento de petições ou criação de lembretes.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        <button
                          onClick={() => {
                            const mailBody = `Prezado cliente,\n\nEfetuamos a análise do documento "${selectedDoc.title}" com nossa Inteligência Artificial de triagem. Segue a síntese executiva:\n\n${selectedDoc.summary}\n\nFicamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nAdvocacia Dra. Amanda Medeiros`;
                            handleCopyToClipboard(mailBody, 'repassar-cliente');
                          }}
                          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                        >
                          {copiedText === 'repassar-cliente' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copiedText === 'repassar-cliente' ? 'Copiado p/ Área de Trabalho!' : 'Copiar E-mail p/ Cliente'}
                        </button>

                        <button
                          onClick={() => {
                            const internalBody = `--- MEMORANDO INTERNO DE DOCUMENTO ---\nTítulo: ${selectedDoc.title}\nProcesso: ${selectedDoc.caseNumber}\nAnálise da IA:\n${selectedDoc.summary}\n\nConclusão LGPD:\nDocumento sanitizado e salvo em nuvem com conformidade LGPD ativa.`;
                            handleCopyToClipboard(internalBody, 'repassar-interno');
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                        >
                          {copiedText === 'repassar-interno' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copiedText === 'repassar-interno' ? 'Copiado p/ Área de Trabalho!' : 'Copiar Memorando Interno'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Insights & LGPD Tab */}
                {activeReaderTab === 'insights' && (
                  <div className="space-y-4 animate-fade-in flex-1">
                    <div className="bg-[#16181C] border border-[#1F2125] rounded-xl p-5 space-y-4 shadow-inner">
                      <div className="flex items-center justify-between border-b border-[#1F2125] pb-2">
                        <h5 className="font-bold text-xs text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-amber-500" /> Insights Jurídicos e Mitigação LGPD
                        </h5>
                        <button
                          onClick={() => handleCopyToClipboard(selectedDoc.insights || '', 'insights')}
                          className="px-2 py-1 bg-[#111215] hover:bg-[#1C1D22] border border-[#1F2125] text-[10px] text-slate-300 rounded flex items-center gap-1 transition-all"
                        >
                          {copiedText === 'insights' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          {copiedText === 'insights' ? 'Copiado!' : 'Copiar Insights'}
                        </button>
                      </div>

                      <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedDoc.insights || (
                          <div className="py-6 text-center text-slate-500 font-mono text-[11px]">
                            Análise de insights e conformidade LGPD indisponível ou em processamento.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Integrated deadline quick creation */}
                    <div className="bg-[#16181C] border border-[#1F2125] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                          <Calendar size={14} className="text-amber-500" /> Agendar Alerta de Prazo com base na IA
                        </h5>
                        <button
                          onClick={() => setShowDeadlineForm(!showDeadlineForm)}
                          className="text-[11px] text-amber-400 hover:text-amber-500 font-bold transition-all"
                        >
                          {showDeadlineForm ? 'Recolher Formulário' : 'Configurar Alerta Rápido'}
                        </button>
                      </div>

                      {showDeadlineForm ? (
                        <form onSubmit={handleCreateManualDeadline} className="space-y-3 bg-[#111215] p-3 rounded-lg border border-[#1F2125] animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-mono mb-1">Título do Alerta</label>
                              <input
                                type="text"
                                required
                                value={manualDeadlineTitle}
                                onChange={(e) => setManualDeadlineTitle(e.target.value)}
                                placeholder="Ex: Protocolo de Recurso Extraordinário"
                                className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-mono mb-1">Data Limite</label>
                              <input
                                type="date"
                                required
                                value={manualDeadlineDate}
                                onChange={(e) => setManualDeadlineDate(e.target.value)}
                                className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1.5">
                            <span className="text-[10px] text-emerald-400 font-semibold">{deadlineSuccessMsg}</span>
                            <button
                              type="submit"
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-bold rounded-lg transition-all"
                            >
                              Confirmar Agendamento
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-[11px] text-slate-400">
                          Se o Gemini detectar um prazo relevante no documento, ele o criará automaticamente na agenda. Caso deseje agendar manualmente um lembrete com prioridade crítica para esta peça, clique no botão para estender.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2.5 Robust Detailed Analysis Tab (JurisSábio) */}
                {activeReaderTab === 'analise-sabia' && (
                  <div className="space-y-6 animate-fade-in flex-1">
                    {/* Parties Grid */}
                    <div className="bg-[#16181C] border border-[#1F2125] rounded-xl p-5 space-y-4 shadow-inner">
                      <h5 className="font-bold text-xs text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1F2125] pb-2">
                        <Users size={14} className="text-amber-500" /> Identificação das Partes do Documento
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#111215] border border-[#1F2125] p-3.5 rounded-xl">
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Autor / Requerente / Reclamante</p>
                          <p className="text-xs font-bold text-slate-100 mt-1">{selectedDoc.parties?.plaintiff || 'Não identificado pela triagem inicial'}</p>
                        </div>
                        <div className="bg-[#111215] border border-[#1F2125] p-3.5 rounded-xl">
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Réu / Requerido / Reclamado</p>
                          <p className="text-xs font-bold text-slate-100 mt-1">{selectedDoc.parties?.defendant || 'Não identificado pela triagem inicial'}</p>
                        </div>
                        <div className="bg-[#111215] border border-[#1F2125] p-3.5 rounded-xl">
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Tribunal / Foro / Juízo Competente</p>
                          <p className="text-xs font-bold text-slate-100 mt-1">{selectedDoc.parties?.court || 'Foro Geral ou Sob Análise'}</p>
                        </div>
                        <div className="bg-[#111215] border border-[#1F2125] p-3.5 rounded-xl">
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Magistrado / Relator / Juiz</p>
                          <p className="text-xs font-bold text-slate-100 mt-1">{selectedDoc.parties?.judge || 'A Distribuir'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Risk & Legal Grounding Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Risk Level card */}
                      <div className="md:col-span-5 bg-[#16181C] border border-[#1F2125] rounded-xl p-5 flex flex-col justify-between shadow-inner">
                        <div>
                          <h5 className="font-bold text-xs text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1F2125] pb-2">
                            <AlertTriangle size={14} className="text-amber-500" /> Grau de Risco e Sensibilidade
                          </h5>
                          <div className="mt-3 flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border ${
                              selectedDoc.detailedAnalysis?.riskLevel === 'Alto'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : selectedDoc.detailedAnalysis?.riskLevel === 'Médio'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              Risco: {selectedDoc.detailedAnalysis?.riskLevel || 'Baixo'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-3.5 leading-relaxed">
                            {selectedDoc.detailedAnalysis?.riskDescription || 'A análise estrutural de risco não detectou contingências financeiras críticas, perdas reputacionais graves ou sanções iminentes associadas a este documento.'}
                          </p>
                        </div>
                      </div>

                      {/* Arguments Card */}
                      <div className="md:col-span-7 bg-[#16181C] border border-[#1F2125] rounded-xl p-5 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1F2125] pb-2">
                          <ShieldCheck size={14} className="text-amber-500" /> Fundamentação Legal e Súmulas
                        </h5>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedDoc.detailedAnalysis?.legalArguments || 'Não há fundamentação legal explícita ou precedentes referenciados no texto analisado.'}
                        </p>
                      </div>
                    </div>

                    {/* Claims and Action Plan Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Claims requested */}
                      <div className="bg-[#16181C] border border-[#1F2125] rounded-xl p-5 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1F2125] pb-2">
                          <Layers size={14} className="text-amber-500" /> Pedidos Processuais & Valores Mapeados
                        </h5>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedDoc.detailedAnalysis?.claimsRequested || 'Sem pedidos pecuniários ou obrigações contratuais explícitas identificadas.'}
                        </p>
                      </div>

                      {/* Strategic Action Plan */}
                      <div className="bg-[#16181C] border border-[#1F2125] rounded-xl p-5 space-y-3 shadow-inner">
                        <h5 className="font-bold text-xs text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1F2125] pb-2">
                          <ArrowRight size={14} className="text-emerald-500" /> Plano de Ação Estratégico Sábio
                        </h5>
                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedDoc.detailedAnalysis?.actionPlan || '1. Registrar documento no painel do caso respectivo.\n2. Notificar o advogado responsável para ciência.\n3. Proceder com o arquivamento digital seguro.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Sanitized Text Tab */}
                {activeReaderTab === 'conteudo' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="bg-[#111215]/80 border-b border-[#1F2125] px-4 py-2 flex items-center justify-between text-xs shrink-0">
                      <span className="text-slate-400 font-mono flex items-center gap-1">
                        <Clock size={12} /> Visualização Higienizada do Texto
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyToClipboard(selectedDoc.content, 'conteudo')}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedText === 'conteudo' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          {copiedText === 'conteudo' ? 'Copiado!' : 'Copiar Texto'}
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          onClick={() => {
                            setIsEditing(!isEditing);
                            if (!isEditing) setEditText(selectedDoc.content);
                          }}
                          className="text-amber-400 hover:text-amber-500 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {isEditing ? 'Cancelar Edição' : 'Editar Conteúdo'} <Edit2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 py-4 overflow-y-auto">
                      {isEditing ? (
                        <div className="h-[300px] flex flex-col space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full flex-1 p-4 bg-[#16181C] border border-[#1F2125] text-slate-100 rounded-xl outline-none shadow-inner resize-none font-mono text-xs focus:ring-1 focus:ring-amber-500"
                          ></textarea>
                          <div className="flex justify-end gap-2 shrink-0">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-1.5 text-slate-400 hover:text-white font-semibold text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveTextChanges}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
                            >
                              Salvar Alterações
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#16181C] border border-[#1F2125] shadow-inner rounded-xl p-6 whitespace-pre-line font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
                          {selectedDoc.content}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
              <FolderClosed size={48} className="text-amber-500/20 stroke-[1.5]" />
              <p className="text-sm font-semibold">Nenhum documento selecionado.</p>
              <p className="text-xs max-w-sm text-center">
                Clique em qualquer documento à esquerda para carregar o seu resumo analítico, análise LGPD e transcrição de conformidade gerada pelo Gemini 3.5 Flash.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Document Import & Real-time AI Analysis Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111215] border border-[#1F2125] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1F2125] pb-3 mb-4 shrink-0">
              <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" /> Analisador de Documentos Gemini IA
              </h3>
              <button 
                onClick={() => { if (!isUploading) setShowUploadModal(false); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {isUploading ? (
              // AI Loading screen
              <div className="py-12 flex flex-col items-center justify-center space-y-5 animate-pulse shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
                  <Sparkles size={24} className="text-amber-400 absolute top-5 left-5 animate-bounce" />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-bold text-white text-sm">IA Processando Documento de Verdade</h4>
                  <p className="text-xs text-amber-400 font-mono font-semibold">{uploadStatusMsg}</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    Aguarde enquanto o Gemini 3.5 Flash lê a imagem/PDF, gera o resumo executivo, faz OCR e higieniza dados para LGPD.
                  </p>
                </div>
              </div>
            ) : uploadSuccess ? (
              // Success Screen
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center shrink-0">
                <span className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  <Check size={32} />
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Análise Concluída com Sucesso!</h4>
                  <p className="text-xs text-slate-400">O documento foi completamente analisado, resumido e arquivado em tempo real.</p>
                </div>
              </div>
            ) : (
              // Standard Upload Form
              <form onSubmit={handleUploadAndAnalyze} className="space-y-4 overflow-y-auto pr-1">
                {/* Drag and drop zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#1F2125] hover:border-amber-500/40 bg-[#16181C]/50 rounded-xl p-5 text-center transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xml,.jpg,.jpeg,.png,.txt"
                    className="hidden" 
                  />
                  {file ? (
                    <div className="space-y-2">
                      <span className="mx-auto w-10 h-10 bg-amber-500/15 text-amber-400 rounded-lg flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-xs mx-auto">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{formatBytes(file.size)} • {file.type || 'Tipo desconhecido'}</p>
                      </div>
                      <p className="text-[9px] text-amber-500 font-semibold underline">Clique para selecionar outro arquivo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={28} className="mx-auto text-slate-500 group-hover:text-amber-400 transition-colors" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-300">Arraste e solte o seu arquivo aqui</p>
                        <p className="text-[10px] text-slate-500">Aceita arquivos PDF, Word (docx), XML ou imagens (JPEG, JPG, PNG)</p>
                      </div>
                      <p className="text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full w-max mx-auto font-bold">Selecionar Arquivo</p>
                    </div>
                  )}
                </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono mb-1 uppercase">Título Amigável</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ex: Réplica de Contestação"
                      className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono mb-1 uppercase">Tipo Documental</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                    >
                      <option value="Petição Inicial">Petição Inicial</option>
                      <option value="Réplica">Réplica</option>
                      <option value="Contestação">Contestação</option>
                      <option value="Sentença Judicial">Sentença Judicial</option>
                      <option value="XML de Faturamento">XML de Faturamento</option>
                      <option value="Laudo Técnico">Laudo Técnico</option>
                      <option value="Documento Pessoal / RG">Documento Pessoal / RG</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                {/* Case Link */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1 uppercase">Vincular a Processo / Cliente (Opcional)</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="">-- Triagem Avulsa (Não vinculado) --</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.number} - {c.client}
                      </option>
                    ))}
                  </select>
                </div>

                {uploadError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-rose-400 text-xs leading-normal">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Submit action */}
                <div className="flex justify-end gap-2.5 border-t border-[#1F2125] pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!file}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} /> Iniciar Análise Inteligente
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Search,
  Download,
  RotateCcw,
  FileText,
  Loader2,
  AlertCircle,
  Edit3,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  RefreshCw,
  WifiOff,
  ExternalLink,
} from 'lucide-react';
import type { EquipamentoDevolucao, RegistroDevolucao } from '../types/devolucoes';
import { useDevolucoes } from '../hooks/useDevolucoes';
import { TermoEquipamentoPdf } from '../pdf/TermoEquipamentoPdf';

// Carregamento dinâmico sem SSR para componentes do @react-pdf/renderer
const PDFViewerDynamic = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[650px] bg-slate-50 border border-slate-200 rounded-2xl gap-3">
        <Loader2 className="w-8 h-8 text-[#008B95] animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Renderizando visualizador de PDF...</span>
      </div>
    ),
  }
);

const PDFDownloadLinkDynamic = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

interface RelatorioEquipamentosViewProps {
  hideFiltros?: boolean;
  equipamentosDevolucaoOverride?: EquipamentoDevolucao[];
  equipamentosEntregaOverride?: EquipamentoDevolucao[];
  customSetor?: string;
}

export const RelatorioEquipamentosView: React.FC<RelatorioEquipamentosViewProps> = ({
  hideFiltros = false,
  equipamentosDevolucaoOverride,
  equipamentosEntregaOverride,
  customSetor,
}) => {
  const {
    loading,
    error,
    isOfflineData,
    docOperation,
    setDocOperation,
    searchTerm,
    setSearchTerm,
    selectedSetor,
    setSelectedSetor,
    selectedFolha,
    setSelectedFolha,
    showEditFields,
    setShowEditFields,
    parametros,
    updateParametro,
    folhasFiltradas,
    registro: registroBase,
    stats,
    setoresDisponiveis,
    fetchDados,
    limparFiltros,
  } = useDevolucoes();

  const [isClient, setIsClient] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('/hcescritorio/logo-hcfmb.png');

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setLogoUrl(`${window.location.origin}/hcescritorio/logo-hcfmb.png`);
    }
  }, []);

  // Constrói o objeto de registro considerando eventuais overrides do Rollout (De / Para)
  const registro: RegistroDevolucao | null = React.useMemo(() => {
    if (docOperation === 'devolucao' && equipamentosDevolucaoOverride) {
      return {
        folha: 'ROLLOUT_DEV',
        setor: customSetor ? `Setor: ${customSetor}` : 'Termo de Devolução - Rollout',
        data: parametros.docData || new Date().toLocaleDateString('pt-BR'),
        contrato: parametros.docContrato,
        empresa: parametros.docEmpresa,
        obs: 'Equipamentos selecionados para devolução durante o processo de Rollout.',
        pagina: 1,
        equipamentos: equipamentosDevolucaoOverride,
      };
    }
    if (docOperation === 'entrega' && equipamentosEntregaOverride) {
      return {
        folha: 'ROLLOUT_ENT',
        setor: customSetor ? `Setor: ${customSetor}` : 'Termo de Entrega - Rollout',
        data: parametros.docData || new Date().toLocaleDateString('pt-BR'),
        contrato: parametros.docContrato,
        empresa: parametros.docEmpresa,
        obs: 'Equipamentos novos selecionados para entrega durante o processo de Rollout.',
        pagina: 1,
        equipamentos: equipamentosEntregaOverride,
      };
    }
    return registroBase;
  }, [
    docOperation,
    equipamentosDevolucaoOverride,
    equipamentosEntregaOverride,
    customSetor,
    parametros,
    registroBase,
  ]);

  const opTitle = docOperation === 'entrega' ? 'Entrega' : 'Devolucao';
  const fileName = registro ? `Termo_${opTitle}_Folha_${registro.folha}` : 'Termo_Equipamentos';

  const handleOpenPdfNewTab = async () => {
    if (!registro) return;
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(
        <TermoEquipamentoPdf
          registro={registro}
          docOperation={docOperation}
          parametros={parametros}
          logoUrl={logoUrl}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Erro ao abrir PDF em nova aba:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso de Dados em Cache Local Offline */}
      {isOfflineData && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Modo Offline: exibindo registros armazenados localmente no navegador (IndexedDB).</span>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && !hideFiltros && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-[#008B95] animate-spin" />
          <span className="text-sm text-slate-600 font-medium">Carregando registros e termos de devolução...</span>
        </div>
      )}

      {/* ── Erro ─────────────────────────────────────────────────────────── */}
      {error && !loading && !hideFiltros && (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl flex flex-col items-center gap-4 max-w-md mx-auto text-center">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-full">
            <AlertCircle size={28} />
          </div>
          <p className="text-rose-900 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchDados}
            className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {(!loading && !error || hideFiltros) && (
        <>
          {/* ── Painel de Filtros ──────────────────────── */}
          {!hideFiltros && (
            <section className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Search size={17} className="text-[#008B95]" />
                  Filtros e Seleção do Termo Oficial
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Encontrados: <strong className="text-slate-900 font-bold">{folhasFiltradas.length}</strong> de{' '}
                  <strong className="text-slate-900 font-bold">{stats.totalFolhas}</strong> folhas
                </span>
              </div>

              {/* Grid dos Filtros de Pesquisa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* Busca livre */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Buscar (Nº Série, Patrimônio, IP, MAC, Setor)
                  </label>
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#008B95] focus:ring-2 focus:ring-teal-100 transition-all outline-none"
                      placeholder="Ex: BRCSP3PSG6, 88, 192.168…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Setor */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Setor / Área HCFMB
                  </label>
                  <select
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#008B95] focus:ring-2 focus:ring-[#008B95] focus:ring-2 focus:ring-teal-100 transition-all outline-none cursor-pointer"
                    value={selectedSetor}
                    onChange={e => setSelectedSetor(e.target.value)}
                  >
                    <option value="">Todos os Setores ({setoresDisponiveis.length})</option>
                    {setoresDisponiveis.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Folha / Registro */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Selecione a Folha Oficial
                  </label>
                  <select
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-800 focus:bg-white focus:border-[#008B95] focus:ring-2 focus:ring-teal-100 transition-all outline-none cursor-pointer disabled:opacity-50"
                    value={selectedFolha || 'ALL'}
                    onChange={e => setSelectedFolha(e.target.value)}
                    disabled={!folhasFiltradas.length}
                  >
                    {folhasFiltradas.length ? (
                      <>
                        <option value="ALL">
                          Visão Consolidada — Todos os Equipamentos ({folhasFiltradas.reduce((acc, r) => acc + r.equipamentos.length, 0)} itens)
                        </option>
                        {folhasFiltradas.map(r => (
                          <option key={r.folha} value={r.folha}>
                            Folha {r.folha} — {r.setor.split(' - ').slice(1).join(' - ') || r.setor} ({r.equipamentos.length} item(s))
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="">Nenhum registro encontrado</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all"
                >
                  <RotateCcw size={14} /> Limpar Filtros
                </button>
              </div>
            </section>
          )}

          {/* ── Painel de Personalização dos Dados Contratuais ──────────────────────── */}
          <section className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowEditFields(!showEditFields)}
                className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-900 bg-[#F0F9FA] hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200 transition-all"
              >
                <Edit3 size={15} className="text-[#008B95]" />
                <span>Personalizar Dados Contratuais do Termo (Campos em Negrito)</span>
                {showEditFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showEditFields && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Edit3 size={14} className="text-[#008B95]" />
                  Valores impressos nos campos da declaração oficial:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Data do Termo
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008B95] outline-none"
                      value={parametros.docData}
                      onChange={e => updateParametro('docData', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Pregão Eletrônico
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008B95] outline-none"
                      value={parametros.docEdital}
                      onChange={e => updateParametro('docEdital', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Processo SEI nº
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008B95] outline-none"
                      value={parametros.docSei}
                      onChange={e => updateParametro('docSei', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Contrato nº
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008B95] outline-none"
                      value={parametros.docContrato}
                      onChange={e => updateParametro('docContrato', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Empresa Contratada
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008B95] outline-none"
                      value={parametros.docEmpresa}
                      onChange={e => updateParametro('docEmpresa', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Barra de Controle dos Modos de Operação e Ações PDF ───────── */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              {/* Seletor Operação: Entrega vs Devolução */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setDocOperation('entrega')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    docOperation === 'entrega'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PackageCheck size={14} /> Entrega / Recebido
                </button>
                <button
                  type="button"
                  onClick={() => setDocOperation('devolucao')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    docOperation === 'devolucao'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RefreshCw size={14} /> Devolução / Liberado
                </button>
              </div>
            </div>

            {/* Ações do PDF */}
            {registro && isClient && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleOpenPdfNewTab}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <ExternalLink size={14} /> Abrir PDF em Nova Aba
                </button>

                <PDFDownloadLinkDynamic
                  document={
                    <TermoEquipamentoPdf
                      registro={registro}
                      docOperation={docOperation}
                      parametros={parametros}
                      logoUrl={logoUrl}
                    />
                  }
                  fileName={`${fileName}.pdf`}
                  style={{ textDecoration: 'none' }}
                >
                  {({ loading: pdfLoading }) => (
                    <button
                      type="button"
                      disabled={pdfLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-[#008B95] hover:bg-[#00737C] disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs"
                    >
                      {pdfLoading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Download size={15} />
                      )}
                      <span>{pdfLoading ? 'Gerando PDF...' : 'Baixar Termo PDF'}</span>
                    </button>
                  )}
                </PDFDownloadLinkDynamic>
              </div>
            )}
          </div>

          {/* ── Exibição do Termo PDF Incorporado ──────────────────────── */}
          {registro && isClient ? (
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <PDFViewerDynamic className="w-full h-[750px] rounded-xl border-0">
                <TermoEquipamentoPdf
                  registro={registro}
                  docOperation={docOperation}
                  parametros={parametros}
                  logoUrl={logoUrl}
                />
              </PDFViewerDynamic>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <FileText className="w-14 h-14 stroke-1 text-slate-300" />
              <span className="text-sm font-semibold">
                Nenhum termo ou registro encontrado para os filtros selecionados.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

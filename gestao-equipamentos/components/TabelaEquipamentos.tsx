import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  Edit3,
  Trash2,
  Calendar,
  User,
  Laptop,
  X,
  Check,
  Tag,
  Wifi,
  Cpu
} from 'lucide-react';
import type { Equipamento, EquipamentoUpdatePayload } from '../types/equipamento';
import { SetorAutocomplete } from './SetorAutocomplete';

interface TabelaEquipamentosProps {
  dados: Equipamento[];
  hasConsulted: boolean;
  loading: boolean;
  loadingExport: boolean;
  error: string | null;
  tecnicos: string[];
  onSelectEquipamento?: (item: Equipamento) => void;
  onExportarExcel: () => void;
  onEditarEquipamento?: (cd_registro: number, payload: EquipamentoUpdatePayload) => Promise<any>;
  onExcluirEquipamento?: (cd_registro: number) => Promise<any>;
  onRefresh?: () => void;
}

type SortField =
  | 'cd_patrimonio'
  | 'dc_setor'
  | 'local_especifico'
  | 'cd_serie'
  | 'cd_macaddr'
  | 'nr_ip'
  | 'nm_hostname'
  | 'tipo_maquina'
  | 'registrado_por_id'
  | 'registrado_em'
  | 'cd_registro';

export const TabelaEquipamentos: React.FC<TabelaEquipamentosProps> = ({
  dados,
  hasConsulted,
  loading,
  loadingExport,
  error,
  tecnicos,
  onSelectEquipamento,
  onExportarExcel,
  onEditarEquipamento,
  onExcluirEquipamento,
  onRefresh
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('cd_registro');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Estado para Widget de Edição Interna
  const [editingItem, setEditingItem] = useState<Equipamento | null>(null);
  const [editForm, setEditForm] = useState<EquipamentoUpdatePayload>({});
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Estado para Exclusão
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Reseta página quando mudam os dados ou termo de busca
  useEffect(() => {
    setCurrentPage(1);
  }, [dados, searchTerm]);

  // Filtragem local rápida (busca textual completa)
  const filteredData = useMemo(() => {
    let result = dados;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((item) =>
        (item.cd_patrimonio && item.cd_patrimonio.toLowerCase().includes(term)) ||
        (item.dc_setor && item.dc_setor.toLowerCase().includes(term)) ||
        (item.local_especifico && item.local_especifico.toLowerCase().includes(term)) ||
        (item.cd_serie && item.cd_serie.toLowerCase().includes(term)) ||
        (item.cd_macaddr && item.cd_macaddr.toLowerCase().includes(term)) ||
        (item.nr_ip && item.nr_ip.toLowerCase().includes(term)) ||
        (item.nm_hostname && item.nm_hostname.toLowerCase().includes(term)) ||
        (item.registrado_por_id && item.registrado_por_id.toLowerCase().includes(term)) ||
        (item.observacao && item.observacao.toLowerCase().includes(term))
      );
    }

    return result;
  }, [dados, searchTerm]);

  // Ordenação
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'registrado_em') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB || '') : (valB || '').localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [filteredData, sortField, sortAsc]);

  // Paginação
  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortAsc ? <ChevronUp size={13} className="text-[#008B95]" /> : <ChevronDown size={13} className="text-[#008B95]" />;
  };

  // Abrir widget de edição local
  const handleOpenEditWidget = (item: Equipamento) => {
    setEditingItem(item);
    setEditForm({
      cd_patrimonio: item.cd_patrimonio,
      cd_setor: item.cd_setor,
      local_especifico: item.local_especifico || '',
      tipo_maquina: item.tipo_maquina,
      observacao: item.observacao || '',
      nr_ip: item.nr_ip || '',
      nm_hostname: item.nm_hostname || '',
      cd_serie: item.cd_serie || '',
      cd_macaddr: item.cd_macaddr || ''
    });
  };

  // Salvar alterações via widget
  const handleSaveEditWidget = async () => {
    if (!editingItem || !onEditarEquipamento) return;
    setIsSavingEdit(true);
    try {
      await onEditarEquipamento(editingItem.cd_registro, editForm);
      setEditingItem(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar alterações do equipamento.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Executar Exclusão
  const handleConfirmDelete = async (cd_registro: number) => {
    if (!onExcluirEquipamento) return;
    setIsDeleting(true);
    try {
      await onExcluirEquipamento(cd_registro);
      setConfirmDeleteId(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir equipamento.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasConsulted) {
    return (
      <div className="glass-card py-16 flex flex-col items-center justify-center gap-4 text-center border border-brand-border bg-white shadow-card rounded-xl">
        <div className="w-14 h-14 bg-[#F0F9FA] rounded-2xl flex items-center justify-center text-[#008B95]">
          <HardDrive size={32} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Pronto para Consultar</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Defina os filtros desejados acima e clique no botão <strong>Consultar</strong> para carregar a lista de equipamentos cadastrados.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 flex items-center gap-4 border border-rose-200 bg-rose-50/70 shadow-sm rounded-xl">
        <AlertTriangle size={28} className="text-rose-600 shrink-0" />
        <div>
          <p className="font-bold text-rose-900 text-sm">Erro na consulta de equipamentos</p>
          <p className="text-xs text-rose-700 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  const totalRegistros = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRegistros / pageSize));
  const startRecord = totalRegistros > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalRegistros);

  return (
    <div className="glass-card overflow-hidden border border-brand-border shadow-card bg-white rounded-xl relative">
      {/* Toolbar / Barra Superior Integrada */}
      <div className="p-3 bg-slate-50/80 border-b border-brand-border flex flex-wrap items-center gap-3">
        {/* Pesquisa Rápida */}
        <div className="relative min-w-[220px] max-w-[280px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por Patrimônio, Série, MAC, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#008B95] transition-colors text-slate-800 shadow-2xs"
          />
        </div>

        {/* Separador */}
        <div className="w-px h-5 bg-slate-200 shrink-0" />

        {/* Contagem + Paginação compacta */}
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs shrink-0">
            <span className="text-slate-500">Exibindo</span>
            <span className="font-bold text-slate-800">
              {totalRegistros > 0 ? `${startRecord}–${endRecord}` : '0'}
            </span>
            <span className="text-slate-500">de</span>
            <span className="font-bold text-[#008B95]">{totalRegistros}</span>
          </div>

          {/* Navegação de páginas */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="flex items-center justify-center w-6 h-6 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-[#008B95] hover:text-[#008B95] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={13} />
            </button>

            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs shadow-2xs">
              <span className="font-bold text-slate-800">{currentPage}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-slate-500">{totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || loading}
              className="flex items-center justify-center w-6 h-6 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-[#008B95] hover:text-[#008B95] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Lado Direito: Botão Exportar Excel */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={onExportarExcel}
            disabled={loadingExport || loading || totalRegistros === 0}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Exportar todos os registros filtrados para Excel"
          >
            {loadingExport ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={13} />
            )}
            <span>{loadingExport ? 'Gerando...' : 'Exportar Excel'}</span>
          </button>
        </div>
      </div>

      {/* Tabela de Equipamentos */}
      <div className="overflow-x-auto relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-card border border-slate-200 text-xs font-semibold text-[#008B95]">
              <Loader2 size={16} className="animate-spin" />
              <span>Carregando dados dos equipamentos...</span>
            </div>
          </div>
        )}

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold select-none text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('cd_patrimonio')}
                className="px-2.5 py-2 cursor-pointer hover:bg-slate-200/70 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Patrimônio</span>
                  {renderSortIcon('cd_patrimonio')}
                </div>
              </th>

              <th
                onClick={() => handleSort('dc_setor')}
                className="px-2.5 py-2 cursor-pointer hover:bg-slate-200/70 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Setor</span>
                  {renderSortIcon('dc_setor')}
                </div>
              </th>

              <th
                onClick={() => handleSort('local_especifico')}
                className="px-2.5 py-2 cursor-pointer hover:bg-slate-200/70 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Local Específico</span>
                  {renderSortIcon('local_especifico')}
                </div>
              </th>

              <th
                onClick={() => handleSort('cd_serie')}
                className="px-2.5 py-2 cursor-pointer hover:bg-slate-200/70 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Nº Série</span>
                  {renderSortIcon('cd_serie')}
                </div>
              </th>

              <th className="px-2.5 py-2">IP</th>
              <th className="px-2.5 py-2">Hostname</th>

              <th
                onClick={() => handleSort('tipo_maquina')}
                className="px-2.5 py-2 cursor-pointer hover:bg-slate-200/70 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Tipo</span>
                  {renderSortIcon('tipo_maquina')}
                </div>
              </th>

              <th
                onClick={() => handleSort('registrado_por_id')}
                className="px-2.5 py-2 cursor-pointer hover:bg-slate-200/70 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Técnico</span>
                  {renderSortIcon('registrado_por_id')}
                </div>
              </th>

              <th
                onClick={() => handleSort('registrado_em')}
                className="px-2.5 py-2 cursor-pointer hover:bg-slate-200/70 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Data</span>
                  {renderSortIcon('registrado_em')}
                </div>
              </th>

              <th className="px-2.5 py-2">Obs</th>

              <th className="px-2 py-2 text-center sticky right-0 bg-slate-100 border-l border-slate-200 shadow-2xs z-10">Ação</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-400 font-medium">
                  <Laptop className="w-10 h-10 mx-auto text-slate-300 stroke-1 mb-2" />
                  Nenhum equipamento encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.cd_registro}
                  className="hover:bg-slate-50/80 transition-colors group text-[11px]"
                >
                  <td className="px-2.5 py-2 font-mono font-bold text-[#008B95]">
                    {item.cd_patrimonio}
                  </td>

                  <td className="px-2.5 py-2 font-medium text-slate-800 max-w-[180px] truncate" title={item.dc_setor || item.cd_setor}>
                    {item.dc_setor || item.cd_setor}
                  </td>

                  <td className="px-2.5 py-2 text-slate-600 max-w-[120px] truncate" title={item.local_especifico || ''}>
                    {item.local_especifico || '-'}
                  </td>

                  {/* Novo Campo: CD_SERIE */}
                  <td className="px-2.5 py-2 font-mono text-slate-700">
                    {item.cd_serie ? (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-medium border border-slate-200">
                        {item.cd_serie}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-2.5 py-2 font-mono text-slate-700">
                    {item.nr_ip ? (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold border border-slate-200">
                        {item.nr_ip}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-2.5 py-2 font-mono text-slate-700 max-w-[100px] truncate" title={item.nm_hostname || ''}>
                    {item.nm_hostname ? (
                      <span className="bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded font-semibold border border-teal-200">
                        {item.nm_hostname}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-2.5 py-2 text-center">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                        item.tipo_maquina === 'SLIM'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {item.tipo_maquina}
                    </span>
                  </td>

                  <td className="px-2.5 py-2 text-slate-700">
                    <div className="flex items-center gap-1">
                      <User size={11} className="text-slate-400" />
                      <span className="font-medium">{item.registrado_por_id || '-'}</span>
                    </div>
                  </td>

                  <td className="px-2.5 py-2 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-[10px]">
                      <Calendar size={11} className="text-slate-400" />
                      <span>
                        {item.registrado_em
                          ? new Date(item.registrado_em).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </span>
                    </div>
                  </td>

                  <td className="px-2.5 py-2 text-slate-500 max-w-[120px] truncate" title={item.observacao || ''}>
                    {item.observacao ? `"${item.observacao}"` : '-'}
                  </td>

                  {/* Coluna de Ações Fixada no Canto Direito (Sticky Right) */}
                  <td className="px-2 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditarEquipamento) {
                            handleOpenEditWidget(item);
                          } else if (onSelectEquipamento) {
                            onSelectEquipamento(item);
                          }
                        }}
                        className="p-1 rounded-lg bg-teal-50 text-[#008B95] hover:bg-[#008B95] hover:text-white transition-colors cursor-pointer"
                        title="Editar equipamento"
                      >
                        <Edit3 size={12} />
                      </button>

                      {onExcluirEquipamento && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(item.cd_registro);
                          }}
                          className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          title="Excluir equipamento"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé com Paginação */}
      {totalRegistros > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 font-medium">
          <span>
            Exibindo{' '}
            <strong className="text-slate-800 font-bold">
              {totalRegistros > 0 ? `${startRecord}–${endRecord}` : 0}
            </strong>{' '}
            de <strong className="text-slate-800 font-bold">{totalRegistros}</strong> registros
          </span>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-[#008B95] cursor-pointer text-slate-800 shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-[#008B95] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>

              <span>
                Página <strong className="text-slate-800 font-bold">{currentPage}</strong> de{' '}
                <strong className="text-slate-800 font-bold">{totalPages}</strong>
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-[#008B95] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WIDGET MODAL / DRAWER MODERNO DE EDIÇÃO RÁPIDA DE DADOS DA COLUNA         */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-slide-in">
            {/* Header do Widget */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-[#004B50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#008B95]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Edição Rápida — Patrimônio #{editingItem.cd_patrimonio}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo do Formulário do Widget */}
            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Patrimônio */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#008B95]" /> Patrimônio
                  </label>
                  <input
                    type="text"
                    value={editForm.cd_patrimonio || ''}
                    onChange={(e) => setEditForm({ ...editForm, cd_patrimonio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#008B95] font-mono font-semibold"
                  />
                </div>

                {/* Tipo de Máquina */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#008B95]" /> Tipo de Máquina
                  </label>
                  <select
                    value={editForm.tipo_maquina || 'SLIM'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        tipo_maquina: e.target.value as 'SLIM' | 'MASTER'
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#008B95] bg-white font-semibold"
                  >
                    <option value="SLIM">SLIM</option>
                    <option value="MASTER">MASTER</option>
                  </select>
                </div>
              </div>

              {/* Setor */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Setor Responsável</label>
                <SetorAutocomplete
                  value={editForm.cd_setor || ''}
                  onChange={(val) => setEditForm({ ...editForm, cd_setor: val })}
                />
              </div>

              {/* Local Específico */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Local Específico</label>
                <input
                  type="text"
                  placeholder="Ex: Sala de Reunião, Balcão de Atendimento..."
                  value={editForm.local_especifico || ''}
                  onChange={(e) => setEditForm({ ...editForm, local_especifico: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#008B95]"
                />
              </div>

              {/* Dados de Rede (Série, MAC, IP, Hostname) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#008B95]" /> Parâmetros de Rede e Identificação
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nº de Série (cd_serie)</label>
                    <input
                      type="text"
                      placeholder="Ex: CNU123456"
                      value={editForm.cd_serie || ''}
                      onChange={(e) => setEditForm({ ...editForm, cd_serie: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#008B95] font-mono text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Endereço MAC (cd_macaddr)</label>
                    <input
                      type="text"
                      placeholder="Ex: 00:1A:2B:3C:4D:5E"
                      value={editForm.cd_macaddr || ''}
                      onChange={(e) => setEditForm({ ...editForm, cd_macaddr: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#008B95] font-mono text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Endereço IP (nr_ip)</label>
                    <input
                      type="text"
                      placeholder="Ex: 10.15.20.100"
                      value={editForm.nr_ip || ''}
                      onChange={(e) => setEditForm({ ...editForm, nr_ip: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#008B95] font-mono text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hostname (nm_hostname)</label>
                    <input
                      type="text"
                      placeholder="Ex: HC-DESK-01"
                      value={editForm.nm_hostname || ''}
                      onChange={(e) => setEditForm({ ...editForm, nm_hostname: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#008B95] font-mono text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Anotações ou observações adicionais..."
                  value={editForm.observacao || ''}
                  onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#008B95]"
                />
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditWidget}
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#008B95] hover:bg-[#00767e] rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE DADOS DO EQUIPAMENTO                   */}
      {/* ========================================================================= */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs space-y-4 border border-slate-200 text-center animate-slide-in">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Excluir este equipamento?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação removerá o patrimônio da base de dados e não poderá ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(confirmDeleteId)}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

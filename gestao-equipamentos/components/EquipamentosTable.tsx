import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Laptop, 
  Calendar,
  User,
  X,
  Check
} from 'lucide-react';
import type { Equipamento, EquipamentoUpdatePayload } from '../types/equipamento';
import { SetorAutocomplete } from './SetorAutocomplete';

interface EquipamentosTableProps {
  equipamentos: Equipamento[];
  total: number;
  loading: boolean;
  skip: number;
  limit: number;
  onPageChange: (newSkip: number) => void;
  filtroPatrimonio: string;
  setFiltroPatrimonio: (val: string) => void;
  filtroSetor: string;
  setFiltroSetor: (val: string) => void;
  filtroTipo: string;
  setFiltroTipo: (val: string) => void;
  onEditar: (cd_registro: number, payload: EquipamentoUpdatePayload) => Promise<any>;
  onExcluir: (cd_registro: number) => Promise<any>;
  onRefresh: () => void;
}

export const EquipamentosTable: React.FC<EquipamentosTableProps> = ({
  equipamentos,
  total,
  loading,
  skip,
  limit,
  onPageChange,
  filtroPatrimonio,
  setFiltroPatrimonio,
  filtroSetor,
  setFiltroSetor,
  filtroTipo,
  setFiltroTipo,
  onEditar,
  onExcluir,
  onRefresh
}) => {
  // Estado de modal de edição
  const [editingItem, setEditingItem] = useState<Equipamento | null>(null);
  const [editForm, setEditForm] = useState<EquipamentoUpdatePayload>({});
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Estado de exclusão
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(skip / limit) + 1;

  const handleOpenEdit = (item: Equipamento) => {
    setEditingItem(item);
    setEditForm({
      cd_patrimonio: item.cd_patrimonio,
      cd_setor: item.cd_setor,
      local_especifico: item.local_especifico || '',
      tipo_maquina: item.tipo_maquina,
      observacao: item.observacao || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      await onEditar(editingItem.cd_registro, editForm);
      setEditingItem(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async (cd_registro: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento?')) return;
    setDeletingId(cd_registro);
    try {
      await onExcluir(cd_registro);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir equipamento.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header com Filtros e Atualizar */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-[#008B95]" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Equipamentos Cadastrados ({total})
            </h3>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#008B95] bg-slate-50 hover:bg-[#F0F9FA] rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Busca Patrimônio */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Patrimônio..."
              value={filtroPatrimonio}
              onChange={(e) => setFiltroPatrimonio(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:border-[#008B95] outline-none"
            />
          </div>

          {/* Busca Setor */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por Setor..."
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:border-[#008B95] outline-none"
            />
          </div>

          {/* Filtro Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#008B95] outline-none bg-white"
          >
            <option value="">Todos os Tipos</option>
            <option value="SLIM">SLIM</option>
            <option value="MASTER">MASTER</option>
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto min-h-[250px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-xs gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#008B95]" />
            <span>Carregando lista de equipamentos...</span>
          </div>
        ) : equipamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs space-y-1">
            <Laptop className="w-8 h-8 text-slate-300 stroke-1" />
            <p className="font-semibold">Nenhum equipamento encontrado.</p>
            <p>Utilize o formulário ao lado para realizar novos registros.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Patrimônio</th>
                <th className="py-3 px-4">Setor / Local</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4">Hostname</th>
                <th className="py-3 px-4">Registrado por</th>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipamentos.map((item) => (
                <tr key={item.cd_registro} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800 font-mono text-sm">
                    {item.cd_patrimonio}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-700">{item.dc_setor}</div>
                    {item.local_especifico && (
                      <div className="text-[11px] text-slate-400">{item.local_especifico}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.tipo_maquina === 'SLIM'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {item.tipo_maquina}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {item.nr_ip ? (
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold border border-slate-200">
                        {item.nr_ip}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {item.nm_hostname ? (
                      <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-semibold border border-teal-200">
                        {item.nm_hostname}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{item.registrado_por_id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {item.registrado_em
                          ? new Date(item.registrado_em).toLocaleString('pt-BR')
                          : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-[#008B95] hover:bg-[#F0F9FA] rounded-md transition-colors"
                        title="Editar Equipamento"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(item.cd_registro)}
                        disabled={deletingId === item.cd_registro}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                        title="Excluir Equipamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Página {currentPage} de {totalPages} ({total} itens)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(0, skip - limit))}
            disabled={skip === 0 || loading}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(skip + limit)}
            disabled={skip + limit >= total || loading}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Editar Equipamento #{editingItem.cd_registro}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código do Patrimônio</label>
                <input
                  type="text"
                  value={editForm.cd_patrimonio || ''}
                  onChange={(e) => setEditForm({ ...editForm, cd_patrimonio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#008B95]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Setor</label>
                <SetorAutocomplete
                  value={editForm.cd_setor || ''}
                  onChange={(val) => setEditForm({ ...editForm, cd_setor: val })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Local Específico</label>
                <input
                  type="text"
                  value={editForm.local_especifico || ''}
                  onChange={(e) => setEditForm({ ...editForm, local_especifico: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#008B95]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Máquina</label>
                <select
                  value={editForm.tipo_maquina || 'SLIM'}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      tipo_maquina: e.target.value as 'SLIM' | 'MASTER'
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#008B95] bg-white"
                >
                  <option value="SLIM">SLIM</option>
                  <option value="MASTER">MASTER</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={editForm.observacao || ''}
                  onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#008B95]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-[#008B95] hover:bg-[#00767e] rounded-lg shadow-sm disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

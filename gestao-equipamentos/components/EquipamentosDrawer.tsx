import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import type { Equipamento, EquipamentoUpdatePayload } from '../types/equipamento';

interface EquipamentosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  equipamentos: Equipamento[];
  total: number;
  loading: boolean;
  skip: number;
  limit: number;
  onPageChange: (newSkip: number) => void;
  filtroPatrimonio: string;
  setFiltroPatrimonio: (val: string) => void;
  onEditar: (item: Equipamento) => void;
  onExcluir: (cd_registro: number) => Promise<any>;
  onRefresh: () => void;
}

export const EquipamentosDrawer: React.FC<EquipamentosDrawerProps> = ({
  isOpen,
  onClose,
  equipamentos,
  total,
  loading,
  skip,
  limit,
  onPageChange,
  filtroPatrimonio,
  setFiltroPatrimonio,
  onEditar,
  onExcluir,
  onRefresh
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(skip / limit) + 1;

  if (!isOpen || !mounted) return null;

  const handleDeleteConfirm = async (cd_registro: number) => {
    setDeletingId(cd_registro);
    try {
      await onExcluir(cd_registro);
      setConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir equipamento.');
    } finally {
      setDeletingId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[#008B95]" />
              <h3 className="font-bold text-slate-800 text-sm">Equipamentos Registrados</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {total} {total === 1 ? 'registro encontrado' : 'registros encontrados'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Atualizar lista"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#008B95] hover:bg-[#F0F9FA] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar equipamentos..."
              value={filtroPatrimonio}
              onChange={(e) => setFiltroPatrimonio(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008B95] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#008B95]" />
              <span>Carregando equipamentos...</span>
            </div>
          ) : equipamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2 text-center px-4">
              <Laptop className="w-10 h-10 text-slate-300 stroke-1" />
              <p className="font-semibold text-slate-600">Nenhum equipamento encontrado</p>
              <p className="text-slate-400">Tente ajustar os filtros ou cadastrar um novo equipamento.</p>
            </div>
          ) : (
            equipamentos.map((item) => (
              <div
                key={item.cd_registro}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {item.cd_patrimonio}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.tipo_maquina === 'SLIM'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {item.tipo_maquina}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-700 truncate">
                    {item.dc_setor}
                    {item.local_especifico ? ` · ${item.local_especifico}` : ''}
                  </p>

                  {item.observacao && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      "{item.observacao}"
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{item.registrado_por_id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {item.registrado_em
                          ? new Date(item.registrado_em).toLocaleDateString('pt-BR')
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="relative flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onEditar(item);
                      onClose();
                    }}
                    className="p-1.5 text-slate-400 hover:text-[#008B95] hover:bg-[#F0F9FA] rounded-lg transition-colors"
                    title="Editar equipamento"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(item.cd_registro)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir equipamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer com Paginação */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Pág {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(0, skip - limit))}
              disabled={skip === 0 || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(skip + limit)}
              disabled={skip + limit >= total || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmId && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs space-y-4 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-slate-800 text-sm">Excluir este registro?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação excluirá o patrimônio da base de dados e não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteConfirm(confirmId)}
                disabled={deletingId === confirmId}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {deletingId === confirmId ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

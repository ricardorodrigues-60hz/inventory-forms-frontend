import React, { useRef } from 'react';
import { Search, Loader2, Filter, ChevronDown, RotateCcw, User, Laptop, Calendar } from 'lucide-react';
import { SetorAutocomplete } from './SetorAutocomplete';
import { CampoData } from '../../../components/CampoData';
import type { FiltrosEquipamentosValues } from '../types/equipamento';

interface FiltrosEquipamentosProps {
  filtros: FiltrosEquipamentosValues;
  onChange: (filtros: FiltrosEquipamentosValues) => void;
  onConsultar: () => void;
  onLimpar: () => void;
  tecnicos: string[];
  loadingTecnicos?: boolean;
  loading: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onSincronizarLegados?: () => void;
  loadingSincronizacao?: boolean;
}

export const FiltrosEquipamentos: React.FC<FiltrosEquipamentosProps> = ({
  filtros,
  onChange,
  onConsultar,
  onLimpar,
  tecnicos,
  loadingTecnicos = false,
  loading,
  isCollapsed,
  setIsCollapsed,
  onSincronizarLegados,
  loadingSincronizacao = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConsultar();
  };

  const hasActiveFilters = Boolean(
    filtros.cd_setor ||
    filtros.registrado_por_id ||
    filtros.tipo_maquina ||
    filtros.dt_inicio ||
    filtros.dt_fim ||
    filtros.cd_serie ||
    filtros.nr_ip ||
    filtros.nm_hostname ||
    filtros.status_incompleto
  );

  return (
    <div className={`glass-card transition-all duration-300 shadow-sm border border-brand-border bg-white ${isCollapsed ? 'overflow-hidden' : 'overflow-visible'}`}>
      {/* Header clicável para colapsar */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-brand-text hover:bg-teal-50/30 transition-colors uppercase tracking-wider text-left border-none outline-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#008B95]" />
          <span>Filtros de Consulta</span>
          {isCollapsed && hasActiveFilters && (
            <span className="text-[10px] font-semibold text-[#008B95] ml-2 bg-[#F0F9FA] rounded px-2 py-0.5 normal-case tracking-normal border border-teal-200">
              Filtros ativos aplicados (clique para expandir)
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-brand-muted transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Conteúdo colapsável */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          !isCollapsed ? 'max-h-none opacity-100 border-t border-brand-border/60 p-5 overflow-visible' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
            {/* Filtro Setor */}
            <div className="lg:col-span-4 flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Setor</span>
              </label>
              <SetorAutocomplete
                value={filtros.cd_setor || ''}
                onChange={(val) => onChange({ ...filtros, cd_setor: val })}
                placeholder="Todos os setores..."
              />
            </div>

            {/* Filtro Técnico (Registrado Por) */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User size={13} className="text-[#008B95]" />
                <span>Técnico / Registrado Por</span>
              </label>
              <select
                value={filtros.registrado_por_id || ''}
                onChange={(e) => onChange({ ...filtros, registrado_por_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:border-slate-400 focus:outline-none focus:border-[#008B95] focus:bg-white transition-all text-slate-800 cursor-pointer h-[40px]"
              >
                <option value="">Todos os técnicos</option>
                {tecnicos.map((tec) => (
                  <option key={tec} value={tec}>
                    {tec}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Tipo de Máquina */}
            <div className="lg:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Laptop size={13} className="text-[#008B95]" />
                <span>Tipo de Máquina</span>
              </label>
              <select
                value={filtros.tipo_maquina || ''}
                onChange={(e) => onChange({ ...filtros, tipo_maquina: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:border-slate-400 focus:outline-none focus:border-[#008B95] focus:bg-white transition-all text-slate-800 cursor-pointer h-[40px]"
              >
                <option value="">Todas</option>
                <option value="SLIM">SLIM</option>
                <option value="MASTER">MASTER</option>
              </select>
            </div>

            {/* Filtro Data Início e Fim */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <div className="flex-1">
                <CampoData
                  id="filtro-dt-inicio"
                  type="date"
                  label="Cadastrado De"
                  value={filtros.dt_inicio || ''}
                  onChange={(val) => onChange({ ...filtros, dt_inicio: val })}
                  labelClassName="text-xs font-bold text-slate-700"
                  inputClassName="h-[40px] text-xs"
                />
              </div>
              <div className="flex-1">
                <CampoData
                  id="filtro-dt-fim"
                  type="date"
                  label="Até"
                  value={filtros.dt_fim || ''}
                  onChange={(val) => onChange({ ...filtros, dt_fim: val })}
                  labelClassName="text-xs font-bold text-slate-700"
                  inputClassName="h-[40px] text-xs"
                />
              </div>
            </div>

            {/* Linha 2: Filtros Específicos e Auditoria de Incompletos */}
            {/* Filtro Nº de Série */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                Nº de Série
              </label>
              <input
                type="text"
                value={filtros.cd_serie || ''}
                onChange={(e) => onChange({ ...filtros, cd_serie: e.target.value })}
                placeholder="Ex: 4A635P..., 4A679N..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:border-slate-400 focus:outline-none focus:border-[#008B95] focus:bg-white transition-all text-slate-800 h-[40px]"
              />
            </div>

            {/* Filtro Endereço IP */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                Endereço IP
              </label>
              <input
                type="text"
                value={filtros.nr_ip || ''}
                onChange={(e) => onChange({ ...filtros, nr_ip: e.target.value })}
                placeholder="Ex: 172.19.2.14..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:border-slate-400 focus:outline-none focus:border-[#008B95] focus:bg-white transition-all text-slate-800 h-[40px]"
              />
            </div>

            {/* Filtro Hostname */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                Hostname
              </label>
              <input
                type="text"
                value={filtros.nm_hostname || ''}
                onChange={(e) => onChange({ ...filtros, nm_hostname: e.target.value })}
                placeholder="Ex: HERTUR14, FIV10..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:border-slate-400 focus:outline-none focus:border-[#008B95] focus:bg-white transition-all text-slate-800 h-[40px]"
              />
            </div>

            {/* Filtro Registros Incompletos */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Auditoria / Incompletos</span>
              </label>
              <select
                value={filtros.status_incompleto || ''}
                onChange={(e) => onChange({ ...filtros, status_incompleto: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/50 hover:border-amber-400 focus:outline-none focus:border-[#008B95] focus:bg-white transition-all text-slate-800 cursor-pointer h-[40px] font-medium"
              >
                <option value="">Todos os registros (com ou sem dados)</option>
                <option value="sem_ip">Sem IP cadastrado</option>
                <option value="sem_hostname">Sem Hostname cadastrado</option>
                <option value="sem_serie">Sem Nº de Série cadastrado</option>
                <option value="qualquer_incompleto">Qualquer campo incompleto (IP, Host ou Série)</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onLimpar}
                className="inline-flex items-center gap-1.5 px-3.5 h-[38px] rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw size={14} />
                <span>Limpar Filtros</span>
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 h-[38px] rounded-xl bg-[#008B95] text-white text-xs font-bold hover:bg-[#00767F] transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
              <span>{loading ? 'Consultando...' : 'Consultar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

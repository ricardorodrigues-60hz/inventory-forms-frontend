import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ListFilter, HardDrive, Maximize2, X, Search, RefreshCw } from 'lucide-react';
import { useEquipamentos } from '../hooks/useEquipamentos';
import { useEquipamentosConsulta } from '../hooks/useEquipamentosConsulta';
import { sincronizarLegadosApi } from '../services/equipamentosApi';
import { EquipamentoForm } from '../components/EquipamentoForm';
import { EquipamentosDrawer } from '../components/EquipamentosDrawer';
import { FiltrosEquipamentos } from '../components/FiltrosEquipamentos';
import { TabelaEquipamentos } from '../components/TabelaEquipamentos';
import { RolloutMapeadorDePara } from '../components/RolloutMapeadorDePara';
import type { Equipamento } from '../types/equipamento';
import { CabecalhoPagina } from '../../../components/CabecalhoPagina';
import { PremiumTabs, type TabItem } from '../../../components/Guias';
import { useAuth } from '../../../hooks/useAuth';
import { useSubMenus } from '../../../hooks/useSubMenus';

type TabId =
  | 'gestao_equip_inventario'
  | 'inventario'
  | 'consulta'
  | 'gestao_equip_consulta'
  | 'gestao_equip_rollout'
  | 'rollout';

export const GestaoEquipamentosPage: React.FC = () => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isFormFullScreen, setIsFormFullScreen] = useState<boolean>(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<Equipamento | null>(null);
  const [isFiltrosCollapsed, setIsFiltrosCollapsed] = useState<boolean>(false);

  // Controle dinâmico de abas via useSubMenus (cd_menu = 38)
  const { abas, loading: loadingSubMenus, toGuiasTabs } = useSubMenus(38, user?.token);
  const dynamicTabs = useMemo(() => toGuiasTabs<TabId>(abas), [abas, toGuiasTabs]);

  const [activeTab, setActiveTab] = useState<TabId>('gestao_equip_inventario');

  // Hook da aba Consulta
  const {
    dados: dadosConsulta,
    loading: loadingConsulta,
    loadingExport,
    error: errorConsulta,
    hasConsulted,
    tecnicos,
    loadingTecnicos,
    filtros: filtrosConsulta,
    setFiltros: setFiltrosConsulta,
    consultar: consultarEquipamentos,
    handleExportarExcel
  } = useEquipamentosConsulta();

  // Redirecionamento defensivo caso o usuário não tenha acesso à aba ativa
  useEffect(() => {
    if (loadingSubMenus || dynamicTabs.length === 0) return;
    const allowedIds = dynamicTabs.map(t => t.id);
    if (!allowedIds.includes(activeTab)) {
      setActiveTab(dynamicTabs[0].id);
    }
  }, [dynamicTabs, activeTab, loadingSubMenus]);

  // Previne rolagem da página ao fundo (background scroll) quando o Drawer ou Tela Cheia estiverem abertos
  useEffect(() => {
    if (isFormFullScreen || isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormFullScreen, isDrawerOpen]);

  // Purga transparente do banco legado local HCFMB_GestaoEquipamentos se ainda existir no browser
  useEffect(() => {
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('HCFMB_GestaoEquipamentos');
      } catch (e) {
        // Silencioso
      }
    }
  }, []);

  const {
    equipamentos,
    total,
    loading,
    skip,
    limit,
    setSkip,
    filtroPatrimonio,
    setFiltroPatrimonio,
    recarrregar,
    cadastrar,
    editar,
    excluir,
  } = useEquipamentos();

  const handleIniciarEdicao = (item: Equipamento) => {
    setItemEmEdicao(item);
    setIsDrawerOpen(false);
    setIsFormFullScreen(true);
  };

  const tabs = useMemo<TabItem<TabId>[]>(() => {
    if (dynamicTabs.length > 0) return dynamicTabs;
    return [
      { id: 'gestao_equip_inventario', label: 'Inventário', enabled: true, icon: HardDrive },
      { id: 'gestao_equip_consulta', label: 'Consulta', enabled: true, icon: Search },
      { id: 'gestao_equip_rollout', label: 'Rollout', enabled: true, icon: RefreshCw }
    ];
  }, [dynamicTabs]);

  const [activeRolloutTab, setActiveRolloutTab] = useState<'planejamento' | 'campo' | 'termos'>('planejamento');

  const [loadingSincronizacao, setLoadingSincronizacao] = useState<boolean>(false);

  const handleSincronizarLegados = async () => {
    if (loadingSincronizacao) return;
    const confirmou = window.confirm(
      'Deseja executar a sincronização retroativa de IP e Hostname no OCS para todos os equipamentos com campos vazios?\n\nIsso pode levar alguns instantes.'
    );
    if (!confirmou) return;

    setLoadingSincronizacao(true);
    try {
      const res = await sincronizarLegadosApi();
      alert(`Sucesso!\n${res.mensagem}\nProcessados: ${res.total_processados} | Atualizados: ${res.total_atualizados}`);
      // Recarrega a consulta para refletir os novos dados
      consultarEquipamentos();
      recarrregar();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Erro desconhecido ao sincronizar';
      alert(`Falha ao sincronizar legados: ${msg}`);
    } finally {
      setLoadingSincronizacao(false);
    }
  };

  const handleConsultarComMinimizacao = async () => {
    setIsFiltrosCollapsed(true);
    await consultarEquipamentos();
  };

  const handleLimparFiltros = () => {
    setFiltrosConsulta({
      q: '',
      cd_setor: '',
      registrado_por_id: '',
      tipo_maquina: '',
      dt_inicio: '',
      dt_fim: '',
      cd_serie: '',
      nr_ip: '',
      nm_hostname: '',
      status_incompleto: ''
    });
  };

  const normalizedActiveTab = (activeTab || '').toLowerCase();
  const isTabRollout = 
    normalizedActiveTab.includes('rollout') ||
    normalizedActiveTab === 'gestao_equip_rollout';
  const isTabConsulta =
    !isTabRollout &&
    (normalizedActiveTab.includes('consulta') ||
      normalizedActiveTab === 'gestao_equip_consulta');
  const isTabInventario =
    !isTabConsulta &&
    !isTabRollout;

  // Dispara a consulta inicial automaticamente assim que o usuário entra na aba Consulta pela primeira vez
  useEffect(() => {
    if (isTabConsulta && !hasConsulted && !loadingConsulta) {
      consultarEquipamentos();
    }
  }, [isTabConsulta, hasConsulted, loadingConsulta, consultarEquipamentos]);

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Botão de Tela Cheia flutuante exclusivo para telas pequenas < 400px no topo direito */}
      <div className="block min-[400px]:hidden absolute right-0 top-1.5 z-10">
        <button
          type="button"
          onClick={() => setIsFormFullScreen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-teal-200 bg-white text-teal-800 hover:border-[#008B95] hover:bg-[#F0F9FA] transition-all shadow-xs"
          title="Tela Cheia"
        >
          <Maximize2 className="w-4 h-4 text-[#008B95]" />
        </button>
      </div>

      {/* Cabeçalho Principal Global */}
      <CabecalhoPagina
        fallbackTitle={itemEmEdicao ? 'Editar Equipamento' : undefined}
        fallbackDescription={itemEmEdicao ? `Editando patrimônio ${itemEmEdicao.cd_patrimonio}` : undefined}
      >
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="relative shrink-0 inline-flex items-center gap-2 px-3.5 h-[38px] rounded-xl border border-teal-200 bg-white text-teal-800 text-xs font-bold hover:border-[#008B95] hover:bg-[#F0F9FA] transition-all shadow-xs"
          >
            <ListFilter className="w-4 h-4 text-[#008B95]" />
            <span>Registros</span>
            {total > 0 && (
              <span className="bg-[#008B95] text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {total}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsFormFullScreen(true)}
            className="max-[399px]:hidden relative shrink-0 inline-flex items-center gap-2 px-3.5 h-[38px] rounded-xl border border-teal-200 bg-white text-teal-800 text-xs font-bold hover:border-[#008B95] hover:bg-[#F0F9FA] transition-all shadow-xs"
          >
            <Maximize2 className="w-4 h-4 text-[#008B95]" />
            <span>Tela Cheia</span>
          </button>
        </div>
      </CabecalhoPagina>

      {/* Guias de Navegação */}
      <PremiumTabs<TabId>
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isTabInventario && (
        <div className="flex flex-col items-center justify-start">
          <div className="w-full max-w-xl space-y-6">
            {/* Card Principal com Formulário */}
            <EquipamentoForm
              onSubmit={cadastrar}
              onEditarSubmit={editar}
              itemEmEdicao={itemEmEdicao}
              onCancelarEdicao={() => setItemEmEdicao(null)}
              onSuccessCallback={recarrregar}
            />

            <p className="text-center text-xs text-slate-400">
              Registro de patrimônio Positivo — uso interno HCFMB.
            </p>
          </div>
        </div>
      )}

      {isTabConsulta && (
        <div className="space-y-4 animate-slide-in">
          {/* Filtros de Pesquisa Expansíveis */}
          <FiltrosEquipamentos
            filtros={filtrosConsulta}
            onChange={setFiltrosConsulta}
            onConsultar={handleConsultarComMinimizacao}
            onLimpar={handleLimparFiltros}
            tecnicos={tecnicos}
            loadingTecnicos={loadingTecnicos}
            loading={loadingConsulta}
            isCollapsed={isFiltrosCollapsed}
            setIsCollapsed={setIsFiltrosCollapsed}
            onSincronizarLegados={handleSincronizarLegados}
            loadingSincronizacao={loadingSincronizacao}
          />

          {/* Tabela de Equipamentos Customizada com Busca Rápida, Ordenação, Excel e CRUD Local */}
          <TabelaEquipamentos
            dados={dadosConsulta}
            hasConsulted={hasConsulted}
            loading={loadingConsulta}
            loadingExport={loadingExport}
            error={errorConsulta}
            tecnicos={tecnicos}
            onEditarEquipamento={editar}
            onExcluirEquipamento={excluir}
            onRefresh={consultarEquipamentos}
            onExportarExcel={() => handleExportarExcel()}
          />
        </div>
      )}

      {isTabRollout && (
        <div className="animate-slide-in">
          <RolloutMapeadorDePara />
        </div>
      )}

      {/* Drawer de Registros (Substitui a Tabela na Tela) */}
      <EquipamentosDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        equipamentos={equipamentos}
        total={total}
        loading={loading}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
        filtroPatrimonio={filtroPatrimonio}
        setFiltroPatrimonio={setFiltroPatrimonio}
        onEditar={handleIniciarEdicao}
        onExcluir={excluir}
        onRefresh={recarrregar}
      />

      {/* Modal/Overlay de Tela Cheia do Formulário */}
      {isFormFullScreen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col md:p-6 p-0 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl mx-auto md:my-auto bg-white md:rounded-2xl shadow-2xl flex flex-col min-h-screen md:min-h-0 md:border md:border-teal-100">
            {/* Header especial do Modal de Tela Cheia */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#F0F9FA]">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#008B95]" />
                <span className="font-bold text-slate-800 text-sm">
                  {itemEmEdicao ? 'Editar Equipamento' : 'Novo Cadastro'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setItemEmEdicao(null);
                  setIsFormFullScreen(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Formulário */}
            <div className="p-4 md:p-6 flex-1 bg-white">
              <EquipamentoForm
                onSubmit={cadastrar}
                onEditarSubmit={editar}
                itemEmEdicao={itemEmEdicao}
                onCancelarEdicao={() => {
                  setItemEmEdicao(null);
                  setIsFormFullScreen(false);
                }}
                onSuccessCallback={() => {
                  recarrregar();
                  setIsFormFullScreen(false);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

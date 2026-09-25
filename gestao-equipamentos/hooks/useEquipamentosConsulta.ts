import { useState, useCallback, useEffect } from 'react';
import type {
  Equipamento,
  FiltrosEquipamentosValues
} from '../types/equipamento';
import {
  listarEquipamentosApi,
  obterTecnicosApi,
  exportarEquipamentosExcelApi
} from '../services/equipamentosApi';
import { useRepository } from '../../../offline/useRepository';

export function useEquipamentosConsulta() {
  const [dados, setDados] = useState<Equipamento[]>([]);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsulted, setHasConsulted] = useState<boolean>(false);

  // Repositório offline padrão do menu 38
  const { fetchData } = useRepository(38);

  // Lista de técnicos disponíveis para filtro
  const [tecnicos, setTecnicos] = useState<string[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState<boolean>(false);

  // Filtros aplicados
  const [filtros, setFiltros] = useState<FiltrosEquipamentosValues>({
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

  // Carregar lista de técnicos ao montar o hook com suporte offline no dataBuffer
  useEffect(() => {
    let isMounted = true;
    const carregarTecnicos = async () => {
      setLoadingTecnicos(true);
      try {
        const result = await fetchData<string[]>(
          'tecnicos',
          () => obterTecnicosApi(),
          { ttl: 24 * 60 * 60 }
        );
        if (isMounted && result?.data) {
          setTecnicos(result.data);
        }
      } catch (err) {
        console.warn('Erro ao carregar técnicos:', err);
      } finally {
        if (isMounted) setLoadingTecnicos(false);
      }
    };

    carregarTecnicos();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  // Função para executar a consulta buscando todos os registros correspondentes aos filtros
  // (permitindo ordenação e paginação rápidas no cliente, padrão idêntico ao OPME)
  const consultar = useCallback(
    async (novosFiltros?: FiltrosEquipamentosValues) => {
      const activeFiltros = novosFiltros || filtros;
      setLoading(true);
      setError(null);

      try {
        const res = await listarEquipamentosApi({
          skip: 0,
          limit: 5000, // Limite confortável para listagem completa em memória com ordenação rápida
          q: activeFiltros.q || undefined,
          cd_setor: activeFiltros.cd_setor || undefined,
          registrado_por_id: activeFiltros.registrado_por_id || undefined,
          tipo_maquina: activeFiltros.tipo_maquina || undefined,
          dt_inicio: activeFiltros.dt_inicio || undefined,
          dt_fim: activeFiltros.dt_fim || undefined,
          cd_serie: activeFiltros.cd_serie || undefined,
          nr_ip: activeFiltros.nr_ip || undefined,
          nm_hostname: activeFiltros.nm_hostname || undefined,
          status_incompleto: activeFiltros.status_incompleto || undefined,
        });

        setDados(res.itens || []);
        setTotalRegistros(res.total || 0);
        setHasConsulted(true);
        return res;
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || 'Erro ao consultar equipamentos.';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [filtros]
  );

  // Exportar Excel baseado nos filtros atualmente definidos
  const handleExportarExcel = useCallback(async (overrideFiltros?: FiltrosEquipamentosValues) => {
    setLoadingExport(true);
    try {
      await exportarEquipamentosExcelApi(overrideFiltros || filtros);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Erro ao exportar relatório em Excel.';
      setError(msg);
    } finally {
      setLoadingExport(false);
    }
  }, [filtros]);

  return {
    dados,
    totalRegistros,
    loading,
    loadingExport,
    error,
    hasConsulted,
    tecnicos,
    loadingTecnicos,
    filtros,
    setFiltros,
    consultar,
    handleExportarExcel
  };
}

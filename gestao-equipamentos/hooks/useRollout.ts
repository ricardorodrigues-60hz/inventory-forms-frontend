import { useState, useCallback } from 'react';
import type {
  NovoEquipamentoOut,
  NovoEquipamentoImport,
  ParMerge,
  ItemPlanejadoOut,
} from '../types/rollout';
import {
  importarNovosApi,
  listarDisponiveisApi,
  vincularParesApi,
  listarPlanejadosPorSetorApi,
  confirmarDevolucaoApi,
  confirmarEntregaApi,
} from '../services/rolloutApi';

export function useRollout() {
  const [novosDisponiveis, setNovosDisponiveis] = useState<NovoEquipamentoOut[]>([]);
  const [loadingDisponiveis, setLoadingDisponiveis] = useState(false);

  const [planejados, setPlanejados] = useState<ItemPlanejadoOut[]>([]);
  const [loadingPlanejados, setLoadingPlanejados] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fetchDisponiveis = useCallback(async () => {
    setLoadingDisponiveis(true);
    setErro(null);
    try {
      const data = await listarDisponiveisApi();
      setNovosDisponiveis(data);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao carregar equipamentos novos disponíveis.';
      setErro(msg);
    } finally {
      setLoadingDisponiveis(false);
    }
  }, []);

  const importarNovos = useCallback(async (itens: NovoEquipamentoImport[]) => {
    setSubmitting(true);
    setErro(null);
    try {
      const res = await importarNovosApi(itens);
      await fetchDisponiveis();
      return res;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao importar novos equipamentos.';
      setErro(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [fetchDisponiveis]);

  const vincularPares = useCallback(async (pares: ParMerge[]) => {
    setSubmitting(true);
    setErro(null);
    try {
      const res = await vincularParesApi(pares);
      await fetchDisponiveis();
      return res;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao salvar vinculações (Merge).';
      setErro(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [fetchDisponiveis]);

  const fetchPlanejadosPorSetor = useCallback(async (cdSetor: string) => {
    if (!cdSetor) {
      setPlanejados([]);
      return;
    }
    setLoadingPlanejados(true);
    setErro(null);
    try {
      const data = await listarPlanejadosPorSetorApi(cdSetor);
      setPlanejados(data);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || `Erro ao carregar itens planejados do setor ${cdSetor}.`;
      setErro(msg);
    } finally {
      setLoadingPlanejados(false);
    }
  }, []);

  const registrarDevolucao = useCallback(async (cdRegistroAntigo: number, cdSetor: string) => {
    setSubmitting(true);
    setErro(null);
    try {
      const res = await confirmarDevolucaoApi(cdRegistroAntigo);
      if (cdSetor) {
        await fetchPlanejadosPorSetor(cdSetor);
      }
      return res;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao confirmar devolução.';
      setErro(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [fetchPlanejadosPorSetor]);

  const registrarEntrega = useCallback(async (cdRegistroNovo: number, cdSetor: string) => {
    setSubmitting(true);
    setErro(null);
    try {
      const res = await confirmarEntregaApi(cdRegistroNovo);
      if (cdSetor) {
        await fetchPlanejadosPorSetor(cdSetor);
      }
      return res;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao confirmar entrega.';
      setErro(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [fetchPlanejadosPorSetor]);

  return {
    novosDisponiveis,
    loadingDisponiveis,
    fetchDisponiveis,
    importarNovos,
    vincularPares,
    planejados,
    loadingPlanejados,
    fetchPlanejadosPorSetor,
    registrarDevolucao,
    registrarEntrega,
    submitting,
    erro,
    setErro,
  };
}

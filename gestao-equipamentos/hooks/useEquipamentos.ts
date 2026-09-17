import { useState, useCallback, useEffect } from 'react';
import type { Equipamento, EquipamentoCreatePayload, EquipamentoUpdatePayload } from '../types/equipamento';
import { 
  listarEquipamentosApi, 
  atualizarEquipamentoApi, 
  deletarEquipamentoApi 
} from '../services/equipamentosApi';
import { useRepository } from '../../../offline/useRepository';

export function useEquipamentos() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [skip, setSkip] = useState<number>(0);
  const [limit] = useState<number>(20);
  const [filtroPatrimonio, setFiltroPatrimonio] = useState<string>('');

  // Repositório offline padrão do HCEscritório (menu 38 = Gestão de Equipamentos)
  const { fetchData, mutate, isOffline } = useRepository(38);

  const carregarEquipamentos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cacheKey = `equipamentos_lista_skip_${skip}_limit_${limit}_q_${filtroPatrimonio || ''}`;
      const result = await fetchData(cacheKey, () =>
        listarEquipamentosApi({
          skip,
          limit,
          q: filtroPatrimonio || undefined
        })
      );
      setEquipamentos(result.data.itens);
      setTotal(result.data.total);
    } catch (err: any) {
      console.error('Erro ao listar equipamentos:', err);
      setError('Falha ao conectar com o servidor para listar equipamentos.');
    } finally {
      setLoading(false);
    }
  }, [skip, limit, filtroPatrimonio, fetchData]);

  // Carrega equipamentos e pré-popula proativamente os setores no buffer local (IndexedDB)
  useEffect(() => {
    carregarEquipamentos();
    // Pré-carrega os setores em background para garantir que o dataBuffer esteja pronto
    fetchData('setores', () => import('../services/equipamentosApi').then(m => m.obterSetoresApi()), {
      ttl: 24 * 60 * 60,
    }).catch((e) => console.warn('[useEquipamentos] Pré-carregamento de setores em background:', e));
  }, [carregarEquipamentos, fetchData]);

  const cadastrar = async (payload: EquipamentoCreatePayload) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hc_token') || '' : '';
    const res = await mutate({
      uuid: crypto.randomUUID(),
      url: '/hcescritorio/api/equipamentos',
      method: 'POST',
      payload,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      maxRetries: 5,
    });

    if (res.queued) {
      return {
        offline: true,
        mensagem: 'Salvo localmente (offline)! Será sincronizado quando a conexão retornar.',
      };
    }

    await carregarEquipamentos();
    return {
      offline: false,
      mensagem: 'Equipamento registrado com sucesso!',
    };
  };

  const editar = async (cd_registro: number, payload: EquipamentoUpdatePayload) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hc_token') || '' : '';
    const res = await mutate({
      uuid: crypto.randomUUID(),
      url: `/hcescritorio/api/equipamentos/${cd_registro}`,
      method: 'PUT',
      payload,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      maxRetries: 5,
    });

    if (res.queued) {
      return {
        mensagem: 'Alteração salva localmente (offline) para sincronização posterior.',
      };
    }

    await carregarEquipamentos();
    return { mensagem: 'Equipamento atualizado com sucesso!' };
  };

  const excluir = async (cd_registro: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hc_token') || '' : '';
    const res = await mutate({
      uuid: crypto.randomUUID(),
      url: `/hcescritorio/api/equipamentos/${cd_registro}`,
      method: 'DELETE',
      payload: {},
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      maxRetries: 5,
    });

    if (!res.queued) {
      await carregarEquipamentos();
    }
    return { mensagem: 'Equipamento excluído com sucesso!' };
  };

  return {
    equipamentos,
    total,
    loading,
    error,
    skip,
    limit,
    setSkip,
    filtroPatrimonio,
    setFiltroPatrimonio,
    recarrregar: carregarEquipamentos,
    cadastrar,
    editar,
    excluir,
    isOffline,
  };
}

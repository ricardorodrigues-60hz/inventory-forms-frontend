import { criarClienteApi } from '../../../utils/createApiClient';
import type {
  NovoEquipamentoImport,
  ImportarNovosResponse,
  NovoEquipamentoOut,
  ParMerge,
  RolloutMergeResponse,
  ItemPlanejadoOut,
  ConfirmarDevolucaoResponse,
  ConfirmarEntregaResponse,
} from '../types/rollout';

const apiClient = criarClienteApi();
const ROLLOUT_BASE_URL = '/hcescritorio/api/equipamentos/rollout';

export async function importarNovosApi(itens: NovoEquipamentoImport[]): Promise<ImportarNovosResponse> {
  const response = await apiClient.post<ImportarNovosResponse>(`${ROLLOUT_BASE_URL}/importar-novos`, { itens });
  return response.data;
}

export async function listarDisponiveisApi(): Promise<NovoEquipamentoOut[]> {
  const response = await apiClient.get<NovoEquipamentoOut[]>(`${ROLLOUT_BASE_URL}/disponiveis`);
  return response.data;
}

export async function vincularParesApi(pares: ParMerge[]): Promise<RolloutMergeResponse> {
  const response = await apiClient.post<RolloutMergeResponse>(`${ROLLOUT_BASE_URL}/merge`, { pares });
  return response.data;
}

export async function listarPlanejadosPorSetorApi(cd_setor: string): Promise<ItemPlanejadoOut[]> {
  const response = await apiClient.get<ItemPlanejadoOut[]>(`${ROLLOUT_BASE_URL}/planejados/${encodeURIComponent(cd_setor)}`);
  return response.data;
}

export async function confirmarDevolucaoApi(cd_registro_antigo: number): Promise<ConfirmarDevolucaoResponse> {
  const response = await apiClient.post<ConfirmarDevolucaoResponse>(`${ROLLOUT_BASE_URL}/confirmar-devolucao`, {
    cd_registro_antigo,
  });
  return response.data;
}

export async function confirmarEntregaApi(cd_registro_novo: number): Promise<ConfirmarEntregaResponse> {
  const response = await apiClient.post<ConfirmarEntregaResponse>(`${ROLLOUT_BASE_URL}/confirmar-entrega`, {
    cd_registro_novo,
  });
  return response.data;
}

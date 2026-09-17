import { criarClienteApi } from '../../../utils/createApiClient';
import type { RegistroDevolucao } from '../types/devolucoes';

const apiClient = criarClienteApi();

const DEVOLUCOES_URL = '/hcescritorio/api/equipamentos/devolucoes';

/**
 * Busca devoluções do servidor.
 */
export async function obterDevolucoesApi(): Promise<RegistroDevolucao[]> {
  const response = await apiClient.get<RegistroDevolucao[]>(DEVOLUCOES_URL);
  return response.data || [];
}

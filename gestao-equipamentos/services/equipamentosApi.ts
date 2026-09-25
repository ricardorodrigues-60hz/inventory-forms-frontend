import { criarClienteApi } from '../../../utils/createApiClient';
import type {
  Equipamento,
  EquipamentoCreatePayload,
  EquipamentoUpdatePayload,
  EquipamentosListResponse,
  EquipamentosConsultaParams,
  FiltrosEquipamentosValues,
  EquipamentoConsultaPatrimonio,
  SetorOption
} from '../types/equipamento';

const apiClient = criarClienteApi();

const BASE_URL = '/hcescritorio/api/equipamentos';
const SETORES_URL = '/hcescritorio/api/setores';

export async function consultarPatrimonioApi(cd_patrimonio: string): Promise<EquipamentoConsultaPatrimonio> {
  const response = await apiClient.get<EquipamentoConsultaPatrimonio>(
    `${BASE_URL}/consultar-patrimonio/${cd_patrimonio}`
  );
  return response.data;
}

export async function listarEquipamentosApi(
  params?: EquipamentosConsultaParams
): Promise<EquipamentosListResponse> {
  try {
    const response = await apiClient.get<EquipamentosListResponse>(BASE_URL, { params });
    return response.data;
  } catch (error) {
    console.warn('[Equipamentos API] Erro ao listar equipamentos:', error);
    return {
      total: 0,
      skip: params?.skip || 0,
      limit: params?.limit || 50,
      itens: []
    };
  }
}

export async function obterTecnicosApi(): Promise<string[]> {
  try {
    const response = await apiClient.get<string[]>(`${BASE_URL}/tecnicos`);
    return response.data;
  } catch (error) {
    console.warn('[Equipamentos API] Erro ao obter lista de técnicos:', error);
    return [];
  }
}

export async function exportarEquipamentosExcelApi(
  filtros?: FiltrosEquipamentosValues
): Promise<void> {
  const response = await apiClient.get(`${BASE_URL}/exportar-excel`, {
    params: filtros,
    responseType: 'blob'
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const contentDisposition = response.headers?.['content-disposition'];
  let filename = `Relatorio_Equipamentos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function obterEquipamentoApi(cd_registro: number): Promise<Equipamento> {
  const response = await apiClient.get<Equipamento>(`${BASE_URL}/${cd_registro}`);
  return response.data;
}

export async function cadastrarEquipamentoApi(
  payload: EquipamentoCreatePayload | EquipamentoCreatePayload[]
): Promise<{ mensagem: string; inseridos?: number }> {
  const response = await apiClient.post<{ mensagem: string; inseridos?: number }>(BASE_URL, payload);
  return response.data;
}

export async function atualizarEquipamentoApi(
  cd_registro: number,
  payload: EquipamentoUpdatePayload
): Promise<{ mensagem: string }> {
  const response = await apiClient.put<{ mensagem: string }>(`${BASE_URL}/${cd_registro}`, payload);
  return response.data;
}

export async function deletarEquipamentoApi(cd_registro: number): Promise<{ mensagem: string }> {
  const response = await apiClient.delete<{ mensagem: string }>(`${BASE_URL}/${cd_registro}`);
  return response.data;
}

export async function obterSetoresApi(): Promise<SetorOption[]> {
  const response = await apiClient.get<SetorOption[]>(SETORES_URL);
  return response.data || [];
}

export async function sincronizarLegadosApi(): Promise<{
  mensagem: string;
  total_processados: number;
  total_atualizados: number;
}> {
  const response = await apiClient.post<{
    mensagem: string;
    total_processados: number;
    total_atualizados: number;
  }>(`${BASE_URL}/sincronizar-legados`);
  return response.data;
}


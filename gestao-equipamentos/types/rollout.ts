export interface NovoEquipamentoImport {
  cd_patrimonio: string;
  cd_serie?: string;
  cd_mac?: string;
  ano_rollout?: number;
}

export interface ImportarNovosRequest {
  itens: NovoEquipamentoImport[];
}

export interface ImportarNovosResponse {
  processados: number;
  mensagem: string;
}

export interface NovoEquipamentoOut {
  cd_registro: number;
  cd_patrimonio: string;
  cd_serie?: string | null;
  cd_mac?: string | null;
  ano_rollout?: number | null;
  st_utilizado: 'N' | 'P' | 'S';
  reg_key?: number | null;
}

export interface ParMerge {
  reg_key_antigo: number;
  cd_registro_novo: number;
}

export interface RolloutMergeRequest {
  pares: ParMerge[];
}

export interface RolloutMergeResponse {
  vinculados: number;
  mensagem: string;
}

export interface ItemPlanejadoOut {
  cd_registro_antigo: number;
  cd_patrimonio_antigo: string;
  cd_setor: string;
  local_especifico?: string | null;
  tipo_maquina?: string | null;
  ano_rollout_antigo?: number | null;
  cd_registro_novo: number;
  cd_patrimonio_novo: string;
  cd_serie_novo?: string | null;
  cd_mac_novo?: string | null;
  st_utilizado_novo: 'N' | 'P' | 'S';
}

export interface ConfirmarDevolucaoRequest {
  cd_registro_antigo: number;
}

export interface ConfirmarDevolucaoResponse {
  sucesso: boolean;
  mensagem: string;
}

export interface ConfirmarEntregaRequest {
  cd_registro_novo: number;
}

export interface ConfirmarEntregaResponse {
  sucesso: boolean;
  mensagem: string;
}

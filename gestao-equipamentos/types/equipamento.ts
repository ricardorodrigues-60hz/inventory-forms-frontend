export type TipoMaquina = 'SLIM' | 'MASTER';

export interface SetorOption {
  cd_setor: number | string;
  nm_setor: string;
  label: string;
}

export interface Equipamento {
  cd_registro: number;
  cd_patrimonio: string;
  cd_setor: string;
  dc_setor: string; // nm_setor vindo do backend
  local_especifico?: string | null;
  tipo_maquina: TipoMaquina;
  observacao?: string | null;
  nr_ip?: string | null;
  nm_hostname?: string | null;
  cd_serie?: string | null;
  cd_mac?: string | null;
  dt_entrega?: string | null;
  sn_inserido_manual?: 'S' | 'N';
  registrado_por_id: string;
  registrado_em: string;
}

export interface EquipamentoCreatePayload {
  cd_patrimonio: string;
  cd_setor: string;
  local_especifico?: string | null;
  tipo_maquina: TipoMaquina;
  observacao?: string | null;
  nr_ip?: string | null;
  nm_hostname?: string | null;
  cd_serie?: string | null;
  cd_mac?: string | null;
  dt_entrega?: string | null;
  sn_inserido_manual?: 'S' | 'N';
}

export interface EquipamentoUpdatePayload {
  cd_patrimonio?: string;
  cd_setor?: string;
  local_especifico?: string | null;
  tipo_maquina?: TipoMaquina;
  observacao?: string | null;
  nr_ip?: string | null;
  nm_hostname?: string | null;
  cd_serie?: string | null;
  cd_mac?: string | null;
  dt_entrega?: string | null;
  sn_inserido_manual?: 'S' | 'N';
}

export interface EquipamentoConsultaPatrimonio {
  cd_patrimonio: string;
  nr_serie?: string | null;
  cd_serie?: string | null;
  cd_setor?: string | null;
  nm_setor?: string | null;
  nm_hostname?: string | null;
  nr_ip?: string | null;
  mac_address?: string | null;
  cd_mac?: string | null;
}

export interface EquipamentoPendenteLocal extends EquipamentoCreatePayload {
  id?: number;
  criado_em: string;
  tentativas: number;
  ultimo_erro?: string;
}

export interface EquipamentosListResponse {
  total: number;
  skip: number;
  limit: number;
  itens: Equipamento[];
}

export interface FiltrosEquipamentosValues {
  q?: string;
  cd_setor?: string;
  registrado_por_id?: string;
  tipo_maquina?: string;
  dt_inicio?: string;
  dt_fim?: string;
  cd_serie?: string;
  nr_ip?: string;
  nm_hostname?: string;
  status_incompleto?: '' | 'sem_ip' | 'sem_hostname' | 'sem_serie' | 'qualquer_incompleto';
}

export interface EquipamentosConsultaParams extends FiltrosEquipamentosValues {
  skip?: number;
  limit?: number;
}


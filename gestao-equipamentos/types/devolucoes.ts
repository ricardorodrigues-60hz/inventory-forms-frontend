export interface EquipamentoDevolucao {
  snDevolvida: string;
  nrSerie: string;
  numEqpto: string;
  modelo: string;
  caboEnergia: string;
  caboUsb: string;
  restauracao: string;
  mouse: string;
  teclado: string;
  monitor: string;
  nrIp?: string;
  macAddress?: string;
  localEspecifico?: string;
  tipoMaquina?: string;
}

export interface RegistroDevolucao {
  folha: string;
  setor: string;
  data: string;
  contrato: string;
  empresa: string;
  obs: string;
  pagina: number;
  equipamentos: EquipamentoDevolucao[];
}

export type DocTemplate = 'pcs' | 'printers';
export type DocOperation = 'entrega' | 'devolucao';
export type ViewMode = 'doc' | 'table';

export interface ParametrosTermo {
  docData: string;
  docEdital: string;
  docSei: string;
  docContrato: string;
  docEmpresa: string;
}

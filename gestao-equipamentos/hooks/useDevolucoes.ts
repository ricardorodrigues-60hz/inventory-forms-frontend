import { useState, useEffect, useMemo, useCallback } from 'react';
import { obterDevolucoesApi } from '../services/devolucoesApi';
import type {
  RegistroDevolucao,
  DocTemplate,
  DocOperation,
  ViewMode,
  ParametrosTermo,
} from '../types/devolucoes';

export function useDevolucoes() {
  const [bancoDeDados, setBancoDeDados] = useState<RegistroDevolucao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState<boolean>(false);

  // Modos de Exibição
  const [docOperation, setDocOperation] = useState<DocOperation>('entrega');
  const [docTemplate, setDocTemplate] = useState<DocTemplate>('pcs');
  const [viewMode, setViewMode] = useState<ViewMode>('doc');

  // Filtros de busca
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSetor, setSelectedSetor] = useState<string>('');
  const [selectedFolha, setSelectedFolha] = useState<string>('ALL');

  // Parâmetros editáveis dos campos em negrito
  const [showEditFields, setShowEditFields] = useState<boolean>(false);
  const [parametros, setParametros] = useState<ParametrosTermo>({
    docData: new Date().toLocaleDateString('pt-BR'),
    docEdital: '121/2023',
    docSei: '143.00000003/2023-78',
    docContrato: '033/2023',
    docEmpresa: 'ImportInvest',
  });

  // Ajusta defaults contratuais ao alternar tipo de equipamento
  useEffect(() => {
    if (docTemplate === 'printers') {
      setParametros(prev => ({
        ...prev,
        docContrato: '19/2018-HCFMB',
        docEmpresa: 'ImportInvest',
      }));
    } else {
      setParametros(prev => ({
        ...prev,
        docContrato: '033/2023',
        docEmpresa: 'COMTECH',
      }));
    }
  }, [docTemplate]);

  // Busca dados da API
  const fetchDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obterDevolucoesApi();
      setBancoDeDados(data);
      setIsOfflineData(!navigator.onLine);
      if (data.length > 0 && (!selectedFolha || selectedFolha === '')) {
        setSelectedFolha('ALL');
      }
    } catch (err: any) {
      console.error('Erro ao carregar devoluções:', err);
      const msg =
        err?.response?.data?.detalhe ||
        err?.response?.data?.erro ||
        err?.message ||
        'Não foi possível carregar os registros.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedFolha]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // Lista de Setores Disponíveis
  const setoresDisponiveis = useMemo(() => {
    return Array.from(new Set(bancoDeDados.map(r => r.setor))).filter(Boolean).sort();
  }, [bancoDeDados]);

  // Folhas Filtradas
  const folhasFiltradas = useMemo(() => {
    const t = searchTerm.toLowerCase().trim();
    if (!selectedSetor && !t) return bancoDeDados;

    return bancoDeDados
      .filter(r => !selectedSetor || r.setor === selectedSetor)
      .map(r => {
        if (!t) return r;
        const sectorMatches =
          (r.setor && r.setor.toLowerCase().includes(t)) ||
          (r.folha && r.folha.toLowerCase().includes(t));
        if (sectorMatches) return r;

        const matchingEquips = r.equipamentos.filter(
          e =>
            (e.nrSerie && e.nrSerie.toLowerCase().includes(t)) ||
            (e.numEqpto && e.numEqpto.toLowerCase().includes(t)) ||
            (e.modelo && e.modelo.toLowerCase().includes(t)) ||
            (e.nrIp && e.nrIp.toLowerCase().includes(t)) ||
            (e.macAddress && e.macAddress.toLowerCase().includes(t)) ||
            (e.localEspecifico && e.localEspecifico.toLowerCase().includes(t))
        );

        if (!matchingEquips.length) return null;
        return { ...r, equipamentos: matchingEquips };
      })
      .filter((r): r is RegistroDevolucao => r !== null);
  }, [bancoDeDados, selectedSetor, searchTerm]);

  // Registro visível no documento atual
  const registro = useMemo(() => {
    if (!folhasFiltradas.length) return null;
    if (selectedFolha === 'ALL' || !selectedFolha) {
      const allEquips = folhasFiltradas.flatMap(r => r.equipamentos);
      const first = folhasFiltradas[0];
      return {
        folha: 'TODOS',
        setor: selectedSetor
          ? `Setor: ${selectedSetor} (Todos os Registros)`
          : 'Complexo HCFMB (Visão Geral - Todos os Setores)',
        data: parametros.docData || first?.data || new Date().toLocaleDateString('pt-BR'),
        contrato: parametros.docContrato,
        empresa: parametros.docEmpresa,
        obs: 'Visão Consolidada Universal - Todos os equipamentos do complexo HCFMB.',
        pagina: 1,
        equipamentos: allEquips,
      };
    }
    return folhasFiltradas.find(r => r.folha === selectedFolha) ?? folhasFiltradas[0];
  }, [folhasFiltradas, selectedFolha, selectedSetor, parametros]);

  useEffect(() => {
    if (
      folhasFiltradas.length &&
      selectedFolha !== 'ALL' &&
      !folhasFiltradas.some(r => r.folha === selectedFolha)
    ) {
      setSelectedFolha('ALL');
    }
  }, [folhasFiltradas, selectedFolha]);

  // Estatísticas Globais
  const stats = useMemo(() => {
    const totalFolhas = bancoDeDados.length;
    let totalEquip = 0;
    let conformes = 0;
    bancoDeDados.forEach(r => {
      r.equipamentos.forEach(e => {
        totalEquip++;
        if (e.snDevolvida === 'S' || e.caboEnergia === 'S') conformes++;
      });
    });
    const pct = totalEquip ? Math.round((conformes / totalEquip) * 100) : 0;
    return { totalFolhas, totalEquip, conformes, pct };
  }, [bancoDeDados]);

  // Exportação para CSV
  const exportarCSV = () => {
    if (!registro || !registro.equipamentos.length) return;
    const headers = [
      'Nr. Serie',
      'Pat. Contratada',
      'Modelo',
      'Nr. IP',
      'Mac Address',
      'Local Especifico',
      'Setor',
      'Energia',
      'USB',
      'Teclado',
      'Mouse',
      'Monitor',
      'Status SN',
    ];
    const rows = registro.equipamentos.map(e => [
      `"${e.nrSerie || ''}"`,
      `"${e.numEqpto || ''}"`,
      `"${e.modelo || ''}"`,
      `"${e.nrIp || ''}"`,
      `"${e.macAddress || ''}"`,
      `"${e.localEspecifico || ''}"`,
      `"${registro.setor || ''}"`,
      `"${e.caboEnergia || 'S'}"`,
      `"${e.caboUsb || 'S'}"`,
      `"${e.teclado || 'S'}"`,
      `"${e.mouse || 'S'}"`,
      `"${e.monitor || 'S'}"`,
      `"${e.snDevolvida || 'S'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Relatorio_Equipamentos_${registro.folha}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limparFiltros = () => {
    setSearchTerm('');
    setSelectedSetor('');
    if (bancoDeDados.length) setSelectedFolha('ALL');
  };

  const updateParametro = (campo: keyof ParametrosTermo, valor: string) => {
    setParametros(prev => ({ ...prev, [campo]: valor }));
  };

  return {
    bancoDeDados,
    loading,
    error,
    isOfflineData,
    docOperation,
    setDocOperation,
    docTemplate,
    setDocTemplate,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    selectedSetor,
    setSelectedSetor,
    selectedFolha,
    setSelectedFolha,
    showEditFields,
    setShowEditFields,
    parametros,
    updateParametro,
    folhasFiltradas,
    registro,
    stats,
    setoresDisponiveis,
    fetchDados,
    exportarCSV,
    limparFiltros,
  };
}

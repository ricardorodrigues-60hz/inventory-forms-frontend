import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2,
  Save,
  RefreshCw,
  Cpu,
  PackageCheck,
  Search,
  Layers,
  Edit3,
  Menu,
  X,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { SetorAutocomplete } from './SetorAutocomplete';
import { RelatorioEquipamentosView } from './RelatorioEquipamentosView';
import { useRollout } from '../hooks/useRollout';
import { listarEquipamentosApi } from '../services/equipamentosApi';
import type { Equipamento } from '../types/equipamento';
import type { NovoEquipamentoOut, NovoEquipamentoImport, ParMerge } from '../types/rollout';

interface StagedPair {
  antigo: Equipamento;
  novo: NovoEquipamentoOut;
}

export const RolloutMapeadorDePara: React.FC = () => {
  const {
    novosDisponiveis,
    loadingDisponiveis,
    fetchDisponiveis,
    importarNovos,
    vincularPares,
    planejados,
    loadingPlanejados,
    fetchPlanejadosPorSetor,
    submitting,
    erro,
    setErro,
  } = useRollout();

  // Estado do Setor selecionado
  const [cdSetor, setCdSetor] = useState<string>('');
  const [equipamentosAntigos, setEquipamentosAntigos] = useState<Equipamento[]>([]);
  const [loadingAntigos, setLoadingAntigos] = useState(false);

  // Estado do Modal de Vínculos Salvos
  const [isModalVinculosOpen, setIsModalVinculosOpen] = useState(false);
  const [searchModalVinculos, setSearchModalVinculos] = useState('');

  // Seleções para pareamento manual
  const [selectedAntigoId, setSelectedAntigoId] = useState<number | null>(null);
  const [selectedNovoId, setSelectedNovoId] = useState<number | null>(null);

  // Lista de Pares em rascunho (Staging)
  const [stagedPairs, setStagedPairs] = useState<StagedPair[]>([]);

  // Filtros de busca por texto
  const [searchAntigos, setSearchAntigos] = useState('');
  const [searchNovos, setSearchNovos] = useState('');

  // Notificações de sucesso
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  // Input de arquivo para importação de estoque novo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega lista de disponíveis ao montar
  useEffect(() => {
    fetchDisponiveis();
  }, [fetchDisponiveis]);

  // Carrega equipamentos antigos do setor selecionado
  useEffect(() => {
    if (!cdSetor) {
      setEquipamentosAntigos([]);
      return;
    }
    const loadAntigos = async () => {
      setLoadingAntigos(true);
      try {
        const res = await listarEquipamentosApi({ cd_setor: cdSetor, limit: 200 });
        setEquipamentosAntigos(res.itens || []);
      } catch (err) {
        console.error('Erro ao buscar equipamentos do setor:', err);
      } finally {
        setLoadingAntigos(false);
      }
    };
    loadAntigos();
  }, [cdSetor]);

  // Estado de IDs antigos mesclados permanentemente no banco para este setor nesta sessão
  const [mergedAntigoIds, setMergedAntigoIds] = useState<Set<number>>(new Set());

  // IDs dos equipamentos já pareados no rascunho ou mesclados
  const pairedAntigoIds = useMemo(() => {
    const set = new Set(stagedPairs.map(p => p.antigo.cd_registro));
    mergedAntigoIds.forEach(id => set.add(id));
    return set;
  }, [stagedPairs, mergedAntigoIds]);

  const pairedNovoIds = useMemo(() => new Set(stagedPairs.map(p => p.novo.cd_registro)), [stagedPairs]);

  // Antigos disponíveis para seleção (exclui os já pareados ou mesclados)
  const antigosFiltrados = useMemo(() => {
    return equipamentosAntigos.filter(e => {
      if (pairedAntigoIds.has(e.cd_registro)) return false;
      if (!searchAntigos.trim()) return true;
      const term = searchAntigos.toLowerCase();
      return (
        e.cd_patrimonio.toLowerCase().includes(term) ||
        (e.local_especifico && e.local_especifico.toLowerCase().includes(term))
      );
    });
  }, [equipamentosAntigos, pairedAntigoIds, searchAntigos]);

  // Conversão dos pares em staging para o formato do Termo PDF (Devolução e Entrega)
  const { listDevolucaoPdf, listEntregaPdf } = useMemo(() => {
    const listDevolucao = stagedPairs.map(p => ({
      snDevolvida: 'S',
      nrSerie: p.antigo.cd_serie || 'N/A',
      numEqpto: p.antigo.cd_patrimonio,
      modelo: p.antigo.tipo_maquina || 'SLIM',
      caboEnergia: 'S',
      caboUsb: 'N',
      restauracao: 'S',
      mouse: 'S',
      teclado: 'S',
      monitor: 'S',
      nrIp: p.antigo.nr_ip,
      macAddress: p.antigo.cd_mac,
      localEspecifico: p.antigo.local_especifico || 'Setor',
      tipoMaquina: p.antigo.tipo_maquina || 'SLIM',
    }));

    const listEntrega = stagedPairs.map(p => ({
      snDevolvida: 'N',
      nrSerie: p.novo.cd_serie || 'N/A',
      numEqpto: p.novo.cd_patrimonio,
      modelo: 'DESKTOP NOVO (ROLLOUT)',
      caboEnergia: 'S',
      caboUsb: 'S',
      restauracao: 'N',
      mouse: 'S',
      teclado: 'S',
      monitor: 'S',
      nrIp: 'DHCP / DINÂMICO',
      macAddress: p.novo.cd_mac || 'N/A',
      localEspecifico: 'Entregue no Setor',
      tipoMaquina: 'SLIM NOVO',
    }));

    return { listDevolucaoPdf: listDevolucao, listEntregaPdf: listEntrega };
  }, [stagedPairs]);

  // Novos disponíveis para seleção (exclui os já pareados)
  const novosFiltrados = useMemo(() => {
    return novosDisponiveis.filter(n => {
      if (pairedNovoIds.has(n.cd_registro)) return false;
      if (!searchNovos.trim()) return true;
      const term = searchNovos.toLowerCase();
      return (
        n.cd_patrimonio.toLowerCase().includes(term) ||
        (n.cd_serie && n.cd_serie.toLowerCase().includes(term)) ||
        (n.cd_mac && n.cd_mac.toLowerCase().includes(term))
      );
    });
  }, [novosDisponiveis, pairedNovoIds, searchNovos]);

  // Handler para parear os itens selecionados
  const handleParear = () => {
    if (!selectedAntigoId || !selectedNovoId) return;
    const itemAntigo = equipamentosAntigos.find(e => e.cd_registro === selectedAntigoId);
    const itemNovo = novosDisponiveis.find(n => n.cd_registro === selectedNovoId);

    if (itemAntigo && itemNovo) {
      setStagedPairs(prev => [...prev, { antigo: itemAntigo, novo: itemNovo }]);
      setSelectedAntigoId(null);
      setSelectedNovoId(null);
    }
  };

  // Handler para remover um par do rascunho
  const handleRemoverPar = (index: number) => {
    setStagedPairs(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handler para editar um par (desfaz o par e pré-seleciona nos seletores)
  const handleEditarPar = (index: number) => {
    const par = stagedPairs[index];
    if (!par) return;
    setSelectedAntigoId(par.antigo.cd_registro);
    setSelectedNovoId(par.novo.cd_registro);
    setStagedPairs(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handler para salvar todos os pares no banco (Merge)
  const handleSalvarMerge = async () => {
    if (stagedPairs.length === 0) return;

    const confirmou = window.confirm(
      `Tem certeza que deseja salvar o planejamento (MERGE) de ${stagedPairs.length} par(es) mapeado(s)?\n\nEssa ação irá vincular os patrimônios no banco de dados.`
    );
    if (!confirmou) return;

    setErro(null);
    setSucessoMsg(null);

    const newMergedIds = stagedPairs.map(p => p.antigo.cd_registro);

    const payloadPares: ParMerge[] = stagedPairs.map(p => ({
      reg_key_antigo: p.antigo.cd_registro,
      cd_registro_novo: p.novo.cd_registro,
    }));

    try {
      const res = await vincularPares(payloadPares);
      setSucessoMsg(res.mensagem || 'Planejamento salvo com sucesso!');
      
      // Marca permanentemente os antigos vinculados para não reaparecerem na lista De
      setMergedAntigoIds(prev => {
        const next = new Set(prev);
        newMergedIds.forEach(id => next.add(id));
        return next;
      });

      setStagedPairs([]);
      // Recarrega antigos e planejados do setor
      if (cdSetor) {
        const updated = await listarEquipamentosApi({ cd_setor: cdSetor, limit: 200 });
        setEquipamentosAntigos(updated.itens || []);
        fetchPlanejadosPorSetor(cdSetor);
      }
    } catch (err: any) {
      console.error('Erro ao executar MERGE:', err);
      const msg = err?.response?.data?.detail || err?.message || 'Falha ao salvar planejamento no banco de dados.';
      setErro(msg);
    }
  };

  // Carrega planejados sempre que abre a modal ou troca de setor
  const handleAbrirModalVinculos = () => {
    if (cdSetor) {
      fetchPlanejadosPorSetor(cdSetor);
    }
    setIsModalVinculosOpen(true);
  };

  const planejadosFiltradosModal = useMemo(() => {
    if (!searchModalVinculos.trim()) return planejados;
    const term = searchModalVinculos.toLowerCase();
    return planejados.filter(p => (
      p.cd_patrimonio_antigo.toLowerCase().includes(term) ||
      p.cd_patrimonio_novo.toLowerCase().includes(term) ||
      (p.cd_serie_novo && p.cd_serie_novo.toLowerCase().includes(term)) ||
      (p.cd_mac_novo && p.cd_mac_novo.toLowerCase().includes(term)) ||
      (p.local_especifico && p.local_especifico.toLowerCase().includes(term))
    ));
  }, [planejados, searchModalVinculos]);

  // Importar planilha Excel/CSV de estoque novo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErro(null);
    setSucessoMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      const importItems: NovoEquipamentoImport[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // ignora cabeçalho
        const patrimonio = row.getCell(1).text?.toString().trim();
        const serie = row.getCell(2).text?.toString().trim();
        const mac = row.getCell(3).text?.toString().trim();

        if (patrimonio) {
          importItems.push({
            cd_patrimonio: patrimonio,
            cd_serie: serie || undefined,
            cd_mac: mac || undefined,
            ano_rollout: 2026,
          });
        }
      });

      if (importItems.length === 0) {
        setErro('Nenhum item válido encontrado na primeira aba da planilha.');
        return;
      }

      const res = await importarNovos(importItems);
      setSucessoMsg(res.mensagem);
    } catch (err: any) {
      setErro('Erro ao ler planilha de importação. Certifique-se de que é um arquivo .xlsx válido.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior de Ações */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-[280px]">
          <div className="p-2.5 bg-teal-50 rounded-xl text-[#008B95]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Selecione o Setor do Rollout</h3>
            <p className="text-xs text-slate-500">Escolha o setor para mapear o De/Para dos equipamentos</p>
          </div>
        </div>

        <div className="w-full md:w-80">
          <SetorAutocomplete
            value={cdSetor}
            onChange={(val) => setCdSetor(val)}
            placeholder="Selecione o setor alvo..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAbrirModalVinculos}
            className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-[#008B95] font-semibold text-xs rounded-xl transition-all flex items-center gap-2 border border-teal-200"
            title="Visualizar Vínculos Salvos no Banco"
          >
            <Menu className="w-4 h-4 text-[#008B95]" />
            <span>Vínculos Salvos</span>
            {planejados.length > 0 && (
              <span className="bg-[#008B95] text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                {planejados.length}
              </span>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-200"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            Importar Estoque Novo (Excel)
          </button>

          <button
            type="button"
            onClick={fetchDisponiveis}
            disabled={loadingDisponiveis}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            title="Atualizar Estoque Disponível"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDisponiveis ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alertas */}
      {erro && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucessoMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* Painel Duplo de Seleção De / Para */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Equipamentos Antigos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-600" />
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Equipamentos Antigos (Setor)
              </h4>
            </div>
            <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2.5 py-0.5 rounded-full">
              {antigosFiltrados.length} disponíveis
            </span>
          </div>

          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#008B95]"
                placeholder="Buscar antigo por patrimônio ou local..."
                value={searchAntigos}
                onChange={e => setSearchAntigos(e.target.value)}
              />
            </div>
          </div>

          <div className="h-72 overflow-y-auto divide-y divide-slate-100">
            {!cdSetor ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Selecione um setor no topo para carregar os equipamentos instalados.
              </div>
            ) : loadingAntigos ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#008B95]" />
                Carregando equipamentos do setor...
              </div>
            ) : antigosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum equipamento antigo disponível neste setor.
              </div>
            ) : (
              antigosFiltrados.map(item => {
                const isSelected = selectedAntigoId === item.cd_registro;
                return (
                  <div
                    key={item.cd_registro}
                    onClick={() => setSelectedAntigoId(isSelected ? null : item.cd_registro)}
                    className={`p-3 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-amber-50 border-l-4 border-amber-500 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-slate-800 font-semibold">{item.cd_patrimonio}</p>
                      <p className="text-slate-500 text-[11px]">{item.local_especifico || 'Sem local especificado'}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {item.tipo_maquina || 'SLIM'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lado Direito: Equipamentos Novos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#008B95]" />
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                2. Equipamentos Novos (Estoque Livre)
              </h4>
            </div>
            <span className="text-xs bg-teal-100 text-teal-800 font-medium px-2.5 py-0.5 rounded-full">
              {novosFiltrados.length} disponíveis
            </span>
          </div>

          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#008B95]"
                placeholder="Buscar novo por patrimônio, série ou MAC..."
                value={searchNovos}
                onChange={e => setSearchNovos(e.target.value)}
              />
            </div>
          </div>

          <div className="h-72 overflow-y-auto divide-y divide-slate-100">
            {loadingDisponiveis ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#008B95]" />
                Carregando estoque novo...
              </div>
            ) : novosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum equipamento novo disponível no estoque. Importe via planilha acima.
              </div>
            ) : (
              novosFiltrados.map(item => {
                const isSelected = selectedNovoId === item.cd_registro;
                return (
                  <div
                    key={item.cd_registro}
                    onClick={() => setSelectedNovoId(isSelected ? null : item.cd_registro)}
                    className={`p-3 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-teal-50 border-l-4 border-[#008B95] font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-slate-800 font-semibold">{item.cd_patrimonio}</p>
                      <p className="text-slate-500 text-[11px]">
                        N/S: {item.cd_serie || 'N/A'} | MAC: {item.cd_mac || 'N/A'}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold">
                      NOVO
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Botão Central de Pareamento */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleParear}
          disabled={!selectedAntigoId || !selectedNovoId}
          className={`px-6 py-3 rounded-xl font-semibold text-xs transition-all shadow-md flex items-center gap-2 ${
            selectedAntigoId && selectedNovoId
              ? 'bg-[#008B95] hover:bg-[#00747d] text-white shadow-teal-500/20 scale-105'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>VINCULAR PAREAMENTO SELECIONADO</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabela de Pares Mapeados (Rascunho Staging) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              3. Pares Mapeados em Rascunho ({stagedPairs.length})
            </h4>
            <p className="text-[11px] text-slate-500">
              Confira os vínculos criados antes de salvar definitivamente o planejamento no banco.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSalvarMerge}
            disabled={stagedPairs.length === 0 || submitting}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
              stagedPairs.length > 0 && !submitting
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            SALVAR PLANEJAMENTO (MERGE)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Equipamento Antigo (Devolução)</th>
                <th className="p-3 text-center">→</th>
                <th className="p-3">Equipamento Novo (Entrega)</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stagedPairs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                    Nenhum par mapeado ainda. Selecione um item antigo à esquerda, um novo à direita e clique em "Vincular Pareamento".
                  </td>
                </tr>
              ) : (
                stagedPairs.map((par, index) => (
                  <tr key={index} className="hover:bg-slate-50/80">
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{par.antigo.cd_patrimonio}</p>
                      <p className="text-slate-500 text-[11px]">{par.antigo.local_especifico || '-'}</p>
                    </td>
                    <td className="p-3 text-center text-slate-400 font-bold">→</td>
                    <td className="p-3">
                      <p className="font-bold text-teal-800">{par.novo.cd_patrimonio}</p>
                      <p className="text-slate-500 text-[11px]">
                        N/S: {par.novo.cd_serie || '-'} | MAC: {par.novo.cd_mac || '-'}
                      </p>
                    </td>
                    <td className="p-3 text-right flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditarPar(index)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar par (recolocar na seleção)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoverPar(index)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir par"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção 4: Relatórios e Termos PDF */}
      <div className="pt-6 border-t border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-[#008B95]" />
          4. Emissão de Termos & Visualização do PDF
        </h3>
        <RelatorioEquipamentosView
          hideFiltros={true}
          equipamentosDevolucaoOverride={listDevolucaoPdf}
          equipamentosEntregaOverride={listEntregaPdf}
          customSetor={cdSetor}
        />
      </div>

      {/* Modal / Gaveta Expansível de Vínculos Já Salvos no Banco (Merge Concluído) */}
      {isModalVinculosOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-in">
            {/* Header do Modal */}
            <div className="p-4 border-b border-slate-100 bg-[#F0F9FA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-[#008B95] rounded-xl">
                  <Menu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Vínculos Mapeados e Salvos no Banco (MERGE)</h3>
                  <p className="text-xs text-slate-500">
                    {cdSetor ? `Setor selecionado: ${cdSetor}` : 'Exibindo todos os registros de vínculos salvos'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalVinculosOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Busca Rápida no Modal */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por patrimônio antigo, novo, série ou MAC..."
                  value={searchModalVinculos}
                  onChange={e => setSearchModalVinculos(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#008B95] focus:ring-2 focus:ring-teal-100 transition-all font-semibold"
                />
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Total: <strong className="text-slate-800">{planejadosFiltradosModal.length}</strong> vínculo(s)
              </div>
            </div>

            {/* Conteúdo / Tabela do Modal */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingPlanejados ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 text-xs">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#008B95]" />
                  Carregando vínculos salvos do setor...
                </div>
              ) : planejadosFiltradosModal.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 text-xs">
                  <Layers className="w-10 h-10 stroke-1 text-slate-300" />
                  <span>Nenhum vínculo salvo encontrado {cdSetor ? `para o setor "${cdSetor}"` : ''}.</span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Equipamento Antigo (Devolução)</th>
                        <th className="p-3 text-center">→</th>
                        <th className="p-3">Equipamento Novo (Entrega)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {planejadosFiltradosModal.map((item, idx) => (
                        <tr key={`${item.cd_registro_antigo}-${item.cd_registro_novo}`} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{item.cd_patrimonio_antigo}</p>
                            <p className="text-slate-500 text-[11px]">{item.local_especifico || 'Sem local registrado'}</p>
                          </td>
                          <td className="p-3 text-center text-slate-400 font-bold">→</td>
                          <td className="p-3">
                            <p className="font-bold text-teal-800">{item.cd_patrimonio_novo}</p>
                            <p className="text-slate-500 text-[11px]">
                              N/S: {item.cd_serie_novo || 'N/A'} | MAC: {item.cd_mac_novo || 'N/A'}
                            </p>
                          </td>
                          <td className="p-3 text-center">
                            {item.st_utilizado_novo === 'P' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                                Planejado (P)
                              </span>
                            )}
                            {item.st_utilizado_novo === 'S' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                Substituído (S)
                              </span>
                            )}
                            {item.st_utilizado_novo === 'N' && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-extrabold text-[10px]">
                                Disponível (N)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalVinculosOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

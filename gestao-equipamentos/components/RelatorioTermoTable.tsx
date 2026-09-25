import React from 'react';
import { Download, Check, X } from 'lucide-react';
import type { RegistroDevolucao } from '../types/devolucoes';

interface RelatorioTermoTableProps {
  registro: RegistroDevolucao;
  onExportarCSV: () => void;
}

const Badge: React.FC<{ value?: string }> = ({ value }) => {
  const isS = value === 'S';
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${
        isS
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-rose-50 text-rose-700 border-rose-300'
      }`}
    >
      {isS ? <Check size={11} className="stroke-[3]" /> : <X size={11} className="stroke-[3]" />}
      <span>{isS ? 'S' : 'N'}</span>
    </span>
  );
};

export const RelatorioTermoTable: React.FC<RelatorioTermoTableProps> = ({
  registro,
  onExportarCSV,
}) => {
  return (
    <section className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 no-print space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Itens Cadastrados na Folha {registro.folha} ({registro.setor})
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total: <strong className="text-slate-900 font-bold">{registro.equipamentos.length}</strong>{' '}
            equipamento(s) listado(s)
          </p>
        </div>
        <button
          type="button"
          onClick={onExportarCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-[#F0F9FA] text-teal-800 hover:text-teal-900 text-xs font-bold rounded-xl border border-teal-200 transition-all shadow-xs self-start sm:self-auto"
        >
          <Download size={14} className="text-[#008B95]" />
          <span>Exportar Planilha (.csv)</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-inner">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <th className="px-3.5 py-3">Nº Série</th>
              <th className="px-3.5 py-3">Pat. Contratada</th>
              <th className="px-3.5 py-3">Modelo</th>
              <th className="px-3.5 py-3">Nº IP</th>
              <th className="px-3.5 py-3">MAC Address</th>
              <th className="px-3.5 py-3">Local Específico</th>
              <th className="px-3.5 py-3 text-center">Energia</th>
              <th className="px-3.5 py-3 text-center">USB</th>
              <th className="px-3.5 py-3 text-center">Teclado</th>
              <th className="px-3.5 py-3 text-center">Mouse</th>
              <th className="px-3.5 py-3 text-center">Monitor</th>
              <th className="px-3.5 py-3 text-center">Status S/N</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registro.equipamentos.map((eq, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{eq.nrSerie}</td>
                <td className="px-3.5 py-2.5 font-mono text-slate-700">{eq.numEqpto}</td>
                <td className="px-3.5 py-2.5 font-medium text-slate-800">{eq.modelo}</td>
                <td className="px-3.5 py-2.5 font-mono text-slate-600">{eq.nrIp || '-'}</td>
                <td className="px-3.5 py-2.5 font-mono text-slate-600">{eq.macAddress || '-'}</td>
                <td className="px-3.5 py-2.5 text-slate-700">{eq.localEspecifico || '-'}</td>
                <td className="px-3.5 py-2.5 text-center">
                  <Badge value={eq.caboEnergia} />
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <Badge value={eq.caboUsb} />
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <Badge value={eq.teclado === 'S' ? 'S' : 'N'} />
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <Badge value={eq.mouse === 'S' ? 'S' : 'N'} />
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <Badge value={eq.monitor === 'S' ? 'S' : 'N'} />
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <Badge value={eq.snDevolvida} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

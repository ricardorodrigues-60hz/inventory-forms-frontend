import React from 'react';
import type { RegistroDevolucao, DocOperation, DocTemplate, ParametrosTermo } from '../types/devolucoes';

interface RelatorioTermoA4Props {
  registro: RegistroDevolucao;
  docOperation: DocOperation;
  docTemplate?: DocTemplate;
  parametros: ParametrosTermo;
}

export const RelatorioTermoA4: React.FC<RelatorioTermoA4Props> = ({
  registro,
  docOperation,
  parametros,
}) => {
  return (
    <div className="print-paper bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-10 max-w-[840px] mx-auto text-black text-sm shadow-2xl font-sans">
      {/* Topo do documento oficial com Logo HC FMB */}
      <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center select-none shrink-0">
          <img
            src="/hcescritorio/logo-hcfmb.png"
            alt="Logo HC FMB"
            className="h-14 md:h-16 w-auto object-contain"
            onError={(e) => {
              // Fallback caso acesse diretamente pela raiz
              (e.currentTarget as HTMLImageElement).src = '/logo-hcfmb.png';
            }}
          />
        </div>
        <div className="flex-1 text-center">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 uppercase tracking-tight leading-tight">
            REGISTRO DE {docOperation.toUpperCase()} DE COMPUTADORES E PERIFÉRICOS
          </h2>
        </div>
      </div>

      {/* Declaração inicial do topo */}
      <div className="text-[13px] leading-relaxed text-slate-900 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-300">
        Declaro que em <strong>{parametros.docData}</strong> foi(ram){' '}
        {docOperation === 'entrega'
          ? 'entregue(s) o(s) computador(es) e periférico(s)'
          : 'devolvido(s) o(s) computador(es) e periférico(s)'}{' '}
        descrito(s) abaixo conforme especificação técnica publicada no edital de pregão eletrônico:{' '}
        <strong>{parametros.docEdital}</strong>, processo SEI nº <strong>{parametros.docSei}</strong> que
        originou o contrato <strong>{parametros.docContrato}</strong> com a empresa{' '}
        <strong>{parametros.docEmpresa}</strong>.
      </div>

      {/* ── TABELA OFICIAL DE EQUIPAMENTOS ── */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-xs text-center border border-slate-900">
          <thead className="print-thead">
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-[11px]">
              <th className="border border-slate-900 px-2.5 py-2">Nr. IP</th>
              <th className="border border-slate-900 px-2.5 py-2">Nr. Série</th>
              <th className="border border-slate-900 px-2.5 py-2">Pat. Contratada</th>
              <th className="border border-slate-900 px-2.5 py-2">Mac Address</th>
              <th className="border border-slate-900 px-2.5 py-2">Teclado</th>
              <th className="border border-slate-900 px-2.5 py-2">Mouse</th>
              <th className="border border-slate-900 px-2.5 py-2">Monitor</th>
              <th className="border border-slate-900 px-2.5 py-2">Local Específico</th>
            </tr>
          </thead>
          <tbody>
            {registro.equipamentos.map((eq, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="border border-slate-900 px-2.5 py-2 font-mono font-semibold text-slate-800">
                  {eq.nrIp || '-'}
                </td>
                <td className="border border-slate-900 px-2.5 py-2 font-bold text-slate-900">
                  {eq.nrSerie || '-'}
                </td>
                <td className="border border-slate-900 px-2.5 py-2 font-medium">
                  {eq.numEqpto || '-'}
                </td>
                <td className="border border-slate-900 px-2.5 py-2 font-mono text-[11px] text-slate-700">
                  {eq.macAddress || '-'}
                </td>
                <td className="border border-slate-900 px-2.5 py-2 font-bold text-slate-900">
                  {eq.teclado === 'S' ? 'S' : 'N'}
                </td>
                <td className="border border-slate-900 px-2.5 py-2 font-bold text-slate-900">
                  {eq.mouse === 'S' ? 'S' : 'N'}
                </td>
                <td className="border border-slate-900 px-2.5 py-2 font-bold text-slate-900">
                  {eq.monitor === 'S' ? 'S' : 'N'}
                </td>
                <td className="border border-slate-900 px-2.5 py-2 text-left font-medium text-slate-800">
                  {eq.localEspecifico || registro.setor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Declaração de Fechamento (Liberado / Recebido) */}
      <div className="text-[13px] leading-relaxed text-slate-900 my-6 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-300">
        {docOperation === 'entrega' ? (
          <>
            Declaro como recebido na área: <strong>{registro.setor}</strong> os computadores e periféricos
            descritos acima em perfeitas condições de uso.
          </>
        ) : (
          <>
            Declaro como liberado na área: <strong>{registro.setor}</strong> os equipamentos descritos e
            assinalados [S] acima em perfeitas condições de uso.
          </>
        )}
      </div>

      {/* Bloco de Assinaturas */}
      <div className="pt-8 space-y-12 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <div className="border-t-2 border-slate-900 pt-2" />
            <p className="text-[10px] font-bold uppercase tracking-tight text-slate-800">
              Nome/Assinatura técnico {parametros.docEmpresa || 'COMTECH'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="border-t-2 border-slate-900 pt-2" />
            <p className="text-[10px] font-bold uppercase tracking-tight text-slate-800">
              Nome/Assinatura responsável pelo setor – complexo HCFMB
            </p>
          </div>

          <div className="space-y-1">
            <div className="border-t-2 border-slate-900 pt-2" />
            <p className="text-[10px] font-bold uppercase tracking-tight text-slate-800">
              Nome/Assinatura técnico CIMED
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé da folha */}
      <div className="flex justify-between items-center border-t border-slate-300 pt-3 text-[10px] text-slate-600 font-medium">
        <span>
          Edital {parametros.docEdital} &nbsp;•&nbsp; Contrato {parametros.docContrato} ({parametros.docEmpresa}) &nbsp;•&nbsp; Setor:{' '}
          <strong>{registro.setor}</strong>
        </span>
        <span>
          Folha <strong>{registro.folha}</strong> | Página {registro.pagina}
        </span>
      </div>
    </div>
  );
};

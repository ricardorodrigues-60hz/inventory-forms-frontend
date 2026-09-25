import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QrCode, Save, CheckCircle, AlertCircle, RefreshCw, X, Laptop, Search } from 'lucide-react';
import type { TipoMaquina, Equipamento, EquipamentoCreatePayload, EquipamentoUpdatePayload } from '../types/equipamento';
import { BarcodeScanner } from './BarcodeScanner';
import { SetorAutocomplete } from './SetorAutocomplete';
import { consultarPatrimonioApi } from '../services/equipamentosApi';

const schema = z.object({
  cd_patrimonio: z
    .string()
    .min(1, 'Informe o código do patrimônio')
    .max(6, 'O patrimônio deve ter no máximo 6 dígitos')
    .regex(/^\d+$/, 'O patrimônio deve conter apenas números'),
  cd_setor: z.string().min(1, 'Selecione um setor válido'),
  local_especifico: z.string().optional(),
  tipo_maquina: z.enum(['SLIM', 'MASTER'], {
    message: 'Selecione o tipo da máquina'
  }),
  observacao: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface EquipamentoFormProps {
  onSubmit: (data: EquipamentoCreatePayload) => Promise<{ offline: boolean; mensagem: string }>;
  onEditarSubmit?: (cd_registro: number, payload: EquipamentoUpdatePayload) => Promise<any>;
  itemEmEdicao?: Equipamento | null;
  onCancelarEdicao?: () => void;
  onSuccessCallback?: () => void;
}

export const EquipamentoForm: React.FC<EquipamentoFormProps> = ({
  onSubmit,
  onEditarSubmit,
  itemEmEdicao,
  onCancelarEdicao,
  onSuccessCallback
}) => {
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSearchingPatrimonio, setIsSearchingPatrimonio] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cd_patrimonio: '',
      cd_setor: '',
      local_especifico: '',
      tipo_maquina: '' as any,
      observacao: ''
    }
  });

  const watchPatrimonio = watch('cd_patrimonio');
  const [autoSetorPatrimonio, setAutoSetorPatrimonio] = useState<string | null>(null);

  const executarBuscaPatrimonio = async (codigoRaw: string) => {
    const limpo = (codigoRaw || '').replace(/\D/g, '');
    if (!limpo || itemEmEdicao) return;

    try {
      setIsSearchingPatrimonio(true);
      const res = await consultarPatrimonioApi(limpo);
      if (res && res.cd_setor) {
        const novoSetor = String(res.cd_setor);
        const currentSetor = watch('cd_setor');
        if (!currentSetor || currentSetor === autoSetorPatrimonio) {
          setValue('cd_setor', novoSetor, { shouldValidate: true });
          setAutoSetorPatrimonio(novoSetor);
        }
      }
    } catch {
      // Silencioso se não encontrar no contrato
    } finally {
      setIsSearchingPatrimonio(false);
    }
  };

  // Efeito para auto-preencher o setor quando o patrimônio tiver pelo menos 3 dígitos com pausa na digitação
  useEffect(() => {
    const limpo = (watchPatrimonio || '').replace(/\D/g, '');
    
    if (!limpo || limpo.length < 3) {
      return;
    }

    if (limpo && limpo.length >= 3 && !itemEmEdicao) {
      let isMounted = true;
      const timer = setTimeout(() => {
        if (isMounted) {
          executarBuscaPatrimonio(watchPatrimonio);
        }
      }, 800);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [watchPatrimonio, itemEmEdicao]);

  useEffect(() => {
    if (itemEmEdicao) {
      reset({
        cd_patrimonio: String(itemEmEdicao.cd_patrimonio || ''),
        cd_setor: String(itemEmEdicao.cd_setor || ''),
        local_especifico: itemEmEdicao.local_especifico || '',
        tipo_maquina: itemEmEdicao.tipo_maquina || ('' as any),
        observacao: itemEmEdicao.observacao || ''
      });
      setFeedback(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      reset({
        cd_patrimonio: '',
        cd_setor: '',
        local_especifico: '',
        tipo_maquina: '' as any,
        observacao: ''
      });
    }
  }, [itemEmEdicao, reset]);

  useEffect(() => {
    if (feedback && feedback.tipo === 'sucesso') {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleScanCode = (codigo: string) => {
    const limpo = codigo.replace(/\D/g, '').slice(0, 6);
    if (limpo) {
      setValue('cd_patrimonio', limpo, { shouldValidate: true });
      setShowScanner(false);
      setFeedback({ tipo: 'sucesso', texto: `Código lido: ${limpo}` });
      executarBuscaPatrimonio(limpo);
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setFeedback(null);

    const patrimonioLimpo = data.cd_patrimonio.replace(/\D/g, '') || '0';

    try {
      if (itemEmEdicao && onEditarSubmit) {
        await onEditarSubmit(itemEmEdicao.cd_registro, {
          cd_patrimonio: patrimonioLimpo,
          cd_setor: data.cd_setor,
          local_especifico: data.local_especifico || null,
          tipo_maquina: data.tipo_maquina as TipoMaquina,
          observacao: data.observacao || null
        });
        setFeedback({ tipo: 'sucesso', texto: 'Equipamento editado com sucesso!' });
        const setorAtual = data.cd_setor;
        reset({
          cd_patrimonio: '',
          cd_setor: setorAtual,
          local_especifico: '',
          tipo_maquina: '' as any,
          observacao: ''
        });
        if (onCancelarEdicao) onCancelarEdicao();
      } else {
        const res = await onSubmit({
          cd_patrimonio: data.cd_patrimonio,
          cd_setor: data.cd_setor,
          local_especifico: data.local_especifico || null,
          tipo_maquina: data.tipo_maquina as TipoMaquina,
          observacao: data.observacao || null
        });

        const setorAtual = data.cd_setor;
        setFeedback({ tipo: 'sucesso', texto: res.mensagem });
        reset({
          cd_patrimonio: '',
          cd_setor: setorAtual,
          local_especifico: '',
          tipo_maquina: '' as any,
          observacao: ''
        });
      }

      if (onSuccessCallback) onSuccessCallback();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err.message || 'Erro ao salvar equipamento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm p-5 sm:p-7 space-y-6 ${itemEmEdicao
        ? 'border-amber-400 ring-2 ring-amber-100/50 bg-amber-50/5'
        : 'border-teal-200/80'
      }`}>
      {itemEmEdicao && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
          <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          <span>Atenção: Você está editando um registro existente. As alterações afetarão o patrimônio {itemEmEdicao.cd_patrimonio}.</span>
        </div>
      )}

      {/* Header do Card */}
      <div className="flex items-center justify-between border-b border-teal-100/80 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#008B95]">
            {itemEmEdicao ? 'Modo de Edição' : 'Inventário Positivo'}
          </span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {itemEmEdicao ? `Editar Patrimônio #${itemEmEdicao.cd_patrimonio}` : 'Cadastro de Equipamento'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {itemEmEdicao
              ? 'Altere os campos necessários e salve as alterações.'
              : 'Preencha os dados do equipamento Positivo a ser registrado.'}
          </p>
        </div>

        {itemEmEdicao && onCancelarEdicao && (
          <button
            type="button"
            onClick={onCancelarEdicao}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Cancelar edição"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Leitor de Câmera em Modal/Painel */}
      {showScanner && (
        <div className="animate-fadeIn">
          <BarcodeScanner
            onScanSuccess={handleScanCode}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-medium border ${feedback.tipo === 'sucesso'
              ? 'bg-teal-50/80 text-teal-800 border-teal-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
        >
          {feedback.tipo === 'sucesso' ? (
            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Código do Patrimônio com botão de câmera embutido */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nº Patrimônio Positivo *
            </label>
            <span className="text-[11px] text-teal-600 font-medium">Digitalização ou manual</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Digite ou escaneie a etiqueta"
              {...register('cd_patrimonio', {
                onChange: (e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  e.target.value = cleaned.slice(0, 6);
                }
              })}
              className={`flex-1 px-4 py-2.5 text-sm font-mono tracking-wider rounded-xl border bg-slate-50/50 focus:bg-white transition-all outline-none ${errors.cd_patrimonio
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-[#008B95] focus:ring-2 focus:ring-[#008B95]/10'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              title="Abrir Câmera"
              className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border transition-all shadow-xs ${showScanner
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-teal-50 text-[#008B95] border-teal-200 hover:border-[#008B95] hover:bg-[#F0F9FA]'
                }`}
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
          {errors.cd_patrimonio && (
            <p className="text-rose-600 text-xs mt-1">{errors.cd_patrimonio.message}</p>
          )}
        </div>

        {/* Setor e Local Específico em 2 Colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Setor *
            </label>
            <SetorAutocomplete
              value={register('cd_setor').name ? (watch('cd_setor') || '') : ''}
              onChange={(val) => setValue('cd_setor', val, { shouldValidate: true })}
              error={errors.cd_setor?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Local Específico
            </label>
            <input
              type="text"
              placeholder="Ex: Sala 203, Mesa 4..."
              {...register('local_especifico')}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-[#008B95] focus:ring-2 focus:ring-[#008B95]/10 transition-all outline-none"
            />
          </div>
        </div>

        {/* Tipo da Máquina (Pills estilizadas) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tipo de Máquina *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative flex items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-teal-300 has-[:checked]:border-[#008B95] has-[:checked]:bg-[#008B95] has-[:checked]:text-white transition-all shadow-2xs">
              <input
                type="radio"
                value="SLIM"
                {...register('tipo_maquina')}
                className="sr-only"
              />
              <div className="text-center">
                <span className="text-xs font-bold block">SLIM</span>
                <span className="text-[10px] opacity-80 block">Modelo Compacto</span>
              </div>
            </label>

            <label className="relative flex items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-teal-300 has-[:checked]:border-[#008B95] has-[:checked]:bg-[#008B95] has-[:checked]:text-white transition-all shadow-2xs">
              <input
                type="radio"
                value="MASTER"
                {...register('tipo_maquina')}
                className="sr-only"
              />
              <div className="text-center">
                <span className="text-xs font-bold block">MASTER</span>
                <span className="text-[10px] opacity-80 block">Modelo Expansível</span>
              </div>
            </label>
          </div>
          {errors.tipo_maquina && (
            <p className="text-rose-600 text-xs mt-1">{errors.tipo_maquina.message}</p>
          )}
        </div>

        {/* Observação */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Observação
          </label>
          <textarea
            rows={3}
            placeholder="Informações adicionais..."
            {...register('observacao')}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-[#008B95] focus:ring-2 focus:ring-[#008B95]/10 transition-all outline-none resize-none"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-2">
          {itemEmEdicao && onCancelarEdicao && (
            <button
              type="button"
              onClick={onCancelarEdicao}
              className="flex-1 py-3 px-4 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl text-white bg-[#008B95] hover:bg-[#00767e] active:bg-[#006269] transition-colors shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{itemEmEdicao ? 'Salvar Alterações' : 'Registrar Equipamento'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import type { SetorOption } from '../types/equipamento';
import { obterSetoresApi } from '../services/equipamentosApi';
import { useRepository } from '../../../offline/useRepository';

interface SetorAutocompleteProps {
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export const SetorAutocomplete: React.FC<SetorAutocompleteProps> = ({ value, onChange, error, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<SetorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { fetchData } = useRepository(38);

  // Carrega setores da API com buffer offline do IndexedDB (TTL: 24 horas)
  useEffect(() => {
    let isMounted = true;
    const fetchSetores = async () => {
      setLoading(true);
      try {
        const result = await fetchData<SetorOption[]>(
          'setores',
          () => obterSetoresApi(),
          { ttl: 24 * 60 * 60 } // 24 horas
        );
        if (isMounted && result?.data) {
          setOptions(result.data);
        }
      } catch (err) {
        console.error('Erro ao carregar setores no SetorAutocomplete:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchSetores();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.cd_setor.toString() === value?.toString());

  return (
    <div ref={wrapperRef} className={`relative w-full ${isOpen ? 'z-20' : ''}`}>
      <div 
        className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-slate-50/50 transition-all flex items-center justify-between cursor-pointer ${
          error
            ? 'border-rose-400 focus-within:ring-2 focus-within:ring-rose-100'
            : 'border-slate-300 focus-within:border-[#008B95] focus-within:ring-2 focus-within:ring-[#008B95]/10 hover:border-slate-400'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder || 'Selecione um setor...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#008B95] transition-colors"
                placeholder="Pesquisar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500">Carregando setores...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">Nenhum setor encontrado</div>
            ) : (
              <ul className="py-1">
                {filteredOptions.map((option) => (
                  <li
                    key={option.cd_setor}
                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 ${
                      value?.toString() === option.cd_setor.toString() ? 'bg-teal-50 text-teal-900 font-medium' : 'text-slate-700'
                    }`}
                    onClick={() => {
                      onChange(option.cd_setor.toString());
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <span>{option.label}</span>
                    {value?.toString() === option.cd_setor.toString() && (
                      <Check className="w-4 h-4 text-teal-600" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-rose-600 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

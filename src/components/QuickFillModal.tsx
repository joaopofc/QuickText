import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sliders, Eye, RefreshCw, Calendar } from 'lucide-react';
import { Template } from '../types';
import { extractVariables, replaceVariables, isMultilineVariable } from '../utils/templateHelpers';

const isDateVariable = (name: string): boolean => {
  const normalized = name.toLowerCase();
  const dateKeywords = [
    'data', 'date', 'vencimento', 'nascimento', 'dia', 'prazo', 
    'periodo', 'admissao', 'demissao', 'validade', 'cadastro', 
    'pagamento', 'criado', 'agenda'
  ];
  return dateKeywords.some(keyword => normalized.includes(keyword));
};

const formatAsDateMask = (val: string): string => {
  // Remove all non-digits
  const digits = val.replace(/\D/g, '');
  const truncated = digits.slice(0, 8);
  
  if (truncated.length <= 2) {
    return truncated;
  } else if (truncated.length <= 4) {
    return `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
  } else {
    return `${truncated.slice(0, 2)}/${truncated.slice(2, 4)}/${truncated.slice(4)}`;
  }
};

interface QuickFillModalProps {
  template: Template | null;
  onClose: () => void;
  onCopy: (id: string, text: string) => void;
}

export default function QuickFillModal({ template, onClose, onCopy }: QuickFillModalProps) {
  const [copied, setCopied] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      const extracted = extractVariables(template.content);
      setVariables(extracted);
      const initialValues: Record<string, string> = {};
      extracted.forEach(v => {
        initialValues[v] = '';
      });
      setValues(initialValues);
      setCopied(false);

      // Auto focus the first variable input for lightning-fast typing
      setTimeout(() => {
        if (extracted.length > 0) {
          const firstInput = document.getElementById(`modal-input-${extracted[0]}`);
          if (firstInput) {
            (firstInput as HTMLInputElement).focus();
          }
        }
      }, 100);
    }
  }, [template]);

  if (!template) return null;

  const resolvedContent = replaceVariables(template.content, values);

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedContent).then(() => {
      setCopied(true);
      onCopy(template.id, resolvedContent);
      setTimeout(() => {
        setCopied(false);
        onClose(); // Auto-close to keep it rapid
      }, 1500);
    });
  };

  const handleInputChange = (varName: string, val: string) => {
    setValues(prev => ({
      ...prev,
      [varName]: val
    }));
  };

  const handleClear = () => {
    const cleared: Record<string, string> = {};
    variables.forEach(v => {
      cleared[v] = '';
    });
    setValues(cleared);
  };

  // Render text with highlighted variables for live preview
  const renderLivePreview = () => {
    const parts = template.content.split(/(\{\{[^{}]+\}\}|\[\[[^[\]]+\]\])/g);
    return parts.map((part, index) => {
      if (!part) return null;
      const isCurly = part.startsWith('{{') && part.endsWith('}}');
      const isBracket = part.startsWith('[[') && part.endsWith(']]');
      
      if (isCurly || isBracket) {
        const varName = part.slice(2, -2).trim();
        const value = values[varName];
        return (
          <span
            key={index}
            className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-sm font-mono text-[11px] font-bold transition-all duration-150 ${
              value
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 animate-pulse'
            }`}
          >
            {value || varName}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      id="quick-fill-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="quick-fill-modal-content"
        className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-[#fafafa]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                {template.category}
              </span>
              <span className="text-[10px] font-mono text-gray-400 font-medium">MODO PREENCHIMENTO RÁPIDO</span>
            </div>
            <h3 className="font-sans font-bold text-gray-900 tracking-tight text-lg">
              {template.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Insira as informações abaixo para gerar a resposta instantaneamente.
            </p>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-black p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {variables.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: Form inputs */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                      <Sliders size={13} className="text-gray-500" />
                      Variáveis de Entrada
                    </span>
                    <button
                      id="modal-clear-vars"
                      onClick={handleClear}
                      className="text-gray-400 hover:text-black flex items-center gap-1 text-[10px] font-mono transition-colors"
                    >
                      <RefreshCw size={11} />
                      Limpar tudo
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                    {variables.map(varName => {
                      const isFilled = !!values[varName];
                      const isMultiline = template ? isMultilineVariable(template.content, varName) : false;
                      const presets = template?.variablePresets?.[varName] || [];
                      const isDate = isDateVariable(varName);

                      const handleDateInputChange = (valName: string, rawVal: string) => {
                        const hasLetters = /[a-zA-Z]/.test(rawVal);
                        if (hasLetters) {
                          handleInputChange(valName, rawVal);
                        } else {
                          const formatted = formatAsDateMask(rawVal);
                          handleInputChange(valName, formatted);
                        }
                      };

                      return (
                        <div key={varName} className="space-y-1.5 group">
                          <div className="flex justify-between items-center">
                            <label
                              htmlFor={`modal-input-${varName}`}
                              className="block text-xs font-semibold text-gray-700 font-mono"
                            >
                              {varName} {isMultiline && <span className="text-[10px] text-indigo-500 font-normal font-sans">(Grande)</span>}
                            </label>
                            <span className={`text-[10px] font-mono ${isFilled ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {isFilled ? 'Preenchido' : 'Pendente'}
                            </span>
                          </div>
                          
                          {isMultiline ? (
                            <textarea
                              id={`modal-input-${varName}`}
                              placeholder={`Inserir valor para ${varName}...`}
                              value={values[varName] || ''}
                              rows={3}
                              onChange={(e) => handleInputChange(varName, e.target.value)}
                              className="w-full px-3.5 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-2xs resize-y"
                            />
                          ) : (
                            <div className="relative flex items-center">
                              <input
                                id={`modal-input-${varName}`}
                                type="text"
                                placeholder={isDate ? 'DD/MM/AAAA ou texto...' : `Inserir valor para ${varName}...`}
                                value={values[varName] || ''}
                                onChange={(e) => {
                                  if (isDate) {
                                    handleDateInputChange(varName, e.target.value);
                                  } else {
                                    handleInputChange(varName, e.target.value);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCopy();
                                  }
                                }}
                                className={`w-full px-3.5 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-2xs ${
                                  isDate ? 'pr-10' : ''
                                }`}
                              />
                              {isDate && (
                                <div className="absolute right-2 flex items-center">
                                  <input
                                    type="date"
                                    id={`date-picker-${varName}`}
                                    className="sr-only"
                                    onChange={(e) => {
                                      const rawVal = e.target.value;
                                      if (rawVal) {
                                        const [year, month, day] = rawVal.split('-');
                                        const formattedDate = `${day}/${month}/${year}`;
                                        handleInputChange(varName, formattedDate);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const picker = document.getElementById(`date-picker-${varName}`) as HTMLInputElement;
                                      if (picker) {
                                        if (typeof picker.showPicker === 'function') {
                                          picker.showPicker();
                                        } else {
                                          picker.click();
                                        }
                                      }
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors cursor-pointer flex items-center justify-center"
                                    title="Escolher data no calendário"
                                  >
                                    <Calendar size={15} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick selection presets list if available */}
                          {presets.length > 0 && (
                            <div className="space-y-1">
                              <span className="block text-[10px] text-gray-400 font-mono">Sugestões rápidas:</span>
                              <div className="flex flex-wrap gap-1">
                                {presets.map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleInputChange(varName, preset)}
                                    className="px-2 py-0.5 text-[10px] text-gray-600 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 rounded transition-all duration-150 text-left font-sans truncate max-w-full"
                                    title={preset}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: High-fidelity document view */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                    <Eye size={13} className="text-gray-500" />
                    Visualização do Texto Final
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {Object.values(values).filter(Boolean).length} de {variables.length} preenchidas
                  </span>
                </div>

                <div className="bg-[#fcfcfd] border border-gray-200 rounded-xl p-5 font-sans text-xs text-gray-800 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto max-h-[50vh] min-h-[250px] shadow-inner relative">
                  {renderLivePreview()}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider font-mono pb-2 border-b border-gray-100">
                <Eye size={13} className="text-gray-500" />
                Conteúdo do Texto
              </div>
              <div className="bg-[#fcfcfd] p-5 rounded-xl border border-gray-200 font-sans text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto shadow-inner">
                {template.content}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#fafafa] flex items-center justify-end gap-3 shrink-0">
          <button
            id="modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-black bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-all duration-150"
          >
            Cancelar
          </button>
          
          <button
            id="modal-copy-btn"
            onClick={handleCopy}
            className={`px-6 py-2.5 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
              copied
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                : 'bg-black hover:bg-neutral-800 text-white border-black shadow-xs'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} className="animate-bounce" />
                <span>Copiado para Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar e Fechar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Sliders, Eye, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Template } from '../types';
import { extractVariables, replaceVariables, isMultilineVariable } from '../utils/templateHelpers';

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  
  // Day of week of the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = date.getDay();
  
  // Number of days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  // Previous month's days for padding
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year
    });
  }
  
  // Current month's days
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      month: month,
      year: year
    });
  }
  
  // Next month's days to complete grid (multiples of 7, e.g., 42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year
    });
  }
  
  return days;
};

const isToday = (day: number, month: number, year: number): boolean => {
  const today = new Date();
  return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
};

const isSelectedDate = (day: number, month: number, year: number, typedVal: string): boolean => {
  if (!typedVal) return false;
  const expectedStr = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
  return typedVal.trim() === expectedStr;
};

const getYearOptions = (currentYear: number) => {
  const years = new Set<number>();
  const start = new Date().getFullYear() - 30; // 30 years ago
  const end = new Date().getFullYear() + 10;   // 10 years in the future
  
  for (let y = start; y <= end; y++) {
    years.add(y);
  }
  years.add(currentYear); // Ensure user's selected/typed year is present
  return Array.from(years).sort((a, b) => a - b);
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
  const [activeCalendarVar, setActiveCalendarVar] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const lastEnterPressRef = useRef<{ time: number; varName: string | null }>({ time: 0, varName: null });

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

  const performCopy = (valsToCopy: Record<string, string>, shouldClose: boolean = true) => {
    const textToCopy = replaceVariables(template.content, valsToCopy);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      onCopy(template.id, textToCopy);
      if (shouldClose) {
        setTimeout(() => {
          setCopied(false);
          onClose(); // Auto-close to keep it rapid
        }, 1500);
      } else {
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      }
    });
  };

  const handleCopy = () => {
    performCopy(values, true);
  };

  const handleInputChange = (varName: string, val: string) => {
    setValues(prev => ({
      ...prev,
      [varName]: val
    }));
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, varName: string, isDate: boolean) => {
    if (e.key === 'Enter') {
      if (e.currentTarget.tagName === 'TEXTAREA' && e.shiftKey) {
        return;
      }
      e.preventDefault();
      
      const now = Date.now();
      const prevPress = lastEnterPressRef.current;
      const isDoublePress = prevPress.varName === varName && (now - prevPress.time < 350);
      
      // Update ref
      lastEnterPressRef.current = { time: now, varName };

      const nextValues = { ...values };
      if (isDate) {
        if (!nextValues[varName]?.trim()) {
          const today = new Date();
          const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
          nextValues[varName] = dateStr;
          setValues(prev => ({ ...prev, [varName]: dateStr }));
        }
      }

      const idx = variables.indexOf(varName);
      const isLastField = idx === variables.length - 1;

      if (!isLastField) {
        const nextVar = variables[idx + 1];
        setTimeout(() => {
          const nextElement = document.getElementById(`modal-input-${nextVar}`);
          if (nextElement) {
            nextElement.focus();
          }
        }, 50);
      } else {
        if (isDoublePress) {
          performCopy(nextValues, true);
        } else {
          performCopy(nextValues, false);
        }
      }
    }
  };

  const handlePresetSelect = (varName: string, presetVal: string) => {
    handleInputChange(varName, presetVal);
  };

  const handleToggleCalendar = (varName: string) => {
    if (activeCalendarVar === varName) {
      setActiveCalendarVar(null);
    } else {
      const currentVal = values[varName] || '';
      const dateParts = currentVal.split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month < 12 && year > 1900) {
          setCalendarMonth(month);
          setCalendarYear(year);
        } else {
          setCalendarMonth(new Date().getMonth());
          setCalendarYear(new Date().getFullYear());
        }
      } else {
        setCalendarMonth(new Date().getMonth());
        setCalendarYear(new Date().getFullYear());
      }
      setActiveCalendarVar(varName);
    }
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
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#fafafa]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                {template.category}
              </span>
              <span className="text-[10px] font-mono text-gray-400 font-medium">MODO PREENCHIMENTO RÁPIDO</span>
            </div>
            <h3 className="font-sans font-bold text-gray-900 tracking-tight text-base">
              {template.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Insira as informações abaixo para gerar a resposta instantaneamente.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="modal-cancel-btn-top"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-150 cursor-pointer"
            >
              Cancelar
            </button>
            
            <button
              id="modal-copy-btn-top"
              onClick={handleCopy}
              className={`px-5 py-2 rounded-lg font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                copied
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                  : 'bg-black hover:bg-neutral-800 text-white border-black shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} className="animate-bounce text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copiar e Fechar</span>
                </>
              )}
            </button>

            <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden md:block"></div>

            <button
              id="close-modal-btn"
              onClick={onClose}
              className="text-gray-400 hover:text-black p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              title="Fechar modal"
            >
              <X size={16} />
            </button>
          </div>
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
                              onKeyDown={(e) => handleFieldKeyDown(e, varName, isDate)}
                              className="w-full px-3.5 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-2xs resize-y"
                            />
                          ) : (
                            <div className="space-y-2">
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
                                  onKeyDown={(e) => handleFieldKeyDown(e, varName, isDate)}
                                  className={`w-full px-3.5 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-2xs ${
                                    isDate ? 'pr-10' : ''
                                  }`}
                                />
                                {isDate && (
                                  <div className="absolute right-2 flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCalendar(varName)}
                                      className={`p-1.5 rounded transition-colors cursor-pointer flex items-center justify-center ${
                                        activeCalendarVar === varName 
                                          ? 'bg-black text-white' 
                                          : 'hover:bg-gray-100 text-gray-400 hover:text-black'
                                      }`}
                                      title="Escolher data no calendário"
                                    >
                                      <Calendar size={15} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {isDate && activeCalendarVar === varName && (
                                <div className="bg-neutral-50 border border-gray-200/80 rounded-xl p-3.5 space-y-3 animate-in slide-in-from-top-1 fade-in duration-200 shadow-xs">
                                  {/* Month/Year selector header */}
                                  <div className="flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (calendarMonth === 0) {
                                          setCalendarMonth(11);
                                          setCalendarYear(prev => prev - 1);
                                        } else {
                                          setCalendarMonth(prev => prev - 1);
                                        }
                                      }}
                                      className="p-1 hover:bg-white border border-gray-100 rounded-md text-gray-500 hover:text-black transition-colors cursor-pointer"
                                    >
                                      <ChevronLeft size={14} />
                                    </button>
                                    
                                    <div className="flex items-center gap-1 bg-white border border-gray-200/60 px-1.5 py-0.5 rounded-md shadow-3xs">
                                      {/* Month Dropdown */}
                                      <select
                                        value={calendarMonth}
                                        onChange={(e) => setCalendarMonth(parseInt(e.target.value, 10))}
                                        className="bg-transparent text-xs font-bold text-gray-800 font-sans border-none focus:ring-0 focus:outline-hidden p-0.5 cursor-pointer rounded"
                                      >
                                        {MONTHS_PT.map((m, mIdx) => (
                                          <option key={mIdx} value={mIdx}>
                                            {m}
                                          </option>
                                        ))}
                                      </select>
                                      
                                      <span className="text-gray-300 text-xs font-semibold">|</span>

                                      {/* Year Dropdown */}
                                      <select
                                        value={calendarYear}
                                        onChange={(e) => setCalendarYear(parseInt(e.target.value, 10))}
                                        className="bg-transparent text-xs font-bold text-gray-800 font-sans border-none focus:ring-0 focus:outline-hidden p-0.5 cursor-pointer rounded"
                                      >
                                        {getYearOptions(calendarYear).map(year => (
                                          <option key={year} value={year}>
                                            {year}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (calendarMonth === 11) {
                                          setCalendarMonth(0);
                                          setCalendarYear(prev => prev + 1);
                                        } else {
                                          setCalendarMonth(prev => prev + 1);
                                        }
                                      }}
                                      className="p-1 hover:bg-white border border-gray-100 rounded-md text-gray-500 hover:text-black transition-colors cursor-pointer"
                                    >
                                      <ChevronRight size={14} />
                                    </button>
                                  </div>

                                  {/* Weekdays */}
                                  <div className="grid grid-cols-7 gap-1 text-center">
                                    {WEEKDAYS_PT.map(day => (
                                      <span key={day} className="text-[9px] font-bold text-gray-400 uppercase font-mono">
                                        {day}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Days Grid */}
                                  <div className="grid grid-cols-7 gap-1">
                                    {getDaysInMonth(calendarYear, calendarMonth).map((item, idx) => {
                                      const dateStr = `${String(item.day).padStart(2, '0')}/${String(item.month + 1).padStart(2, '0')}/${item.year}`;
                                      const isSel = values[varName] === dateStr;
                                      const isCurrentToday = isToday(item.day, item.month, item.year);
                                      
                                      return (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => {
                                            handleInputChange(varName, dateStr);
                                            setActiveCalendarVar(null); // auto-close on selection
                                          }}
                                          className={`h-7 text-xs font-sans font-medium rounded-md flex items-center justify-center transition-all cursor-pointer ${
                                            item.isCurrentMonth 
                                              ? isSel
                                                ? 'bg-black text-white font-semibold'
                                                : isCurrentToday
                                                  ? 'bg-neutral-200 text-black border border-gray-300 font-semibold'
                                                  : 'bg-white hover:bg-gray-150 text-gray-800 border border-gray-100'
                                              : 'text-gray-300 pointer-events-none'
                                          }`}
                                        >
                                          {item.day}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Quick helper buttons */}
                                  <div className="flex items-center justify-between pt-1 text-[10px] border-t border-gray-100 font-sans">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const today = new Date();
                                        const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
                                        handleInputChange(varName, dateStr);
                                        setActiveCalendarVar(null);
                                      }}
                                      className="text-black font-bold hover:underline cursor-pointer"
                                    >
                                      Hoje
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveCalendarVar(null)}
                                      className="text-gray-400 hover:text-black font-medium cursor-pointer"
                                    >
                                      Fechar
                                    </button>
                                  </div>
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
                                    onClick={() => handlePresetSelect(varName, preset)}
                                    className="px-2 py-0.5 text-[10px] text-gray-600 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 rounded transition-all duration-150 text-left font-sans truncate max-w-full cursor-pointer"
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
      </div>
    </div>
  );
}

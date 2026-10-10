import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Sliders, Eye, RefreshCw, Calendar, ChevronLeft, ChevronRight, Maximize2, Minimize2, Move, Layers, ExternalLink, ChevronDown, Plus, Type } from 'lucide-react';
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

const parseAndFormatDate = (val: string): string => {
  const trimmed = val.trim();
  if (!trimmed) return '';

  // 1. Try parsing YYYY[-/. ]MM[-/. ]DD or YYYY[-/. ]M[-/. ]D
  // Note: Year must be 4 digits here to be parsed as YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }

  // 2. Try parsing D[-/. ]M[-/. ]Y or DD[-/. ]MM[-/. ]YYYY or DD[-/. ]MM[-/. ]YY
  // Note: Day and Month can be 1 or 2 digits, Year can be 2 or 4 digits.
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (dmyMatch[3].length === 2) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }

  // 3. Fallback: If they typed just numbers, e.g. "21072004" (8 digits) or "2172004" (7 digits) or "210704" (6 digits)
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 8) {
    const d = parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(2, 4), 10);
    const y = parseInt(digits.slice(4, 8), 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y > 1000) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    const y2 = parseInt(digits.slice(0, 4), 10);
    const m2 = parseInt(digits.slice(4, 6), 10);
    const d2 = parseInt(digits.slice(6, 8), 10);
    if (d2 >= 1 && d2 <= 31 && m2 >= 1 && m2 <= 12 && y2 > 1000) {
      return `${String(d2).padStart(2, '0')}/${String(m2).padStart(2, '0')}/${y2}`;
    }
  } else if (digits.length === 6) {
    const d = parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(2, 4), 10);
    let y = parseInt(digits.slice(4, 6), 10);
    y = y < 50 ? 2000 + y : 1900 + y;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
  } else if (digits.length === 7) {
    const d1 = parseInt(digits.slice(0, 1), 10);
    const m1 = parseInt(digits.slice(1, 3), 10);
    const y1 = parseInt(digits.slice(3, 7), 10);
    if (d1 >= 1 && d1 <= 9 && m1 >= 1 && m1 <= 12 && y1 > 1000) {
      return `${String(d1).padStart(2, '0')}/${String(m1).padStart(2, '0')}/${y1}`;
    }
    const d2 = parseInt(digits.slice(0, 2), 10);
    const m2 = parseInt(digits.slice(2, 3), 10);
    const y2 = parseInt(digits.slice(3, 7), 10);
    if (d2 >= 1 && d2 <= 31 && m2 >= 1 && m2 <= 9 && y2 > 1000) {
      return `${String(d2).padStart(2, '0')}/${String(m2).padStart(2, '0')}/${y2}`;
    }
  }

  return val;
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

export interface Segment {
  type: 'text' | 'variable';
  text: string;
  varName?: string;
}

export function parseSegments(value: string): Segment[] {
  if (!value) return [{ type: 'text', text: '' }];
  const regex = /(\{\{[^{}]+\}\}|\[\[[^[\]]+\]\])/g;
  const parts = value.split(regex);
  const segments: Segment[] = [];
  
  parts.forEach(part => {
    if (part === '') return; // skip empty parts
    const isCurly = part.startsWith('{{') && part.endsWith('}}');
    const isBracket = part.startsWith('[[') && part.endsWith(']]');
    if (isCurly || isBracket) {
      segments.push({
        type: 'variable',
        text: part,
        varName: part.slice(2, -2).trim()
      });
    } else {
      segments.push({
        type: 'text',
        text: part
      });
    }
  });
  
  if (segments.length === 0) {
    return [{ type: 'text', text: '' }];
  }
  return segments;
}

interface InteractiveDivInputProps {
  id: string;
  varName?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  isMultiline?: boolean;
  variablePresets?: Record<string, string[]>;
  onKeyDown?: (e: React.KeyboardEvent<any>) => void;
  onFocus?: () => void;
}

function valueToHtml(value: string): string {
  if (!value) return '';
  const regex = /(\{\{[^{}]+\}\}|\[\[[^[\]]+\]\])/g;
  const parts = value.split(regex);
  
  return parts.map(part => {
    if (!part) return '';
    const isCurly = part.startsWith('{{') && part.endsWith('}}');
    const isBracket = part.startsWith('[[') && part.endsWith(']]');
    if (isCurly || isBracket) {
      const varName = part.slice(2, -2).trim();
      const styleAttr = isCurly ? 'curly' : 'bracket';
      return `<button contenteditable="false" data-var="${varName}" data-style="${styleAttr}" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-dashed border-amber-300 hover:border-amber-400 rounded-md text-[10px] font-bold font-mono align-middle cursor-pointer shadow-3xs select-none">${varName} <span class="text-amber-500 text-[8px] shrink-0">▾</span></button>`;
    } else {
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }).join('');
}

function htmlToValue(element: HTMLDivElement): string {
  let val = '';
  const childNodes = Array.from(element.childNodes);
  childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      val += node.nodeValue;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === 'BUTTON' && el.getAttribute('data-var')) {
        const varName = el.getAttribute('data-var');
        const style = el.getAttribute('data-style') || 'curly';
        val += style === 'curly' ? `{{${varName}}}` : `[[${varName}]]`;
      } else if (el.tagName === 'BR') {
        val += '\n';
      } else {
        val += el.innerText;
      }
    }
  });
  return val;
}

export function InteractiveDivInput({
  id,
  varName,
  value,
  onChange,
  placeholder,
  isMultiline,
  variablePresets = {},
  onKeyDown,
  onFocus,
}: InteractiveDivInputProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastQueriedCepRef = useRef<string>('');
  const [activeDropdownVar, setActiveDropdownVar] = useState<{ name: string; element: HTMLElement } | null>(null);
  const [customInputValue, setCustomInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCepVar = varName?.toLowerCase().trim() === 'cep';
  const isAlreadyFilled = value.toLowerCase().includes('cep:') || value.includes('[XXX]') || value.includes(' - ');

  // Sync internal HTML with external value ONLY if it represents different text
  useEffect(() => {
    if (ref.current) {
      const currentVal = htmlToValue(ref.current);
      if (currentVal !== value) {
        ref.current.innerHTML = valueToHtml(value);
      }
    }
  }, [value]);

  const triggerCepLookup = async (cleanCep: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    lastQueriedCepRef.current = cleanCep;
    
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!res.ok) {
        throw new Error('Falha na resposta da API');
      }
      const data = await res.json();
      
      // Calculate how much time passed, and enforce a minimum of 2 seconds (2000ms)
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }

      if (data.erro === true || data.erro === 'true') {
        setErrorMessage('CEP não encontrado. Verifique o número digitado.');
        setIsLoading(false);
        return;
      }
      
      const logradouro = data.logradouro || '';
      const bairro = data.bairro || '';
      const localidade = data.localidade || '';
      const uf = data.uf || '';
      const regiao = data.regiao || '';
      const ddd = data.ddd || '';
      
      // Template: CEP: 44444444 - Rua Via Coletora B [XXX], Nossa Senhora das Graças, Santo Antônio de Jesus BA / Nordeste DDD (75)
      const regiaoText = regiao ? ` / ${regiao}` : '';
      const dddText = ddd ? ` DDD (${ddd})` : '';
      const filledText = `CEP: ${cleanCep} - ${logradouro} [XXX], ${bairro}, ${localidade} ${uf}${regiaoText}${dddText}`;
      
      onChange(filledText);
      if (ref.current) {
        ref.current.innerHTML = valueToHtml(filledText);
      }
      setSuccessMessage('✓ CEP consultado com sucesso!');
    } catch (err) {
      console.error(err);
      // Wait for the remaining 2 seconds even on error
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }
      setErrorMessage('Erro de conexão ou consulta de CEP inválida.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = () => {
    if (ref.current) {
      let rawVal = htmlToValue(ref.current);
      
      if (isCepVar && !isAlreadyFilled) {
        // Clean: keep only digits
        const clean = rawVal.replace(/\D/g, '');
        const clean8 = clean.slice(0, 8);
        
        // Format as XXXXX-XXX
        let formatted = clean8;
        if (clean8.length > 5) {
          formatted = `${clean8.slice(0, 5)}-${clean8.slice(5)}`;
        }
        
        // Only update innerText if it represents a structural change to avoid cursor resetting
        if (rawVal !== formatted) {
          ref.current.innerText = formatted;
          // Position cursor at the very end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(ref.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        
        onChange(formatted);
        
        if (errorMessage) setErrorMessage(null);
        if (successMessage) setSuccessMessage(null);

        // Auto trigger search if exactly 8 digits are supplied
        if (clean8.length === 8 && lastQueriedCepRef.current !== clean8) {
          triggerCepLookup(clean8);
        } else if (clean8.length < 8) {
          lastQueriedCepRef.current = '';
        }
      } else {
        const newVal = htmlToValue(ref.current);
        const cleanedVal = newVal.trim() === '' ? '' : newVal;
        onChange(cleanedVal);
        if (errorMessage) {
          setErrorMessage(null);
        }
        if (successMessage) {
          setSuccessMessage(null);
        }
      }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button');
    if (button && button.getAttribute('data-var')) {
      e.preventDefault();
      e.stopPropagation();
      const varName = button.getAttribute('data-var') || '';
      setActiveDropdownVar({
        name: varName,
        element: button
      });
      setCustomInputValue('');
    } else {
      setActiveDropdownVar(null);
    }
  };

  const handleSelectPreset = (preset: string) => {
    if (!activeDropdownVar || !ref.current) return;
    
    const buttonEl = activeDropdownVar.element;
    
    // Replace the button in the DOM with a text node of the preset!
    const textNode = document.createTextNode(preset);
    buttonEl.parentNode?.replaceChild(textNode, buttonEl);
    
    // Sync change back to state
    const newVal = htmlToValue(ref.current);
    onChange(newVal);
    setActiveDropdownVar(null);
    
    // Keep focus
    ref.current.focus();
  };

  const handleCustomInputSubmit = () => {
    if (customInputValue.trim()) {
      handleSelectPreset(customInputValue.trim());
    }
  };

  const presets = activeDropdownVar ? variablePresets[activeDropdownVar.name] || [] : [];

  return (
    <div className="relative w-full flex flex-col gap-1.5">
      <div className="relative flex items-center">
        <div
          id={id}
          ref={ref}
          contentEditable={!isLoading}
          suppressContentEditableWarning
          onInput={handleInput}
          onClick={handleClick}
          onFocus={onFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!isMultiline) {
                e.preventDefault();
                if (onKeyDown) {
                  onKeyDown(e);
                }
              }
            }
          }}
          style={{
            minHeight: isMultiline ? '58px' : '38px',
            outline: 'none',
            WebkitUserSelect: 'text',
            userSelect: 'text',
          }}
          className={`w-full bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3.5 py-2 text-xs text-gray-950 font-sans leading-relaxed break-words whitespace-pre-wrap select-text cursor-text transition-all duration-150 ${
            isLoading ? 'bg-neutral-50/80 cursor-not-allowed opacity-70 select-none' : ''
          } ${
            isCepVar ? 'pr-28' : ''
          } ${isMultiline ? 'min-h-[58px]' : ''}`}
        />
        
        {isCepVar && (
          <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none select-none z-10">
            {isLoading && (
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-sans">
                <RefreshCw size={10} className="animate-spin text-gray-400" />
                <span>Buscando...</span>
              </div>
            )}
            {successMessage && !isLoading && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-sans font-semibold">
                <Check size={11} className="text-emerald-500" />
                <span>Pronto!</span>
              </div>
            )}
          </div>
        )}
        
        {!value && (
          <div className="absolute top-2.5 left-3.5 text-gray-400 text-xs font-sans pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="text-[10px] text-red-500 font-sans font-medium px-1 flex items-center gap-1 animate-in fade-in duration-150">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="text-[10px] text-emerald-600 font-sans font-semibold px-1 flex items-center gap-1 animate-in fade-in duration-150">
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Dropdown Popover */}
      {activeDropdownVar && (
        <div
          className="absolute z-50 bg-white border border-neutral-200 shadow-xl rounded-xl p-3 space-y-2.5 text-left font-sans text-xs min-w-[200px] max-w-xs animate-in fade-in slide-in-from-top-1 duration-150 text-neutral-900"
          style={{
            top: `${activeDropdownVar.element.offsetTop + activeDropdownVar.element.offsetHeight + 4}px`,
            left: `${Math.min((ref.current?.offsetWidth || 220) - 200, activeDropdownVar.element.offsetLeft)}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
            <span className="font-bold text-neutral-800 font-mono text-[9px] uppercase">Opções para: {activeDropdownVar.name}</span>
            <button
              type="button"
              onClick={() => setActiveDropdownVar(null)}
              className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
            >
              <X size={10} />
            </button>
          </div>

          {presets.length > 0 && (
            <div className="space-y-1">
              <span className="block text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-wider">Escolher da lista:</span>
              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
                {presets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left px-2 py-1 bg-neutral-50 hover:bg-neutral-950 hover:text-white rounded transition-all font-sans text-[10px] truncate border border-neutral-200/40 cursor-pointer text-neutral-700 font-medium"
                    title={preset}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1 pt-1 border-t border-neutral-50">
            <span className="block text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-wider">Ou digitar valor:</span>
            <div className="flex gap-1">
              <input
                type="text"
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                placeholder="Digite aqui..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInputSubmit();
                  }
                }}
                className="flex-1 px-2 py-1 bg-white text-[10px] text-neutral-850 border border-neutral-200 rounded focus:border-neutral-950 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCustomInputSubmit}
                className="px-2 py-1 bg-neutral-950 text-white font-bold text-[9px] rounded cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface QuickFillModalProps {
  template: Template | null;
  onClose: () => void;
  onCopy: (id: string, text: string) => void;
  templates?: Template[];
  onSelectTemplate?: (template: Template) => void;
}

export default function QuickFillModal({ 
  template, 
  onClose, 
  onCopy,
  templates = [],
  onSelectTemplate
}: QuickFillModalProps) {
  const [copied, setCopied] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeFocusedVar, setActiveFocusedVar] = useState<string | null>(null);
  const [activeCalendarVar, setActiveCalendarVar] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const lastEnterPressRef = useRef<{ time: number; varName: string | null }>({ time: 0, varName: null });

  // Picture-in-Picture (PiP) and floating states
  const [isPipMode, setIsPipMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [externalPipWindow, setExternalPipWindow] = useState<Window | null>(null);
  
  const isMinimizedRef = useRef(false);
  const isPipModeRef = useRef(false);
  const externalPipWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    isPipModeRef.current = isPipMode;
  }, [isPipMode]);

  useEffect(() => {
    externalPipWindowRef.current = externalPipWindow;
  }, [externalPipWindow]);

  const [pipTab, setPipTab] = useState<'fill' | 'preview'>('fill');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const [enableCtrlPipToggle, setEnableCtrlPipToggle] = useState(true);
  const ctrlPressedRef = useRef(false);
  const ctrlComboUsedRef = useRef(false);

  // Real OS-level Document Picture-in-Picture (over other windows/tabs)
  const [showNativePipButton, setShowNativePipButton] = useState(true);

  // Font size state for text preview
  const [previewFontSize, setPreviewFontSize] = useState(() => {
    const saved = localStorage.getItem('quick_text_preview_font_size');
    return saved ? parseInt(saved, 10) : 13;
  });
  const [previewFontFamily, setPreviewFontFamily] = useState<'sans' | 'poppins' | 'lexend' | 'outfit' | 'cascadia'>(() => {
    const saved = localStorage.getItem('quick_text_preview_font_family');
    return (saved as any) || 'sans';
  });
  const [showFontToolbar, setShowFontToolbar] = useState(false);
  const [showPipFontToolbar, setShowPipFontToolbar] = useState(false);
  
  const handleIncreaseFont = () => setPreviewFontSize(prev => Math.min(24, prev + 1));
  const handleDecreaseFont = () => setPreviewFontSize(prev => Math.max(10, prev - 1));

  useEffect(() => {
    localStorage.setItem('quick_text_preview_font_family', previewFontFamily);
  }, [previewFontFamily]);

  useEffect(() => {
    localStorage.setItem('quick_text_preview_font_size', previewFontSize.toString());
  }, [previewFontSize]);

  const fontStyles: Record<string, string> = {
    sans: '"Inter", sans-serif',
    poppins: '"Poppins", sans-serif',
    lexend: '"Lexend", sans-serif',
    outfit: '"Outfit", sans-serif',
    cascadia: '"Cascadia Code", "JetBrains Mono", "Fira Code", monospace'
  };

  useEffect(() => {
    return () => {
      if (externalPipWindow) {
        try {
          externalPipWindow.close();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [externalPipWindow]);

  const updateMinimizedState = (minimized: boolean) => {
    setIsMinimized(minimized);
    if (externalPipWindow) {
      try {
        const w = minimized ? 320 : 480;
        const h = minimized ? 90 : 620;
        externalPipWindow.resizeTo(w, h);

        const body = externalPipWindow.document.body;
        const html = externalPipWindow.document.documentElement;
        if (body) {
          body.style.backgroundColor = minimized ? '#000000' : '#ffffff';
          body.style.color = minimized ? '#ffffff' : '#0b0f19';
        }
        if (html) {
          html.style.backgroundColor = minimized ? '#000000' : '#ffffff';
        }
      } catch (err) {
        console.warn('Could not resize external PiP window:', err);
      }
    }
  };

  const startExternalPip = async (minimizedState: boolean = false) => {
    const isMin = typeof minimizedState === 'boolean' ? minimizedState : false;

    // If external PiP is already open, focus it and update minimized state
    if (externalPipWindow && !externalPipWindow.closed) {
      try {
        externalPipWindow.focus();
        updateMinimizedState(isMin);
        return;
      } catch {
        // window might be invalid, proceed to requestWindow
      }
    }

    if (!('documentPictureInPicture' in window)) {
      setIsPipMode(true);
      setIsMinimized(isMin);
      return;
    }

    try {
      setIsMinimized(isMin);

      const w = isMin ? 320 : 480;
      const h = isMin ? 90 : 620;

      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: w,
        height: h,
      });

      // Set document body & html style
      try {
        const body = pipWin.document.body;
        const html = pipWin.document.documentElement;
        html.style.margin = '0';
        html.style.padding = '0';
        html.style.width = '100%';
        html.style.height = '100%';
        body.style.margin = '0';
        body.style.padding = '0';
        body.style.width = '100%';
        body.style.height = '100%';
        body.style.overflow = 'hidden';
        if (isMin) {
          body.style.backgroundColor = '#000000';
          body.style.color = '#ffffff';
          html.style.backgroundColor = '#000000';
        } else {
          body.style.backgroundColor = '#ffffff';
          body.style.color = '#0b0f19';
          html.style.backgroundColor = '#ffffff';
        }
      } catch (e) {
        console.warn('Could not set PiP body/html styles:', e);
      }

      // Set custom title to avoid domain name showing
      try {
        pipWin.document.title = "Texto Padrão (QuickText)";
      } catch (e) {
        console.warn("Could not set Picture-in-Picture window title:", e);
      }

      // Copy page stylesheets to style the new PiP window perfectly
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const style = pipWin.document.createElement('style');
          let cssText = '';
          for (const rule of styleSheet.cssRules) {
            cssText += rule.cssText + '\n';
          }
          style.textContent = cssText;
          pipWin.document.head.appendChild(style);
        } catch (e) {
          if (styleSheet.href) {
            const link = pipWin.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pipWin.document.head.appendChild(link);
          }
        }
      });

      // Also copy other styling tags to guarantee tailwind and webfonts are carried over
      document.querySelectorAll('style').forEach((styleEl) => {
        pipWin.document.head.appendChild(styleEl.cloneNode(true));
      });

      // Listen for window closed by user
      pipWin.addEventListener('pagehide', () => {
        setExternalPipWindow(null);
        setIsMinimized(false);
        setIsPipMode(false);
        setTimeout(() => {
          const firstInput = document.querySelector('input, textarea, [tabindex="0"]') as HTMLElement;
          if (firstInput) {
            firstInput.focus();
          } else {
            window.focus();
          }
        }, 100);
      });

      setExternalPipWindow(pipWin);
      setIsPipMode(false);
    } catch (err) {
      console.warn('Falha ao abrir Picture-in-Picture externo, ativando modo flutuante integrado:', err);
      // Fallback seamlessly to the in-page PiP floating mode
      setIsPipMode(true);
      setIsMinimized(isMin);
    }
  };

  const handleClose = () => {
    setIsMinimized(false);
    setIsPipMode(false);
    if (externalPipWindow) {
      try {
        externalPipWindow.close();
      } catch (e) {
        console.error(e);
      }
      setExternalPipWindow(null);
    }
    onClose();
    setTimeout(() => {
      const firstInput = document.querySelector('input, textarea, [tabindex="0"]') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      } else {
        window.focus();
      }
    }, 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('textarea') ||
      target.closest('[contenteditable="true"]') ||
      target.closest('[contenteditable]')
    ) {
      return;
    }
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.posX + deltaX,
        y: dragRef.current.posY + deltaY
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('textarea') ||
      target.closest('[contenteditable="true"]') ||
      target.closest('[contenteditable]')
    ) {
      return;
    }
    
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      posX: position.x,
      posY: position.y
    };
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touchItem = moveEvent.touches[0];
      const deltaX = touchItem.clientX - dragRef.current.startX;
      const deltaY = touchItem.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.posX + deltaX,
        y: dragRef.current.posY + deltaY
      });
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  useEffect(() => {
    if (template) {
      setIsMinimized(false);
      const extracted = extractVariables(template.content);
      setVariables(extracted);
      const initialValues: Record<string, string> = {};
      extracted.forEach(v => {
        initialValues[v] = '';
      });
      setValues(initialValues);
      setCopied(false);

      // Read custom settings from localStorage
      let autoOpen = false;
      let initialTab: 'fill' | 'preview' = 'fill';
      let nativePipEnabled = true;
      let ctrlPipToggleEnabled = true;
      try {
        const savedSettings = localStorage.getItem('quick_text_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          autoOpen = !!parsed.autoOpenPip;
          nativePipEnabled = parsed.enableNativePip !== false;
          ctrlPipToggleEnabled = parsed.enableCtrlPipToggle !== false;
          if (parsed.defaultPipTab === 'fill' || parsed.defaultPipTab === 'preview') {
            initialTab = parsed.defaultPipTab;
          }
        }
      } catch (e) {
        console.error(e);
      }

      setPipTab(initialTab);
      setShowNativePipButton(nativePipEnabled);
      setEnableCtrlPipToggle(ctrlPipToggleEnabled);

      // Auto focus the first variable input for lightning-fast typing
      setTimeout(() => {
        if (extracted.length > 0) {
          const firstInput = document.getElementById(`modal-input-${extracted[0]}`);
          if (firstInput) {
            (firstInput as HTMLInputElement).focus();
          }
        }
      }, 100);

      // Auto launch Picture-in-Picture window if enabled and supported
      if (autoOpen && 'documentPictureInPicture' in window) {
        setTimeout(() => {
          startExternalPip(false);
        }, 150);
      }
    }
  }, [template]);

  // Shortcut: Single tap of Ctrl key toggles PiP mode
  // - If PiP is closed -> opens PiP mode (starts expanded)
  // - If PiP is open -> minimizes PiP mode (or expands if already minimized)
  // - NEVER copies on Ctrl tap (only copy button copies)
  useEffect(() => {
    if (!template || !enableCtrlPipToggle) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        ctrlPressedRef.current = true;
        ctrlComboUsedRef.current = false;
      } else if (e.ctrlKey) {
        // Combination like Ctrl+C, Ctrl+V, Ctrl+A was pressed, do not toggle PiP
        ctrlComboUsedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        if (ctrlPressedRef.current && !ctrlComboUsedRef.current) {
          // Pure standalone tap on Ctrl!
          const isPipActive = Boolean(externalPipWindow || isPipMode);
          if (isPipActive) {
            // Open -> Toggle minimize/expand (Do NOT copy)
            updateMinimizedState(!isMinimized);
          } else {
            // Closed -> Open PiP mode (expanded)
            if ('documentPictureInPicture' in window) {
              startExternalPip(false);
            } else {
              setIsPipMode(true);
              setIsMinimized(false);
            }
          }
        }
        ctrlPressedRef.current = false;
        ctrlComboUsedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    if (externalPipWindow) {
      try {
        externalPipWindow.addEventListener('keydown', handleKeyDown);
        externalPipWindow.addEventListener('keyup', handleKeyUp);
        if (externalPipWindow.document) {
          externalPipWindow.document.addEventListener('keydown', handleKeyDown);
          externalPipWindow.document.addEventListener('keyup', handleKeyUp);
        }
      } catch (err) {
        console.warn('Could not attach shortcut listeners to external PiP window:', err);
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (externalPipWindow) {
        try {
          externalPipWindow.removeEventListener('keydown', handleKeyDown);
          externalPipWindow.removeEventListener('keyup', handleKeyUp);
          if (externalPipWindow.document) {
            externalPipWindow.document.removeEventListener('keydown', handleKeyDown);
            externalPipWindow.document.removeEventListener('keyup', handleKeyUp);
          }
        } catch {
          // ignore
        }
      }
    };
  }, [template, enableCtrlPipToggle, isPipMode, isMinimized, externalPipWindow]);

  if (!template) return null;

  const resolvedContent = replaceVariables(template.content, values);

  const fallbackCopyText = (text: string, doc: Document): boolean => {
    const textArea = doc.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    doc.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    let successful = false;
    try {
      successful = doc.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    doc.body.removeChild(textArea);
    return successful;
  };

  const performCopy = (valsToCopy: Record<string, string>, shouldClose: boolean = true) => {
    const textToCopy = replaceVariables(template.content, valsToCopy);
    const targetWindow = externalPipWindow || window;
    const targetDoc = targetWindow.document;

    const doSuccessActions = () => {
      setCopied(true);
      onCopy(template.id, textToCopy);
      if (isPipMode || externalPipWindow) {
        setTimeout(() => {
          setCopied(false);
          updateMinimizedState(true); // Minimize to a floating button/pill in PiP mode
        }, 1000);
      } else {
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      }
    };

    if (targetWindow.navigator && targetWindow.navigator.clipboard && typeof targetWindow.navigator.clipboard.writeText === 'function') {
      targetWindow.navigator.clipboard.writeText(textToCopy)
        .then(() => {
          doSuccessActions();
        })
        .catch((err) => {
          console.warn('Modern clipboard on active window failed, trying fallback...', err);
          const success = fallbackCopyText(textToCopy, targetDoc);
          if (success) {
            doSuccessActions();
          } else if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy)
              .then(doSuccessActions)
              .catch(e => console.error('All clipboard methods failed', e));
          }
        });
    } else {
      const success = fallbackCopyText(textToCopy, targetDoc);
      if (success) {
        doSuccessActions();
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy)
          .then(doSuccessActions)
          .catch(e => console.error('All fallback clipboard methods failed', e));
      }
    }
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
        const raw = nextValues[varName]?.trim() || '';
        if (!raw) {
          const today = new Date();
          const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
          nextValues[varName] = dateStr;
          setValues(prev => ({ ...prev, [varName]: dateStr }));
        } else {
          const formatted = parseAndFormatDate(raw);
          nextValues[varName] = formatted;
          setValues(prev => ({ ...prev, [varName]: formatted }));
        }
      }

      const idx = variables.indexOf(varName);
      const isLastField = idx === variables.length - 1;

      if (!isLastField) {
        const nextVar = variables[idx + 1];
        const targetDoc = e.currentTarget.ownerDocument || document;
        setTimeout(() => {
          const nextElement = targetDoc.getElementById(`modal-input-${nextVar}`) || targetDoc.getElementById(`pip-input-${nextVar}`);
          if (nextElement) {
            (nextElement as HTMLElement).focus();
          }
        }, 50);
      } else {
        performCopy(nextValues, true);
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
        
        if (value) {
          // If filled, render as beautiful flowing inline text that wraps perfectly line-by-line with same font weight
          return (
            <span
              key={index}
              className="inline px-1 py-0.5 mx-0.5 rounded-sm font-semibold bg-emerald-50/70 text-emerald-800 border-b border-dashed border-emerald-300 transition-all duration-150 break-words whitespace-pre-wrap"
            >
              {value}
            </span>
          );
        } else {
          // If pending, render as a distinct monospace placeholder badge
          return (
            <span
              key={index}
              className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[0.8em] font-bold bg-amber-50 text-amber-800 border border-dashed border-amber-200/80 animate-pulse transition-all duration-150 align-middle"
            >
              {isCurly ? `{{${varName}}}` : `[[${varName}]]`}
            </span>
          );
        }
      }
      return <span key={index} className="font-normal text-gray-600">{part}</span>;
    });
  };

  const renderPipContent = () => {
    if (!template) return null;

    if (isMinimized) {
      return (
        <div className="bg-black text-white h-screen w-screen flex items-center justify-between px-3.5 py-1.5 font-sans overflow-hidden select-none antialiased border border-neutral-800">
          <button
            type="button"
            onClick={() => updateMinimizedState(false)}
            className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer text-white hover:text-gray-200 transition-all focus:outline-hidden truncate flex-1 mr-2 text-left"
            title="Expandir Assistente"
          >
            <Layers size={12} className="text-gray-300 animate-pulse shrink-0" />
            <span className="truncate">{template.title}</span>
          </button>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => updateMinimizedState(false)}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-[10px] rounded-md border border-neutral-700 transition-all cursor-pointer"
            >
              Restaurar
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white text-gray-950 h-screen w-screen flex flex-col font-sans overflow-hidden antialiased">
        {/* Header */}
        <div className="px-4 py-3 bg-[#fcfcfd] border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[8px] font-mono font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200 mr-1.5">
              {template.category}
            </span>
            {templates && templates.length > 0 && onSelectTemplate ? (
              <div className="relative inline-block max-w-[220px] align-middle">
                <select
                  value={template.id}
                  onChange={(e) => {
                    const selected = templates.find(t => t.id === e.target.value);
                    if (selected) {
                      onSelectTemplate(selected);
                    }
                  }}
                  className="bg-transparent font-sans font-bold text-gray-900 text-xs tracking-tight focus:outline-hidden cursor-pointer appearance-none pr-4 truncate border-none p-0 focus:ring-0"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id} className="text-gray-900 bg-white py-1">
                      [{t.category}] {t.title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-500">
                  <ChevronDown size={11} />
                </div>
              </div>
            ) : (
              <span className="font-bold text-gray-900 text-xs truncate max-w-[220px] inline-block align-middle" title={template.title}>
                {template.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-black flex items-center gap-1 text-[9px] font-mono transition-colors p-1 cursor-pointer"
              title="Limpar todos os campos"
            >
              <RefreshCw size={9} />
              Limpar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                copied
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-3xs'
                  : 'bg-black hover:bg-neutral-800 text-white border-black shadow-3xs'
              }`}
            >
              {copied ? (
                <>
                  <Check size={9} className="text-emerald-600 animate-pulse" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={9} />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => updateMinimizedState(true)}
              className="text-gray-400 hover:text-black p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              title="Minimizar (Ctrl)"
            >
              <Minimize2 size={11} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
              title="Fechar (X)"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-4 py-1.5 border-b border-gray-100 bg-neutral-50 flex items-center justify-between shrink-0">
          <div className="flex gap-1 bg-gray-200/60 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setPipTab('fill')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                pipTab === 'fill' 
                  ? 'bg-white text-black font-semibold shadow-3xs' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Preencher
            </button>
            <button
              type="button"
              onClick={() => setPipTab('preview')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                pipTab === 'preview' 
                  ? 'bg-white text-black font-semibold shadow-3xs' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Visualizar
            </button>
          </div>
          
          <span className="text-[9px] font-mono text-indigo-600 font-bold">MODO FLUTUANTE</span>
        </div>

        {/* Form / Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0 bg-white">
          {pipTab === 'fill' ? (
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {variables.length > 0 ? (
                variables.map(varName => {
                  const isFilled = !!values[varName] && values[varName].trim() !== '';
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
                    <div key={varName} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label
                          htmlFor={`pip-input-${varName}`}
                          className="block text-[11px] font-bold text-gray-700 font-mono"
                        >
                          {varName} {isMultiline && <span className="text-[10px] text-indigo-500 font-normal font-sans">(Grande)</span>}
                        </label>
                        <span className={`text-[9px] font-mono font-bold ${isFilled ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {isFilled ? 'Preenchido' : 'Pendente'}
                        </span>
                      </div>
                      
                      {isDate ? (
                        <div className="space-y-2">
                          <input
                            id={`pip-input-${varName}`}
                            type="text"
                            placeholder="DD/MM/AAAA ou texto..."
                            value={values[varName] || ''}
                            onChange={(e) => {
                              handleDateInputChange(varName, e.target.value);
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                const formatted = parseAndFormatDate(e.target.value);
                                if (formatted !== e.target.value) {
                                  handleInputChange(varName, formatted);
                                }
                              }
                            }}
                            onKeyDown={(e) => handleFieldKeyDown(e, varName, true)}
                            className="w-full px-3 py-1.5 bg-white text-xs text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-3xs"
                          />
                        </div>
                      ) : (
                        <InteractiveDivInput
                          id={`pip-input-${varName}`}
                          varName={varName}
                          value={values[varName] || ''}
                          onChange={(val) => handleInputChange(varName, val)}
                          placeholder={`Inserir valor para ${varName}...`}
                          isMultiline={isMultiline}
                          variablePresets={template?.variablePresets}
                          onFocus={() => setActiveFocusedVar(varName)}
                        />
                      )}

                      {/* Suggestions */}
                      {presets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {presets.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handlePresetSelect(varName, preset)}
                              className="px-1.5 py-0.5 text-[9px] text-gray-500 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 rounded transition-all max-w-full truncate cursor-pointer font-sans"
                              title={preset}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 italic py-4">Sem variáveis neste template.</p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              <div 
                style={{ fontSize: `${previewFontSize}px`, fontFamily: fontStyles[previewFontFamily] }}
                className="bg-[#fcfcfd] border border-gray-200 rounded-xl p-4 font-sans text-xs text-gray-600 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto shadow-inner relative select-text"
              >
                {renderLivePreview()}
              </div>
              
              {/* Font family and size adjustment buttons for External PiP */}
              <div className="flex items-center justify-between gap-1 mt-2 bg-gray-50 border border-gray-100 rounded-lg p-1.5 shrink-0 relative">
                <div className="flex items-center gap-1 relative">
                  <button
                    type="button"
                    onClick={() => setShowPipFontToolbar(prev => !prev)}
                    className="px-2 py-1 text-[9px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md shadow-3xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Type size={10} className="text-gray-400" />
                    <span>Fonte: <span className="font-semibold text-black" style={{ fontFamily: fontStyles[previewFontFamily] }}>{previewFontFamily === 'sans' ? 'Inter' : previewFontFamily === 'cascadia' ? 'Cascadia' : previewFontFamily === 'outfit' ? 'Outfit' : previewFontFamily.charAt(0).toUpperCase() + previewFontFamily.slice(1)}</span></span>
                    <ChevronDown size={8} className={`text-gray-400 transition-transform ${showPipFontToolbar ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Floating Popover Font Toolbar for External PiP */}
                  {showPipFontToolbar && (
                    <div className="absolute bottom-full mb-1 left-0 z-50 p-1 bg-white border border-gray-200 rounded-lg shadow-md flex items-center gap-0.5 animate-in slide-in-from-bottom-1 duration-150">
                      {(['sans', 'poppins', 'lexend', 'outfit', 'cascadia'] as const).map((font) => (
                        <button
                          key={font}
                          type="button"
                          onClick={() => {
                            setPreviewFontFamily(font);
                            setShowPipFontToolbar(false);
                          }}
                          className={`px-1.5 py-1 text-[8px] font-semibold rounded transition-all cursor-pointer whitespace-nowrap ${
                            previewFontFamily === font
                              ? 'bg-neutral-900 text-white shadow-3xs'
                              : 'text-gray-600 hover:text-black hover:bg-gray-100'
                          }`}
                          style={{ fontFamily: fontStyles[font] }}
                        >
                          {font === 'sans' ? 'Inter' : font === 'cascadia' ? 'Cascadia' : font === 'outfit' ? 'Outfit' : font.charAt(0).toUpperCase() + font.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center bg-gray-200/60 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={handleDecreaseFont}
                    className="px-1.5 py-0.5 text-[9px] font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-1 text-[9px] font-bold font-mono text-gray-700 min-w-[20px] text-center">
                    {previewFontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={handleIncreaseFont}
                    className="px-1.5 py-0.5 text-[9px] font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isPipMode && isMinimized && !externalPipWindow) {
    return (
      <div
        id="quick-fill-minimized-pill"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
        }}
        className={`bg-black text-white hover:bg-neutral-900 border border-neutral-800 shadow-xl flex items-center gap-2 px-3.5 py-2 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto select-none hover:scale-105 ${
          isDragging ? 'transition-none' : 'transition-all duration-150'
        }`}
        title="Arraste para mover. Clique para abrir."
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 text-xs font-bold font-sans cursor-pointer focus:outline-hidden"
        >
          <Layers size={13} className="text-gray-300 animate-pulse" />
          <span className="truncate max-w-[120px] text-[11px] font-sans text-white">{template?.title || "Assistente"}</span>
        </button>
        
        <div className="h-3 w-[1px] bg-neutral-700"></div>
        
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer focus:outline-hidden"
          title="Fechar"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (externalPipWindow && isMinimized) {
    return (
      <div style={{ display: 'none' }} className="hidden">
        {createPortal(
          renderPipContent(),
          externalPipWindow.document.body
        )}
      </div>
    );
  }

  return (
    <div
      id="quick-fill-modal-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        (isPipMode || externalPipWindow) 
          ? isDragging 
            ? 'pointer-events-auto bg-transparent cursor-grabbing' 
            : 'pointer-events-none bg-transparent' 
          : 'pointer-events-auto bg-black/45 backdrop-blur-xs'
      }`}
    >
      <div
        id="quick-fill-modal-content"
        style={
          isPipMode
            ? {
                transform: `translate(${position.x}px, ${position.y}px)`,
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: 'min(calc(100vw - 32px), 520px)',
                height: isMinimized ? 'auto' : '620px',
                maxHeight: 'calc(100vh - 48px)',
                zIndex: 100,
              }
            : {}
        }
        className={`bg-white border border-gray-200 shadow-2xl flex flex-col pointer-events-auto ${
          isDragging ? 'transition-none' : 'transition-all duration-150'
        } ${
          isPipMode 
            ? 'rounded-2xl border-gray-300/90' 
            : 'max-w-4xl w-full rounded-xl overflow-hidden max-h-[85vh]'
        } ${isDragging ? 'select-none ring-1 ring-black/10' : ''}`}
      >
        {/* Modal Header / PIP Drag handle */}
        <div 
          onMouseDown={isPipMode ? handleMouseDown : undefined}
          onTouchStart={isPipMode ? handleTouchStart : undefined}
          className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 bg-[#fafafa] select-none ${
            isPipMode ? 'cursor-grab active:cursor-grabbing rounded-t-2xl' : ''
          }`}
          title={isPipMode ? 'Arraste para mover o painel flutuante' : ''}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                {template.category}
              </span>
              {isPipMode && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-wider font-mono">
                  <Move size={10} />
                  Flutuante (PiP)
                </span>
              )}
            </div>
            {templates && templates.length > 0 && onSelectTemplate ? (
              <div className="relative inline-block w-full">
                <select
                  value={template.id}
                  onChange={(e) => {
                    const selected = templates.find(t => t.id === e.target.value);
                    if (selected) {
                      onSelectTemplate(selected);
                    }
                  }}
                  className="w-full bg-transparent font-sans font-bold text-gray-950 text-sm tracking-tight focus:outline-hidden cursor-pointer appearance-none pr-6 truncate border-none p-0 focus:ring-0"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id} className="text-gray-900 bg-white py-1 font-sans">
                      [{t.category}] {t.title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-500">
                  <ChevronDown size={14} />
                </div>
              </div>
            ) : (
              <h3 className="font-sans font-bold text-gray-900 tracking-tight text-sm truncate" title={template.title}>
                {template.title}
              </h3>
            )}
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
            {/* Real OS-level Picture-in-Picture */}
            {('documentPictureInPicture' in window) && showNativePipButton && (
              <button
                type="button"
                onClick={() => startExternalPip(false)}
                className="p-1 px-2 rounded-md text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all cursor-pointer flex items-center justify-center gap-1 text-[10px] font-bold bg-indigo-50 border border-indigo-100"
                title="Destacar formulário (Sobrepõe outras abas e programas de todo o computador)"
              >
                <ExternalLink size={11} />
                <span>Fixar no Topo</span>
              </button>
            )}

            {/* Toggle PiP Mode */}
            <button
              type="button"
              onClick={() => {
                setIsPipMode(!isPipMode);
                setIsMinimized(false);
                setPosition({ x: 0, y: 0 }); // Reset position when toggling
              }}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                isPipMode 
                  ? 'bg-black text-white hover:bg-neutral-800' 
                  : 'text-gray-400 hover:text-black hover:bg-gray-100'
              }`}
              title={isPipMode ? "Voltar para o modo tela cheia (Ctrl para minimizar)" : "Entrar no modo flutuante PiP (Atalho: Ctrl)"}
            >
              <Layers size={13} />
            </button>

            <div className="h-4 w-[1px] bg-gray-200 mx-0.5"></div>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {externalPipWindow ? (
          /* --- EXTERNAL PIP ACTIVE INDICATOR --- */
          <div className="flex-1 flex flex-col items-center justify-center p-6 py-12 text-center bg-slate-50 rounded-b-2xl border-t border-gray-100 min-h-[300px]">
            <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center animate-bounce mb-4 shadow-sm">
              <ExternalLink size={24} />
            </div>
            
            <div className="space-y-2 max-w-sm mb-6">
              <h4 className="font-bold text-gray-950 text-sm tracking-tight">
                Janela Flutuante Externa Ativa!
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                O formulário foi destacado e agora está em uma <strong className="text-indigo-600 font-bold">janela flutuante externa</strong> que sobrepõe outras abas, programas e navegadores do seu computador.
              </p>
              <p className="text-[11px] text-gray-400">
                Você pode preencher as variáveis e copiar o resultado diretamente de lá sem perder o foco do seu trabalho.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (externalPipWindow) {
                    externalPipWindow.close();
                    setExternalPipWindow(null);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Trazer de Volta
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-semibold text-xs rounded-lg transition-all cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Selection (Only in PiP mode when not minimized) */}
            {isPipMode && !isMinimized && variables.length > 0 && (
          <div className="px-4 py-1.5 border-b border-gray-100 bg-neutral-50 flex items-center justify-between gap-4">
            <div className="flex gap-1 bg-gray-200/60 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setPipTab('fill')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  pipTab === 'fill' 
                    ? 'bg-white text-black font-semibold shadow-3xs' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                Preencher
              </button>
              <button
                type="button"
                onClick={() => setPipTab('preview')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  pipTab === 'preview' 
                    ? 'bg-white text-black font-semibold shadow-3xs' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                Visualizar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-black flex items-center gap-1 text-[10px] font-mono transition-colors"
                title="Limpar todos os campos"
              >
                <RefreshCw size={10} />
                Limpar
              </button>
              
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all border cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-3xs'
                    : 'bg-black hover:bg-neutral-800 text-white border-black shadow-3xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={11} className="text-emerald-600 animate-pulse" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal/PiP Body */}
        {!isMinimized && (
          <div className="p-5 overflow-y-auto flex-1 bg-white flex flex-col min-h-0">
            {isPipMode ? (
              /* --- PIP MODE ACTIVE CONTENT --- */
              <div className="flex-1 flex flex-col min-h-0">
                {pipTab === 'fill' ? (
                  /* Form Fields Tab */
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {variables.length > 0 ? (
                      variables.map(varName => {
                        const isFilled = !!values[varName] && values[varName].trim() !== '';
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
                          <div key={varName} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label
                                htmlFor={`modal-input-${varName}`}
                                className="block text-[11px] font-bold text-gray-700 font-mono"
                              >
                                {varName} {isMultiline && <span className="text-[10px] text-indigo-500 font-normal font-sans">(Grande)</span>}
                              </label>
                              <span className={`text-[9px] font-mono font-bold ${isFilled ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {isFilled ? 'Preenchido' : 'Pendente'}
                              </span>
                            </div>
                            
                            {isDate ? (
                              <div className="space-y-2">
                                <div className="relative flex items-center">
                                  <input
                                    id={`modal-input-${varName}`}
                                    type="text"
                                    placeholder="DD/MM/AAAA ou texto..."
                                    value={values[varName] || ''}
                                    onChange={(e) => {
                                      handleDateInputChange(varName, e.target.value);
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value.trim()) {
                                        const formatted = parseAndFormatDate(e.target.value);
                                        if (formatted !== e.target.value) {
                                          handleInputChange(varName, formatted);
                                        }
                                      }
                                    }}
                                    onKeyDown={(e) => handleFieldKeyDown(e, varName, true)}
                                    className={`w-full px-3 py-1.5 bg-white text-xs text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-3xs ${
                                      isDate ? 'pr-9' : ''
                                    }`}
                                  />
                                  {isDate && (
                                    <div className="absolute right-1.5 flex items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCalendar(varName)}
                                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                                          activeCalendarVar === varName 
                                            ? 'bg-black text-white' 
                                            : 'hover:bg-gray-100 text-gray-400 hover:text-black'
                                        }`}
                                        title="Escolher data no calendário"
                                      >
                                        <Calendar size={13} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {isDate && activeCalendarVar === varName && (
                                  <div className="bg-neutral-50 border border-gray-200 rounded-lg p-2.5 space-y-2.5 animate-in slide-in-from-top-1 fade-in duration-200 shadow-3xs">
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
                                        className="p-0.5 hover:bg-white border border-gray-100 rounded text-gray-500 hover:text-black cursor-pointer"
                                      >
                                        <ChevronLeft size={12} />
                                      </button>
                                      
                                      <div className="flex items-center gap-1 bg-white border border-gray-200 px-1 py-0.5 rounded text-[10px]">
                                        <select
                                          value={calendarMonth}
                                          onChange={(e) => setCalendarMonth(parseInt(e.target.value, 10))}
                                          className="bg-transparent font-bold text-gray-800 border-none focus:ring-0 focus:outline-hidden p-0 cursor-pointer"
                                        >
                                          {MONTHS_PT.map((m, mIdx) => (
                                            <option key={mIdx} value={mIdx}>
                                              {m.substring(0, 3)}
                                            </option>
                                          ))}
                                        </select>
                                        <span className="text-gray-300">|</span>
                                        <select
                                          value={calendarYear}
                                          onChange={(e) => setCalendarYear(parseInt(e.target.value, 10))}
                                          className="bg-transparent font-bold text-gray-800 border-none focus:ring-0 focus:outline-hidden p-0 cursor-pointer"
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
                                        className="p-0.5 hover:bg-white border border-gray-100 rounded text-gray-500 hover:text-black cursor-pointer"
                                      >
                                        <ChevronRight size={12} />
                                      </button>
                                    </div>

                                    {/* Weekdays */}
                                    <div className="grid grid-cols-7 gap-0.5 text-center">
                                      {WEEKDAYS_PT.map(day => (
                                        <span key={day} className="text-[8px] font-bold text-gray-400 uppercase font-mono">
                                          {day.substring(0, 1)}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Days Grid */}
                                    <div className="grid grid-cols-7 gap-0.5">
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
                                              setActiveCalendarVar(null);
                                            }}
                                            className={`h-5 text-[10px] font-sans font-medium rounded flex items-center justify-center transition-all cursor-pointer ${
                                              item.isCurrentMonth 
                                                ? isSel
                                                  ? 'bg-black text-white font-semibold'
                                                  : isCurrentToday
                                                    ? 'bg-neutral-200 text-black border border-gray-300 font-semibold'
                                                    : 'bg-white hover:bg-gray-100 text-gray-800'
                                                : 'text-gray-300 pointer-events-none'
                                            }`}
                                          >
                                            {item.day}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <InteractiveDivInput
                                id={`modal-input-${varName}`}
                                varName={varName}
                                value={values[varName] || ''}
                                onChange={(val) => handleInputChange(varName, val)}
                                placeholder={`Inserir valor para ${varName}...`}
                                isMultiline={isMultiline}
                                variablePresets={template?.variablePresets}
                                onFocus={() => setActiveFocusedVar(varName)}
                              />
                            )}

                            {/* Suggestions */}
                            {presets.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {presets.map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handlePresetSelect(varName, preset)}
                                    className="px-1.5 py-0.5 text-[9px] text-gray-500 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 rounded transition-all max-w-full truncate cursor-pointer font-sans"
                                    title={preset}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-500 italic py-4">Sem variáveis neste template.</p>
                    )}
                  </div>
                ) : (
                  /* Live Preview Tab */
                  <div className="flex-1 flex flex-col min-h-0">
                    <div 
                      style={{ fontSize: `${previewFontSize}px`, fontFamily: fontStyles[previewFontFamily] }}
                      className="bg-[#fcfcfd] border border-gray-200 rounded-xl p-4 text-gray-600 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto shadow-inner relative select-text"
                    >
                      {renderLivePreview()}
                    </div>
                    
                    {/* Font family and size adjustment buttons for PiP */}
                    <div className="flex items-center justify-between gap-1 mt-2 bg-gray-50 border border-gray-100 rounded-lg p-1.5 shrink-0 relative">
                      <div className="flex items-center gap-1 relative">
                        <button
                          type="button"
                          onClick={() => setShowPipFontToolbar(prev => !prev)}
                          className="px-2 py-1 text-[9px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md shadow-3xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Type size={10} className="text-gray-400" />
                          <span>Fonte: <span className="font-semibold text-black" style={{ fontFamily: fontStyles[previewFontFamily] }}>{previewFontFamily === 'sans' ? 'Inter' : previewFontFamily === 'cascadia' ? 'Cascadia' : previewFontFamily === 'outfit' ? 'Outfit' : previewFontFamily.charAt(0).toUpperCase() + previewFontFamily.slice(1)}</span></span>
                          <ChevronDown size={8} className={`text-gray-400 transition-transform ${showPipFontToolbar ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating Popover Font Toolbar for PiP */}
                        {showPipFontToolbar && (
                          <div className="absolute bottom-full mb-1 left-0 z-50 p-1 bg-white border border-gray-200 rounded-lg shadow-md flex items-center gap-0.5 animate-in slide-in-from-bottom-1 duration-150">
                            {(['sans', 'poppins', 'lexend', 'outfit', 'cascadia'] as const).map((font) => (
                              <button
                                key={font}
                                type="button"
                                onClick={() => {
                                  setPreviewFontFamily(font);
                                  setShowPipFontToolbar(false);
                                }}
                                className={`px-1.5 py-1 text-[8px] font-semibold rounded transition-all cursor-pointer whitespace-nowrap ${
                                  previewFontFamily === font
                                    ? 'bg-neutral-900 text-white shadow-3xs'
                                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                                }`}
                                style={{ fontFamily: fontStyles[font] }}
                              >
                                {font === 'sans' ? 'Inter' : font === 'cascadia' ? 'Cascadia' : font === 'outfit' ? 'Outfit' : font.charAt(0).toUpperCase() + font.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center bg-gray-200/60 rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={handleDecreaseFont}
                          className="px-1.5 py-0.5 text-[9px] font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-1 text-[9px] font-bold font-mono text-gray-700 min-w-[20px] text-center">
                          {previewFontSize}px
                        </span>
                        <button
                          type="button"
                          onClick={handleIncreaseFont}
                          className="px-1.5 py-0.5 text-[9px] font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* --- STANDARD OVERLAY FULL MODAL CONTENT --- */
              variables.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full flex-1 min-h-0">
                  
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
                          className="text-gray-400 hover:text-black flex items-center gap-1 text-[10px] font-mono transition-colors cursor-pointer"
                        >
                          <RefreshCw size={11} />
                          Limpar tudo
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                        {variables.map(varName => {
                          const isFilled = !!values[varName] && values[varName].trim() !== '';
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
                              <div className="flex justify-between items-center pb-1">
                                <label
                                  htmlFor={`modal-input-${varName}`}
                                  className="block text-[11px] font-bold text-gray-700 font-mono"
                                >
                                  {varName} {isMultiline && <span className="text-[10px] text-indigo-500 font-normal font-sans">(Grande)</span>}
                                </label>
                                <span className={`text-[10px] font-mono ${isFilled ? 'text-emerald-600' : 'text-amber-500'}`}>
                                  {isFilled ? 'Preenchido' : 'Pendente'}
                                </span>
                              </div>
                              
                              {isDate ? (
                                <div className="space-y-2">
                                  <div className="relative flex items-center">
                                    <input
                                      id={`modal-input-${varName}`}
                                      type="text"
                                      placeholder="DD/MM/AAAA ou texto..."
                                      value={values[varName] || ''}
                                      onChange={(e) => {
                                        handleDateInputChange(varName, e.target.value);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value.trim()) {
                                          const formatted = parseAndFormatDate(e.target.value);
                                          if (formatted !== e.target.value) {
                                            handleInputChange(varName, formatted);
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => handleFieldKeyDown(e, varName, true)}
                                      onFocus={() => setActiveFocusedVar(varName)}
                                      className="w-full px-3.5 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-2xs pr-10"
                                    />
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
                                  </div>

                                  {activeCalendarVar === varName && (
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
                                                setActiveCalendarVar(null);
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
                              ) : (
                                <InteractiveDivInput
                                  id={`modal-input-${varName}`}
                                  varName={varName}
                                  value={values[varName] || ''}
                                  onChange={(val) => handleInputChange(varName, val)}
                                  placeholder={`Inserir valor para ${varName}...`}
                                  isMultiline={isMultiline}
                                  variablePresets={template?.variablePresets}
                                  onFocus={() => setActiveFocusedVar(varName)}
                                />
                              )}

                              {/* Quick selection presets */}
                              {presets.length > 0 && (
                                <div className="space-y-1 mt-1.5">
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

                    {/* Bottom main actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-auto">
                      <button
                        id="modal-cancel-btn-bottom"
                        onClick={handleClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        id="modal-copy-btn-bottom"
                        onClick={handleCopy}
                        className={`px-5 py-2 rounded-lg font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                          copied
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-black hover:bg-neutral-800 text-white border-black'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check size={14} className="animate-bounce text-emerald-600" />
                            <span>Copiado com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar Resposta</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: High-fidelity document view */}
                  <div className="lg:col-span-7 flex flex-col min-h-0">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                        <Eye size={13} className="text-gray-500" />
                        Visualização do Texto Final
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {Object.values(values).filter(Boolean).length} de {variables.length} preenchidas
                      </span>
                    </div>

                    <div 
                      style={{ fontSize: `${previewFontSize}px`, fontFamily: fontStyles[previewFontFamily] }}
                      className="bg-[#fcfcfd] border border-gray-200 rounded-xl p-5 text-gray-600 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto max-h-[50vh] min-h-[250px] shadow-inner relative select-text"
                    >
                      {renderLivePreview()}
                    </div>

                    {/* Font family and size adjustment buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-gray-100 relative">
                      {/* Font Family Selector Trigger & Toolbar */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowFontToolbar(prev => !prev)}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in duration-100"
                        >
                          <Type size={11} className="text-gray-400" />
                          <span>Fonte: <span className="font-semibold text-black" style={{ fontFamily: fontStyles[previewFontFamily] }}>{previewFontFamily === 'sans' ? 'Inter' : previewFontFamily === 'cascadia' ? 'Cascadia' : previewFontFamily === 'outfit' ? 'Outfit' : previewFontFamily.charAt(0).toUpperCase() + previewFontFamily.slice(1)}</span></span>
                          <ChevronDown size={10} className={`text-gray-400 transition-transform ${showFontToolbar ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating Popover Font Toolbar */}
                        {showFontToolbar && (
                          <div className="absolute bottom-full mb-2 left-0 z-50 p-1.5 bg-white border border-gray-200 rounded-xl shadow-lg flex items-center gap-1 animate-in slide-in-from-bottom-2 duration-150">
                            {(['sans', 'poppins', 'lexend', 'outfit', 'cascadia'] as const).map((font) => (
                              <button
                                key={font}
                                type="button"
                                onClick={() => {
                                  setPreviewFontFamily(font);
                                  setShowFontToolbar(false);
                                }}
                                className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                                  previewFontFamily === font
                                    ? 'bg-neutral-900 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                                }`}
                                style={{ fontFamily: fontStyles[font] }}
                              >
                                {font === 'sans' ? 'Inter' : font === 'cascadia' ? 'Cascadia' : font === 'outfit' ? 'Outfit' : font.charAt(0).toUpperCase() + font.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Font Size Adjuster */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono">Tamanho do texto:</span>
                        <div className="flex items-center bg-gray-100/80 border border-gray-200 rounded-md p-0.5 shadow-3xs">
                          <button
                            type="button"
                            onClick={handleDecreaseFont}
                            className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                            title="Diminuir tamanho da fonte"
                          >
                            -
                          </button>
                          <span className="px-2 text-[10px] font-bold font-mono text-gray-700 min-w-[28px] text-center">
                            {previewFontSize}px
                          </span>
                          <button
                            type="button"
                            onClick={handleIncreaseFont}
                            className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                            title="Aumentar tamanho da fonte"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider font-mono pb-2 border-b border-gray-100">
                    <Eye size={13} className="text-gray-500" />
                    Conteúdo do Texto
                  </div>
                  <div 
                    style={{ fontSize: `${previewFontSize}px`, fontFamily: fontStyles[previewFontFamily] }}
                    className="bg-[#fcfcfd] p-5 rounded-xl border border-gray-200 text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto shadow-inner select-text"
                  >
                    {template.content}
                  </div>

                  {/* Font family and size adjustment buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-gray-100 relative">
                    {/* Font Family Selector Trigger & Toolbar */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowFontToolbar(prev => !prev)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in duration-100"
                      >
                        <Type size={11} className="text-gray-400" />
                        <span>Fonte: <span className="font-semibold text-black" style={{ fontFamily: fontStyles[previewFontFamily] }}>{previewFontFamily === 'sans' ? 'Inter' : previewFontFamily === 'cascadia' ? 'Cascadia' : previewFontFamily === 'outfit' ? 'Outfit' : previewFontFamily.charAt(0).toUpperCase() + previewFontFamily.slice(1)}</span></span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${showFontToolbar ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Floating Popover Font Toolbar */}
                      {showFontToolbar && (
                        <div className="absolute bottom-full mb-2 left-0 z-50 p-1.5 bg-white border border-gray-200 rounded-xl shadow-lg flex items-center gap-1 animate-in slide-in-from-bottom-2 duration-150">
                          {(['sans', 'poppins', 'lexend', 'outfit', 'cascadia'] as const).map((font) => (
                            <button
                              key={font}
                              type="button"
                              onClick={() => {
                                setPreviewFontFamily(font);
                                setShowFontToolbar(false);
                              }}
                              className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                                previewFontFamily === font
                                  ? 'bg-neutral-900 text-white shadow-xs'
                                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
                              }`}
                              style={{ fontFamily: fontStyles[font] }}
                            >
                              {font === 'sans' ? 'Inter' : font === 'cascadia' ? 'Cascadia' : font === 'outfit' ? 'Outfit' : font.charAt(0).toUpperCase() + font.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Font Size Adjuster */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-mono">Tamanho do texto:</span>
                      <div className="flex items-center bg-gray-100/80 border border-gray-200 rounded-md p-0.5 shadow-3xs">
                        <button
                          type="button"
                          onClick={handleDecreaseFont}
                          className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-[10px] font-bold font-mono text-gray-700 min-w-[28px] text-center">
                          {previewFontSize}px
                        </span>
                        <button
                          type="button"
                          onClick={handleIncreaseFont}
                          className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )
            )}
          </div>
        )}
          </>
        )}

        {externalPipWindow && createPortal(
          renderPipContent(),
          externalPipWindow.document.body
        )}
      </div>
    </div>
  );
}

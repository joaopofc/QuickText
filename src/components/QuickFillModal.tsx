import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Sliders, Eye, RefreshCw, Calendar, ChevronLeft, ChevronRight, Maximize2, Minimize2, Move, Layers, ExternalLink, ChevronDown } from 'lucide-react';
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
  const [activeCalendarVar, setActiveCalendarVar] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const lastEnterPressRef = useRef<{ time: number; varName: string | null }>({ time: 0, varName: null });

  // Picture-in-Picture (PiP) and floating states
  const [isPipMode, setIsPipMode] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pipTab, setPipTab] = useState<'fill' | 'preview'>('fill');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Real OS-level Document Picture-in-Picture (over other windows/tabs)
  const [externalPipWindow, setExternalPipWindow] = useState<Window | null>(null);
  const [showNativePipButton, setShowNativePipButton] = useState(true);

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

  useEffect(() => {
    if (externalPipWindow) {
      try {
        const body = externalPipWindow.document.body;
        if (isMinimized) {
          body.style.backgroundColor = '#000000';
          body.style.color = '#ffffff';
          externalPipWindow.resizeTo(320, 100);
        } else {
          body.style.backgroundColor = '#ffffff';
          body.style.color = '#0b0f19';
          externalPipWindow.resizeTo(480, 620);
        }
      } catch (e) {
        console.warn('Could not resize external PiP window:', e);
      }
    }
  }, [isMinimized, externalPipWindow]);

  const startExternalPip = async () => {
    if (!('documentPictureInPicture' in window)) {
      alert('Seu navegador não oferece suporte nativo ao Picture-in-Picture de Documentos. Para que flutue sobre qualquer outra aba ou aplicativo do computador, use o Google Chrome ou Microsoft Edge!');
      return;
    }

    try {
      // Close any existing one
      if (externalPipWindow) {
        externalPipWindow.close();
      }

      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: 480,
        height: 620,
      });

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
      });

      setExternalPipWindow(pipWin);
    } catch (err) {
      console.error('Falha ao abrir Picture-in-Picture externo:', err);
    }
  };

  const handleClose = () => {
    if (externalPipWindow) {
      try {
        externalPipWindow.close();
      } catch (e) {
        console.error(e);
      }
      setExternalPipWindow(null);
    }
    onClose();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
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
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
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
      try {
        const savedSettings = localStorage.getItem('quick_text_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          autoOpen = !!parsed.autoOpenPip;
          nativePipEnabled = parsed.enableNativePip !== false;
          if (parsed.defaultPipTab === 'fill' || parsed.defaultPipTab === 'preview') {
            initialTab = parsed.defaultPipTab;
          }
        }
      } catch (e) {
        console.error(e);
      }

      setPipTab(initialTab);
      setShowNativePipButton(nativePipEnabled);

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
          startExternalPip();
        }, 150);
      }
    }
  }, [template]);

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
      if (shouldClose) {
        setTimeout(() => {
          setCopied(false);
          setIsMinimized(true); // Minimize to a floating button/pill instead of closing!
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

  const renderPipContent = () => {
    if (!template) return null;

    if (isMinimized) {
      return (
        <div className="bg-black text-white h-screen w-screen flex items-center justify-between px-3.5 py-1.5 font-sans overflow-hidden select-none antialiased border border-neutral-800">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer text-white hover:text-gray-200 transition-all focus:outline-hidden truncate flex-1 mr-2 text-left"
            title="Expandir Assistente"
          >
            <Layers size={12} className="text-gray-300 animate-pulse shrink-0" />
            <span className="truncate">{template.title}</span>
          </button>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
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
      <div className="bg-white text-gray-950 h-screen w-screen flex flex-col font-sans overflow-hidden select-none antialiased">
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
                      
                      {isMultiline ? (
                        <textarea
                          id={`pip-input-${varName}`}
                          placeholder={`Inserir valor para ${varName}...`}
                          value={values[varName] || ''}
                          rows={3}
                          onChange={(e) => handleInputChange(varName, e.target.value)}
                          className="w-full px-3 py-1.5 bg-white text-xs text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-3xs resize-y"
                        />
                      ) : (
                        <div className="space-y-2">
                          <input
                            id={`pip-input-${varName}`}
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
                            onBlur={(e) => {
                              if (isDate && e.target.value.trim()) {
                                const formatted = parseAndFormatDate(e.target.value);
                                if (formatted !== e.target.value) {
                                  handleInputChange(varName, formatted);
                                }
                              }
                            }}
                            className="w-full px-3 py-1.5 bg-white text-xs text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-3xs"
                          />
                        </div>
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
              <div className="bg-[#fcfcfd] border border-gray-200 rounded-xl p-4 font-sans text-xs text-gray-800 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto shadow-inner select-text">
                {renderLivePreview()}
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
        className="bg-black text-white hover:bg-neutral-900 border border-neutral-800 shadow-xl flex items-center gap-2 px-3.5 py-2 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto select-none transition-all hover:scale-105"
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

  return (
    <div
      id="quick-fill-modal-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isPipMode 
          ? 'pointer-events-none bg-transparent' 
          : 'pointer-events-auto bg-black/45 backdrop-blur-xs'
      }`}
    >
      <div
        id="quick-fill-modal-content"
        onMouseDown={isPipMode ? handleMouseDown : undefined}
        onTouchStart={isPipMode ? handleTouchStart : undefined}
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
        className={`bg-white border border-gray-200 shadow-2xl flex flex-col pointer-events-auto transition-all ${
          isPipMode 
            ? 'rounded-2xl border-gray-300/90' 
            : 'max-w-4xl w-full rounded-xl overflow-hidden max-h-[85vh]'
        } ${isDragging ? 'select-none ring-1 ring-black/10' : ''}`}
      >
        {/* Modal Header / PIP Drag handle */}
        <div 
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
                onClick={startExternalPip}
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
              title={isPipMode ? "Voltar para o modo tela cheia" : "Entrar no modo flutuante (PiP)"}
            >
              <Layers size={13} />
            </button>

            {/* Minimize / Expand (Only in PiP mode) */}
            {isPipMode && (
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-all cursor-pointer"
                title={isMinimized ? "Expandir painel" : "Minimizar painel"}
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
            )}

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
                            
                            {isMultiline ? (
                              <textarea
                                id={`modal-input-${varName}`}
                                placeholder={`Inserir valor para ${varName}...`}
                                value={values[varName] || ''}
                                rows={2}
                                onChange={(e) => handleInputChange(varName, e.target.value)}
                                onKeyDown={(e) => handleFieldKeyDown(e, varName, isDate)}
                                className="w-full px-3 py-1.5 bg-white text-xs text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all font-sans shadow-3xs resize-y"
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
                                    onBlur={(e) => {
                                      if (isDate && e.target.value.trim()) {
                                        const formatted = parseAndFormatDate(e.target.value);
                                        if (formatted !== e.target.value) {
                                          handleInputChange(varName, formatted);
                                        }
                                      }
                                    }}
                                    onKeyDown={(e) => handleFieldKeyDown(e, varName, isDate)}
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
                    <div className="bg-[#fcfcfd] border border-gray-200 rounded-xl p-4 font-sans text-xs text-gray-800 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto shadow-inner relative select-text">
                      {renderLivePreview()}
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
                                      onBlur={(e) => {
                                        if (isDate && e.target.value.trim()) {
                                          const formatted = parseAndFormatDate(e.target.value);
                                          if (formatted !== e.target.value) {
                                            handleInputChange(varName, formatted);
                                          }
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
                              )}

                              {/* Quick selection presets */}
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

                    <div className="bg-[#fcfcfd] border border-gray-200 rounded-xl p-5 font-sans text-xs text-gray-800 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto max-h-[50vh] min-h-[250px] shadow-inner relative select-text">
                      {renderLivePreview()}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider font-mono pb-2 border-b border-gray-100">
                    <Eye size={13} className="text-gray-500" />
                    Conteúdo do Texto
                  </div>
                  <div className="bg-[#fcfcfd] p-5 rounded-xl border border-gray-200 font-sans text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto shadow-inner select-text">
                    {template.content}
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

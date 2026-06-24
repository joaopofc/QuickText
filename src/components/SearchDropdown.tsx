import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ArrowUpRight, Copy } from 'lucide-react';
import { Template } from '../types';
import { extractVariables } from '../utils/templateHelpers';

interface SearchDropdownProps {
  templates: Template[];
  onSelect: (template: Template) => void;
}

export default function SearchDropdown({ templates, onSelect }: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(false);

  // Detect platform on mount
  useEffect(() => {
    setIsMac(window.navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Close dropdown on click outside & register shortcut key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Focus search on Cmd+K, Ctrl+K, or simple / (when not typing in other inputs)
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || '')) ||
                       (document.activeElement as HTMLElement)?.isContentEditable;
      
      if (
        (event.key === 'k' && (event.metaKey || event.ctrlKey)) ||
        (event.key === '/' && !isTyping)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      // Start searching immediately when any normal printable character is typed
      if (!isTyping && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setSearchQuery((prev) => prev + event.key);
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredTemplates = templates.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.content.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  });

  return (
    <div id="search-dropdown-container" ref={dropdownRef} className="relative w-full max-w-2xl mx-auto z-20">
      {/* Input container */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors duration-150">
          <Search size={16} strokeWidth={2.5} />
        </div>
        <input
          id="search-templates-input"
          ref={inputRef}
          type="text"
          placeholder="Pesquisar por título, categoria ou conteúdo..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (filteredTemplates.length === 1) {
                e.preventDefault();
                onSelect(filteredTemplates[0]);
                setIsOpen(false);
                setSearchQuery('');
                inputRef.current?.blur();
              }
            }
          }}
          className="w-full pl-10 pr-16 py-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg shadow-2xs focus:border-black focus:outline-hidden transition-all duration-150 font-sans"
        />
        
        {/* Shortcut badge / helper */}
        <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 pointer-events-none select-none">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-sans font-medium text-gray-400 bg-gray-50 border border-gray-200/80 rounded-sm">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          id="search-dropdown-menu"
          className="absolute w-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {filteredTemplates.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
                Textos encontrados ({filteredTemplates.length})
              </div>
              {filteredTemplates.map((template) => {
                const firstLine = template.content.split('\n')[0];
                const hasVars = extractVariables(template.content).length > 0;
                return (
                  <button
                    id={`dropdown-item-${template.id}`}
                    key={template.id}
                    onClick={() => {
                      onSelect(template);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors duration-150 border-b border-gray-50 last:border-b-0 group"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-gray-900 truncate group-hover:text-black">
                          {template.title}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200/50">
                          {template.category}
                        </span>
                        {hasVars && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                            Preencher
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate font-sans">
                        {firstLine || 'Sem conteúdo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 group-hover:text-black opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0">
                      <span>{hasVars ? 'Preencher' : 'Copiar'}</span>
                      {hasVars ? <ArrowUpRight size={11} /> : <Copy size={11} />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Nenhum texto padrão encontrado para "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

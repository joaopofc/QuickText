import React, { useState, useEffect } from 'react';
import { X, Copy, Check, AlertCircle, Sliders, Database, Trash2, RotateCcw, FileText, Eye } from 'lucide-react';
import { Template } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onImport: (importedTemplates: Template[], overwrite: boolean) => void;
  onRemoveSamples: () => void;
  onRestoreSamples: () => void;
  onOpenPositionEditor?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  templates,
  onImport,
  onRemoveSamples,
  onRestoreSamples,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'preferences' | 'backup'>('preferences');
  
  // Settings states
  const [autoOpenPip, setAutoOpenPip] = useState(false);
  const [enableNativePip, setEnableNativePip] = useState(true);
  const [defaultPipTab, setDefaultPipTab] = useState<'fill' | 'preview'>('fill');

  // Backup states
  const [copiedCode, setCopiedCode] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');

  // Count samples currently loaded
  const sampleCount = templates.filter(t => t.id.startsWith('tpl-')).length;

  // Load settings on mount / open
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('quick_text_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAutoOpenPip(!!parsed.autoOpenPip);
          setEnableNativePip(parsed.enableNativePip !== false);
          setDefaultPipTab(parsed.defaultPipTab === 'preview' ? 'preview' : 'fill');
        }
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      }
      setImportError(null);
      setImportSuccess(null);
      setImportText('');
    }
  }, [isOpen]);

  // Save settings when changed
  const handleSaveSettings = (updates: { autoOpenPip?: boolean; enableNativePip?: boolean; defaultPipTab?: 'fill' | 'preview' }) => {
    const nextSettings = {
      autoOpenPip: updates.autoOpenPip !== undefined ? updates.autoOpenPip : autoOpenPip,
      enableNativePip: updates.enableNativePip !== undefined ? updates.enableNativePip : enableNativePip,
      defaultPipTab: updates.defaultPipTab !== undefined ? updates.defaultPipTab : defaultPipTab,
    };

    if (updates.autoOpenPip !== undefined) setAutoOpenPip(updates.autoOpenPip);
    if (updates.enableNativePip !== undefined) setEnableNativePip(updates.enableNativePip);
    if (updates.defaultPipTab !== undefined) setDefaultPipTab(updates.defaultPipTab);

    localStorage.setItem('quick_text_settings', JSON.stringify(nextSettings));
  };

  // Generate Base64 (preserves position order)
  const getBase64Data = () => {
    try {
      const cleanData = templates.map(({ title, content, category, variablePresets, order }, idx) => ({
        title,
        content,
        category,
        variablePresets: variablePresets || {},
        order: typeof order === 'number' ? order : idx + 1,
      }));
      const jsonStr = JSON.stringify(cleanData);
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  const base64Code = getBase64Data();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(base64Code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const parseAndValidate = (rawStr: string): Template[] | null => {
    try {
      let parsed: any;
      const trimmed = rawStr.trim();
      
      const decoded = decodeURIComponent(escape(atob(trimmed)));
      parsed = JSON.parse(decoded);

      const list = Array.isArray(parsed) ? parsed : [parsed];
      const validated: Template[] = [];

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item.title || !item.content) {
          throw new Error('Todos os modelos precisam ter "title" e "content".');
        }
        validated.push({
          id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: String(item.title),
          content: String(item.content),
          category: String(item.category || 'Geral'),
          usageCount: Number(item.usageCount || 0),
          createdAt: new Date().toISOString(),
          variablePresets: item.variablePresets || {},
          order: typeof item.order === 'number' ? item.order : i + 1,
        });
      }

      return validated;
    } catch (e: any) {
      setImportError('Código inválido ou corrompido.');
      return null;
    }
  };

  const handleImportSubmit = () => {
    setImportError(null);
    setImportSuccess(null);
    if (!importText.trim()) {
      setImportError('Insira o código de sincronização.');
      return;
    }

    const validated = parseAndValidate(importText);
    if (validated) {
      onImport(validated, importMode === 'overwrite');
      setImportSuccess(`${validated.length} modelo(s) importado(s) com sucesso!`);
      setImportText('');
      setTimeout(() => {
        setImportSuccess(null);
        onClose();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settings-modal-content"
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-neutral-100 flex flex-col"
      >
        {/* Sleek Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-neutral-50">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight font-sans">
              Configurações
            </h2>
            <p className="text-[11px] text-neutral-400 font-normal">
              Ajustes finos do assistente e seus dados
            </p>
          </div>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        {/* Minimalist Tab Navigation */}
        <div className="px-6 pt-3 pb-1">
          <div className="bg-neutral-50 p-0.5 rounded-xl flex items-center gap-1 text-[11px] font-semibold border border-neutral-100/50">
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-white text-neutral-950 shadow-3xs font-bold border border-neutral-100/40'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Sliders size={12} />
              <span>Preferências</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-white text-neutral-950 shadow-3xs font-bold border border-neutral-100/40'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Database size={12} />
              <span>Backup &amp; Dados</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] min-h-[300px]">
          {activeTab === 'preferences' ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Option 1: autoOpenPip */}
              <div className="flex items-center justify-between py-1">
                <div className="pr-3">
                  <span className="text-[12px] font-semibold text-neutral-800 block">
                    Destaque automático
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal leading-normal block mt-0.5 max-w-[220px]">
                    Inicia a janela flutuante de forma instantânea ao preencher
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={autoOpenPip}
                    onChange={(e) => handleSaveSettings({ autoOpenPip: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5.5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:bg-neutral-900 shadow-3xs"></div>
                </label>
              </div>

              <div className="h-[1px] bg-neutral-100/70" />

              {/* Option 2: enableNativePip */}
              <div className="flex items-center justify-between py-1">
                <div className="pr-3">
                  <span className="text-[12px] font-semibold text-neutral-800 block">
                    Botão "Fixar no Topo"
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal leading-normal block mt-0.5 max-w-[220px]">
                    Mostra o atalho do PiP nativo em navegadores compatíveis
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={enableNativePip}
                    onChange={(e) => handleSaveSettings({ enableNativePip: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5.5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:bg-neutral-900 shadow-3xs"></div>
                </label>
              </div>

              <div className="h-[1px] bg-neutral-100/70" />

              {/* Option 3: defaultPipTab */}
              <div className="py-1 space-y-2">
                <div>
                  <span className="text-[12px] font-semibold text-neutral-800 block">
                    Aba inicial do assistente
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal leading-normal block mt-0.5">
                    Modo padrão do painel ao ser acionado
                  </span>
                </div>

                <div className="flex bg-neutral-50 p-0.5 rounded-lg border border-neutral-100/50 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ defaultPipTab: 'fill' })}
                    className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center font-medium flex items-center justify-center gap-1.5 ${
                      defaultPipTab === 'fill'
                        ? 'bg-white text-neutral-950 shadow-3xs font-bold border border-neutral-100/40'
                        : 'text-neutral-500 hover:text-neutral-950'
                    }`}
                  >
                    <FileText size={11} />
                    <span>Preencher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ defaultPipTab: 'preview' })}
                    className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center font-medium flex items-center justify-center gap-1.5 ${
                      defaultPipTab === 'preview'
                        ? 'bg-white text-neutral-950 shadow-3xs font-bold border border-neutral-100/40'
                        : 'text-neutral-500 hover:text-neutral-950'
                    }`}
                  >
                    <Eye size={11} />
                    <span>Visualizar</span>
                  </button>
                </div>
              </div>

              <div className="h-[1px] bg-neutral-100/70" />

              {/* Option 4: Modelos de Exemplo */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-[12px] font-semibold text-neutral-800 block">
                    Modelos de Amostra
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal leading-normal block mt-0.5 max-w-[200px]">
                    {sampleCount > 0 
                      ? `Há ${sampleCount} modelos de amostra integrados ativos` 
                      : 'Modelos de amostra originais estão ocultados'}
                  </span>
                </div>

                {sampleCount > 0 ? (
                  <button
                    type="button"
                    onClick={onRemoveSamples}
                    className="px-2.5 py-1.5 text-[10px] font-bold text-neutral-600 hover:text-red-600 bg-neutral-50 hover:bg-red-50 border border-neutral-200/60 hover:border-red-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Trash2 size={11} />
                    <span>Ocultar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onRestoreSamples}
                    className="px-2.5 py-1.5 text-[10px] font-bold text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-3xs"
                  >
                    <RotateCcw size={11} />
                    <span>Restaurar</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Export Panel */}
              <div className="space-y-2">
                <div>
                  <span className="text-[12px] font-semibold text-neutral-900 block">
                    Exportar Backup
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal block mt-0.5">
                    Gera uma assinatura segura codificada com seus modelos
                  </span>
                </div>

                <button
                  id="export-btn-copy"
                  onClick={handleCopyCode}
                  className="w-full py-1.5 px-3 bg-neutral-950 hover:bg-neutral-900 text-white rounded-lg transition-all font-sans text-[11px] font-bold shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check size={12} className="text-emerald-400 animate-pulse" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copiar Chave de Backup</span>
                    </>
                  )}
                </button>
              </div>

              <div className="h-[1px] bg-neutral-100/70" />

              {/* Import Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[12px] font-semibold text-neutral-900 block">
                      Importar Backup
                    </span>
                    <span className="text-[10px] text-neutral-400 font-normal block mt-0.5">
                      Restaure modelos a partir de um código anterior
                    </span>
                  </div>
                </div>

                {/* Import Mode Switcher */}
                <div className="flex bg-neutral-50 p-0.5 rounded-lg border border-neutral-100/50 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center ${
                      importMode === 'merge'
                        ? 'bg-white text-neutral-950 shadow-3xs font-bold border border-neutral-100/40'
                        : 'text-neutral-400 hover:text-neutral-800'
                    }`}
                  >
                    Mesclar ao atual
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('overwrite')}
                    className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center ${
                      importMode === 'overwrite'
                        ? 'bg-white text-red-700 shadow-3xs font-bold border border-red-100/30'
                        : 'text-neutral-400 hover:text-red-500'
                    }`}
                  >
                    Substituir tudo
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Cole seu código de sincronização ou backup aqui..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[10px] font-mono focus:border-neutral-950 focus:outline-hidden bg-neutral-50/50 text-neutral-800 resize-none shadow-inner placeholder:text-neutral-300"
                  />
                </div>

                <button
                  onClick={handleImportSubmit}
                  className="w-full py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-850 hover:text-neutral-950 text-[11px] font-bold rounded-lg transition-all cursor-pointer border border-neutral-200/50 flex items-center justify-center gap-1.5"
                >
                  <Database size={11} />
                  <span>Validar e Importar</span>
                </button>

                {importError && (
                  <div className="p-2 bg-red-50 text-red-600 border border-red-100/60 rounded-lg text-[10px] flex items-center gap-1.5 animate-in fade-in duration-200">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100/60 rounded-lg text-[10px] flex items-center gap-1.5 animate-in fade-in duration-200">
                    <Check size={12} className="shrink-0 text-emerald-600" />
                    <span>{importSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Minimalist Footer */}
        <div className="px-6 py-4 bg-neutral-50/50 flex items-center justify-end shrink-0 border-t border-neutral-100">
          <button
            id="settings-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-white font-sans text-[11px] font-bold rounded-lg shadow-3xs transition-all cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}


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
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settings-modal-content"
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100 flex flex-col"
      >
        {/* Minimalist Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight font-sans">
              Configurações
            </h2>
            <p className="text-xs text-gray-400 font-normal">
              Ajustes do assistente e gerenciamento de dados
            </p>
          </div>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Minimalist Segmented Control Tabs */}
        <div className="px-6 pb-2">
          <div className="bg-gray-100/80 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sliders size={13} />
              <span>Preferências</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Database size={13} />
              <span>Backup &amp; Dados</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-3 space-y-5 overflow-y-auto max-h-[60vh]">
          {activeTab === 'preferences' ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Option 1: autoOpenPip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <div className="pr-3">
                  <span className="text-xs font-bold text-gray-800 block">
                    Destacar automaticamente
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal leading-tight block mt-0.5">
                    Abre a janela flutuante ao selecionar um texto para preencher
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoOpenPip}
                    onChange={(e) => handleSaveSettings({ autoOpenPip: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {/* Option 2: enableNativePip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <div className="pr-3">
                  <span className="text-xs font-bold text-gray-800 block">
                    Botão "Fixar no Topo"
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal leading-tight block mt-0.5">
                    Exibe o atalho para destaque em navegadores compatíveis
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enableNativePip}
                    onChange={(e) => handleSaveSettings({ enableNativePip: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {/* Option 3: defaultPipTab */}
              <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Aba inicial do assistente
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal leading-tight block mt-0.5">
                    Como o assistente é exibido ao ser aberto
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ defaultPipTab: 'fill' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      defaultPipTab === 'fill'
                        ? 'bg-black text-white border-black shadow-2xs font-bold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={12} />
                    <span>Preencher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ defaultPipTab: 'preview' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      defaultPipTab === 'preview'
                        ? 'bg-black text-white border-black shadow-2xs font-bold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Eye size={12} />
                    <span>Visualizar</span>
                  </button>
                </div>
              </div>

              {/* Option 4: Modelos de Exemplo */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Modelos de Exemplo
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal leading-tight block mt-0.5">
                    {sampleCount > 0 ? 'Modelos padrão ativos' : 'Modelos padrão ocultados'}
                  </span>
                </div>

                {sampleCount > 0 ? (
                  <button
                    type="button"
                    onClick={onRemoveSamples}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Trash2 size={12} />
                    <span>Ocultar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onRestoreSamples}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-black bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-3xs"
                  >
                    <RotateCcw size={12} />
                    <span>Restaurar</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Export Panel */}
              <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2.5">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Exportar Backup
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal block mt-0.5">
                    Gera um código com todos os seus modelos e posições
                  </span>
                </div>

                <button
                  id="export-btn-copy"
                  onClick={handleCopyCode}
                  className="w-full py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-lg transition-colors font-sans text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copiar Código de Backup</span>
                    </>
                  )}
                </button>
              </div>

              {/* Import Panel */}
              <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Importar Backup
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal block mt-0.5">
                    Restaure seus modelos colando um código de backup
                  </span>
                </div>

                {/* Import Mode Switcher */}
                <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-lg border border-gray-200 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`py-1 rounded-md transition-all cursor-pointer text-center text-[11px] ${
                      importMode === 'merge'
                        ? 'bg-gray-100 text-gray-900 font-bold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Mesclar aos atuais
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('overwrite')}
                    className={`py-1 rounded-md transition-all cursor-pointer text-center text-[11px] ${
                      importMode === 'overwrite'
                        ? 'bg-rose-50 text-rose-700 font-bold'
                        : 'text-gray-500 hover:text-rose-600'
                    }`}
                  >
                    Substituir tudo
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole o código de backup aqui..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:border-black focus:outline-hidden bg-white text-gray-800 resize-none shadow-3xs placeholder:text-gray-300"
                />

                <button
                  onClick={handleImportSubmit}
                  className="w-full py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  Importar Backup
                </button>

                {importError && (
                  <div className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs flex items-center gap-1.5">
                    <Check size={13} className="shrink-0 text-emerald-600" />
                    <span>{importSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Minimalist Footer */}
        <div className="px-6 py-3.5 bg-gray-50/50 flex items-center justify-end shrink-0 border-t border-gray-100">
          <button
            id="settings-done-btn"
            onClick={onClose}
            className="px-5 py-1.5 bg-black hover:bg-neutral-800 text-white font-sans text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}


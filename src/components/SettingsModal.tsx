import React, { useState, useEffect } from 'react';
import { X, Settings, Download, Trash2, RotateCcw, Check, Copy, AlertCircle, HelpCircle, Sliders, Database, Eye, FileText } from 'lucide-react';
import { Template } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onImport: (importedTemplates: Template[], overwrite: boolean) => void;
  onRemoveSamples: () => void;
  onRestoreSamples: () => void;
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

  // Help visibility state
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({});

  const toggleHelp = (key: string) => {
    setShowHelp(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Count samples currently loaded
  const sampleCount = templates.filter(t => t.id.startsWith('tpl-')).length;
  const userCreatedCount = templates.length - sampleCount;

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

  // Generate Base64
  const getBase64Data = () => {
    try {
      const cleanData = templates.map(({ title, content, category, variablePresets }) => ({
        title,
        content,
        category,
        variablePresets: variablePresets || {}
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

      for (const item of list) {
        if (!item.title || !item.content) {
          throw new Error('Todos os templates precisam ter "title" e "content".');
        }
        validated.push({
          id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: String(item.title),
          content: String(item.content),
          category: String(item.category || 'Geral'),
          usageCount: Number(item.usageCount || 0),
          createdAt: new Date().toISOString(),
          variablePresets: item.variablePresets || {}
        });
      }

      return validated;
    } catch (e: any) {
      setImportError('Código inválido ou corrompido. Verifique o formato.');
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
      }, 1500);
    }
  };

  // Helper buttons to prevent repetitive code
  const HelpButton = ({ id }: { id: string }) => (
    <button
      type="button"
      onClick={() => toggleHelp(id)}
      className={`p-1 rounded-md transition-colors cursor-pointer ${
        showHelp[id] ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title="Mais informações"
    >
      <HelpCircle size={13} />
    </button>
  );

  const HelpText = ({ id, text }: { id: string; text: string }) => {
    if (!showHelp[id]) return null;
    return (
      <div className="p-2.5 bg-indigo-50/75 text-indigo-950 text-[11px] rounded-lg border border-indigo-100/60 leading-relaxed animate-in slide-in-from-top-1 duration-150">
        {text}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        id="settings-modal-content"
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-gray-900" />
            <h2 className="font-sans font-bold text-gray-950 text-xs tracking-tight uppercase font-mono">
              Configurações
            </h2>
          </div>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer"
            title="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Links - Clean, Icon-based */}
        <div className="flex border-b border-gray-100 bg-neutral-50/30 px-5 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            <Sliders size={13} />
            <span>Preferências</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            <Database size={13} />
            <span>Backup &amp; Sincronização</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans scrollbar-none max-h-[50vh]">
          {activeTab === 'preferences' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Picture-in-Picture ("Fixar no Topo") Settings */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                    📌 Assistente Flutuante (Fixar)
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Option 1: autoOpenPip */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={autoOpenPip}
                          onChange={(e) => handleSaveSettings({ autoOpenPip: e.target.checked })}
                          className="accent-black h-3.5 w-3.5 rounded border-gray-300 focus:ring-black"
                        />
                        <span className="text-xs font-bold text-gray-800 group-hover:text-black transition-colors">
                          Destacar automaticamente
                        </span>
                      </label>
                      <HelpButton id="pip-auto" />
                    </div>
                    <HelpText 
                      id="pip-auto" 
                      text="Abre automaticamente o formulário em uma janela flutuante externa ( Picture-in-Picture ) ao selecionar um modelo para preencher." 
                    />
                  </div>

                  {/* Option 2: enableNativePip */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={enableNativePip}
                          onChange={(e) => handleSaveSettings({ enableNativePip: e.target.checked })}
                          className="accent-black h-3.5 w-3.5 rounded border-gray-300 focus:ring-black"
                        />
                        <span className="text-xs font-bold text-gray-800 group-hover:text-black transition-colors">
                          Exibir botão "Fixar no Topo"
                        </span>
                      </label>
                      <HelpButton id="pip-btn" />
                    </div>
                    <HelpText 
                      id="pip-btn" 
                      text="Exibe o botão de destaque manual no formulário. Útil para navegadores compatíveis (Chrome, Edge)." 
                    />
                  </div>

                  {/* Option 3: defaultPipTab */}
                  <div className="space-y-1 pt-1.5 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 block">
                        Aba inicial do assistente:
                      </label>
                      <HelpButton id="pip-tab" />
                    </div>
                    
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="defaultPipTab"
                          checked={defaultPipTab === 'fill'}
                          onChange={() => handleSaveSettings({ defaultPipTab: 'fill' })}
                          className="accent-black"
                        />
                        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                          <FileText size={11} className="text-gray-400" />
                          Preencher
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="defaultPipTab"
                          checked={defaultPipTab === 'preview'}
                          onChange={() => handleSaveSettings({ defaultPipTab: 'preview' })}
                          className="accent-black"
                        />
                        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                          <Eye size={11} className="text-gray-400" />
                          Visualizar
                        </span>
                      </label>
                    </div>

                    <HelpText 
                      id="pip-tab" 
                      text="Define se o assistente flutuante inicia diretamente com o formulário de preenchimento (Preencher) ou no texto resultante (Visualizar)." 
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Sample Templates Controls ("Amostras") */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                    🎨 Modelos de Amostra
                  </span>
                  <HelpButton id="samples" />
                </div>
                
                <HelpText 
                  id="samples" 
                  text="A plataforma inclui modelos de vendas e suporte de amostra por padrão. Você pode removê-los para focar apenas nos seus ou restaurá-los se precisar." 
                />

                <div className="p-3 bg-neutral-50/80 rounded-lg border border-gray-100 flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <p className="font-bold text-gray-800 text-[11px]">
                      Modelos de Exemplo
                    </p>
                    <p className="text-gray-500 text-[10px] font-mono">
                      {sampleCount > 0 
                        ? `${sampleCount} ativos / ${userCreatedCount} criados por você` 
                        : `Ocultados / ${userCreatedCount} criados por você`}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {sampleCount > 0 ? (
                      <button
                        type="button"
                        onClick={onRemoveSamples}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:text-white bg-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-all cursor-pointer shadow-3xs"
                      >
                        <Trash2 size={11} />
                        <span>Remover</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onRestoreSamples}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:text-black bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all cursor-pointer shadow-3xs"
                      >
                        <RotateCcw size={11} />
                        <span>Restaurar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Export Panel */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                    📥 Exportar Backup
                  </span>
                  <HelpButton id="export" />
                </div>

                <HelpText 
                  id="export" 
                  text="Copia todos os seus modelos de texto para a área de transferência em formato codificado de segurança para salvar onde desejar." 
                />
                
                <button
                  id="export-btn-copy"
                  onClick={handleCopyCode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg transition-colors font-sans text-xs font-bold shadow-3xs cursor-pointer"
                >
                  {copiedCode ? (
                    <Check size={13} className="text-emerald-400" />
                  ) : (
                    <Copy size={13} className="text-gray-300" />
                  )}
                  <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código de Backup'}</span>
                </button>
              </div>

              <hr className="border-gray-100" />

              {/* Import Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                    📤 Importar Backup
                  </span>
                  <HelpButton id="import" />
                </div>

                <HelpText 
                  id="import" 
                  text="Insira o código de backup gerado anteriormente para restaurar ou mesclar seus modelos de texto." 
                />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-4 bg-neutral-50 p-2 rounded-md border border-gray-100 text-[11px]">
                    <span className="font-bold text-gray-700 font-mono">Modo:</span>
                    <label className="flex items-center gap-1 text-gray-600 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="settingsImportMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="accent-black"
                      />
                      <span>Mesclar</span>
                    </label>
                    <label className="flex items-center gap-1 text-gray-600 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="settingsImportMode"
                        checked={importMode === 'overwrite'}
                        onChange={() => setImportMode('overwrite')}
                        className="accent-black"
                      />
                      <span className="text-red-600">Sobrescrever</span>
                    </label>
                  </div>

                  <textarea
                    rows={3}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Cole aqui o código de transferência ou backup..."
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:border-black focus:outline-hidden bg-white text-gray-800 resize-none shadow-3xs"
                  />
                  <button
                    onClick={handleImportSubmit}
                    className="w-full py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors shadow-3xs cursor-pointer"
                  >
                    Confirmar Importação
                  </button>
                </div>

                {importError && (
                  <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs flex items-start gap-2">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs flex items-start gap-2">
                    <Check size={13} className="shrink-0 mt-0.5" />
                    <span>{importSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-50/80 flex items-center justify-end shrink-0 border-t border-gray-100">
          <button
            id="settings-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

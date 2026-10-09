import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Sliders, Database, Trash2, RotateCcw, FileText, Eye, Globe } from 'lucide-react';
import { Template } from '../types';
import { extractBackupCodeFromUrl, parseAndValidateBackupCode } from '../utils/urlBackupHelper';
import UrlImportConfirmModal from './UrlImportConfirmModal';

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
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');

  // URL backup confirmation candidate
  const [urlConfirmCandidate, setUrlConfirmCandidate] = useState<{
    templates: Template[];
    paramName: string;
    sourceUrl?: string;
  } | null>(null);

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
      setUrlConfirmCandidate(null);
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

  const parseAndValidate = (rawStr: string): Template[] | null => {
    const res = parseAndValidateBackupCode(rawStr);
    if (!res) {
      setImportError('Código inválido ou corrompido.');
    }
    return res;
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

  const handleImportFromUrl = () => {
    setImportError(null);
    setImportSuccess(null);

    const found = extractBackupCodeFromUrl();
    if (!found) {
      setImportError('Nenhum parâmetro de backup (code, modelos, templates, backup, data) encontrado na URL.');
      return;
    }

    // Busca e cola o código da URL diretamente no campo para transparência
    setImportText(found.code);

    const validated = parseAndValidateBackupCode(found.code);
    if (!validated || validated.length === 0) {
      setImportError(`Não foi possível decodificar os modelos do parâmetro "?${found.param}".`);
      return;
    }

    // Abre pop-up para escolher mesclar atual ou substituir tudo
    setUrlConfirmCandidate({
      templates: validated,
      paramName: found.param,
      sourceUrl: found.fullUrl,
    });
  };

  const handleExecuteUrlConfirm = (mode: 'merge' | 'overwrite') => {
    if (!urlConfirmCandidate) return;
    onImport(urlConfirmCandidate.templates, mode === 'overwrite');
    setImportSuccess(`${urlConfirmCandidate.templates.length} modelo(s) importado(s) da URL com sucesso (${mode === 'merge' ? 'mesclado' : 'substituído'})!`);
    setUrlConfirmCandidate(null);
    setTimeout(() => {
      setImportSuccess(null);
      onClose();
    }, 1200);
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
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[12px] font-semibold text-neutral-900 block">
                    Backup &amp; Sincronização
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal block mt-0.5">
                    Importe colando o código de sincronização ou diretamente pela URL
                  </span>
                </div>
              </div>

              {/* Mode Switcher: Mesclar ao atual / Substituir tudo */}
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

              {/* Textarea for synchronization code */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole seu código de sincronização ou backup aqui..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[10px] font-mono focus:border-neutral-950 focus:outline-hidden bg-neutral-50/50 text-neutral-800 resize-none shadow-inner placeholder:text-neutral-300"
                />
              </div>

              {/* Minimalist Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  id="btn-import-submit"
                  onClick={handleImportSubmit}
                  className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-850 hover:text-neutral-950 text-[11px] font-bold rounded-lg transition-all cursor-pointer border border-neutral-200/50 flex items-center justify-center gap-1.5"
                >
                  <Database size={11} />
                  <span>Validar e Importar</span>
                </button>

                <button
                  type="button"
                  id="btn-import-url"
                  onClick={handleImportFromUrl}
                  className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                  title="Busca o código da URL do navegador, cola no campo e abre o pop-up para mesclar ou substituir"
                >
                  <Globe size={11} />
                  <span>Importar por URL</span>
                </button>
              </div>

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

      {/* URL Import Confirmation Modal */}
      <UrlImportConfirmModal
        isOpen={urlConfirmCandidate !== null}
        onClose={() => setUrlConfirmCandidate(null)}
        candidate={urlConfirmCandidate}
        onConfirm={handleExecuteUrlConfirm}
      />
    </div>
  );
}


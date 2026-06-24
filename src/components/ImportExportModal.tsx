import React, { useState } from 'react';
import { X, Download, Copy, Check, AlertCircle } from 'lucide-react';
import { Template } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onImport: (importedTemplates: Template[], overwrite: boolean) => void;
}

export default function ImportExportModal({ isOpen, onClose, templates, onImport }: ImportExportModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');

  if (!isOpen) return null;

  // Generate compact Base64 string of templates
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

  // Helper to parse and validate imported items
  const parseAndValidate = (rawStr: string): Template[] | null => {
    try {
      let parsed: any;
      const trimmed = rawStr.trim();
      
      // Decode base64
      const decoded = decodeURIComponent(escape(atob(trimmed)));
      parsed = JSON.parse(decoded);

      const list = Array.isArray(parsed) ? parsed : [parsed];
      const validated: Template[] = [];

      for (const item of list) {
        if (!item.title || !item.content) {
          throw new Error('Todos os templates importados precisam ter "title" e "content" preenchidos.');
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
      setImportError('Código inválido, incorreto ou corrompido. Verifique o formato.');
      return null;
    }
  };

  // Handle manual code import
  const handleTextImportSubmit = () => {
    setImportError(null);
    setImportSuccess(null);
    if (!importText.trim()) {
      setImportError('Insira o código compacto para importar.');
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

  return (
    <div
      id="import-export-modal-overlay"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="import-export-modal-content"
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-150"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-neutral-50">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-gray-900" />
            <h2 className="font-sans font-bold text-gray-950 text-sm tracking-tight">
              Sincronização: Importar &amp; Exportar
            </h2>
          </div>
          <button
            id="import-export-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors p-1 rounded-md hover:bg-gray-100"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-600 leading-relaxed font-sans scrollbar-thin">
          
          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">
              📥 Exportar Meus Textos
            </h3>
            <p className="text-xs text-gray-500">
              Copie o código compacto abaixo para salvar um backup completo ou transferir seus {templates.length} modelos atuais de textos e variáveis para outro navegador ou dispositivo.
            </p>
            
            <div className="pt-1">
              <button
                id="export-btn-copy"
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-black hover:bg-neutral-800 text-white rounded-lg transition-colors font-sans text-xs font-semibold shadow-2xs group cursor-pointer"
              >
                {copiedCode ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                )}
                <span>{copiedCode ? 'Código Copiado com Sucesso!' : 'Copiar Código Compacto de Sincronização'}</span>
              </button>
            </div>
            
            {copiedCode && (
              <p className="text-[10px] text-emerald-600 font-mono text-center animate-pulse">
                Código de transferência copiado! Cole-o no outro computador ou guarde-o em segurança.
              </p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Import Options */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">
              📤 Importar Textos para a Plataforma
            </h3>
            
            {/* Mode selection (merge vs overwrite) */}
            <div className="space-y-1.5 bg-neutral-50 p-3.5 rounded-lg border border-gray-100">
              <label className="text-xs font-semibold text-gray-800 block">Modo de Importação:</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-black"
                  />
                  <span><strong>Mesclar</strong> (adicionar aos textos atuais)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'overwrite'}
                    onChange={() => setImportMode('overwrite')}
                    className="accent-black"
                  />
                  <span><strong>Sobrescrever</strong> (apagar atuais e substituir)</span>
                </label>
              </div>
            </div>

            {/* Paste compact text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">Colar Código de Sincronização</label>
              <textarea
                id="import-textarea-code"
                rows={4}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Cole aqui o código compacto copiado anteriormente..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:border-black focus:outline-hidden bg-white text-gray-800 resize-none"
              />
              <button
                id="import-btn-manual-submit"
                onClick={handleTextImportSubmit}
                className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Confirmar Importação de Dados
              </button>
            </div>

            {/* Error / Success messages */}
            {importError && (
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs flex items-start gap-2 animate-shake">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs flex items-start gap-2">
                <Check size={14} className="shrink-0 mt-0.5" />
                <span>{importSuccess}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 flex items-center justify-end gap-3 shrink-0 border-t border-gray-100">
          <button
            id="import-export-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-sans text-xs font-semibold border border-gray-200 rounded-md transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

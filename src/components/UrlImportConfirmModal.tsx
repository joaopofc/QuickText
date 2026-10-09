import React, { useState } from 'react';
import { X, Check, Globe, Layers, AlertTriangle } from 'lucide-react';
import { Template } from '../types';

interface UrlImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    templates: Template[];
    paramName: string;
    sourceUrl?: string;
  } | null;
  onConfirm: (mode: 'merge' | 'overwrite') => void;
}

export default function UrlImportConfirmModal({
  isOpen,
  onClose,
  candidate,
  onConfirm,
}: UrlImportConfirmModalProps) {
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');

  if (!isOpen || !candidate) return null;

  const count = candidate.templates.length;

  return (
    <div
      id="url-import-confirm-modal-overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="url-import-confirm-modal-content"
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-neutral-100 animate-in zoom-in-95 duration-200 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-100 text-neutral-900 rounded-xl border border-neutral-200/60">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight font-sans">
                Importar Modelos da URL
              </h3>
              <p className="text-[11px] text-neutral-500 font-normal">
                {count} modelo{count > 1 ? 's' : ''} detectado{count > 1 ? 's' : ''} via <code className="text-neutral-800 font-mono font-bold bg-neutral-100 px-1 py-0.5 rounded">?{candidate.paramName}</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Templates preview list */}
        <div className="bg-neutral-50/70 border border-neutral-150 rounded-xl p-3 space-y-1.5 max-h-32 overflow-y-auto">
          <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
            Prévia dos modelos encontrados ({count}):
          </span>
          <div className="space-y-1">
            {candidate.templates.map((tpl, i) => (
              <div
                key={i}
                className="text-[11px] text-neutral-700 bg-white border border-neutral-200/60 rounded-md px-2 py-1 flex items-center justify-between gap-2 shadow-3xs"
              >
                <span className="font-semibold truncate">{tpl.title}</span>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0 font-medium">
                  {tpl.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Choice: Merge vs Overwrite */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-neutral-800 block">
            Como deseja aplicar esses modelos?
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* Merge Button */}
            <button
              type="button"
              onClick={() => setImportMode('merge')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                importMode === 'merge'
                  ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Layers size={13} className={importMode === 'merge' ? 'text-neutral-300' : 'text-neutral-500'} />
                  Mesclar Atual
                </span>
                {importMode === 'merge' && <Check size={12} className="text-emerald-400" />}
              </div>
              <span className={`text-[10px] leading-tight ${importMode === 'merge' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Mantém seus modelos e soma os da URL (sem duplicar).
              </span>
            </button>

            {/* Overwrite Button */}
            <button
              type="button"
              onClick={() => setImportMode('overwrite')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                importMode === 'overwrite'
                  ? 'border-red-600 bg-red-600 text-white shadow-xs'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle size={13} className={importMode === 'overwrite' ? 'text-white' : 'text-red-500'} />
                  Substituir Tudo
                </span>
                {importMode === 'overwrite' && <Check size={12} className="text-white" />}
              </div>
              <span className={`text-[10px] leading-tight ${importMode === 'overwrite' ? 'text-white/85' : 'text-neutral-500'}`}>
                Substitui e apaga a lista local por esta nova da URL.
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-600 hover:text-black bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(importMode)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-3xs transition-all cursor-pointer flex items-center gap-1.5 text-white ${
              importMode === 'overwrite'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-neutral-950 hover:bg-neutral-850'
            }`}
          >
            <Check size={13} />
            <span>Confirmar ({importMode === 'merge' ? 'Mesclar Atual' : 'Substituir Tudo'})</span>
          </button>
        </div>
      </div>
    </div>
  );
}

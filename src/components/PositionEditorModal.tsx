import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Search, Check, ListOrdered, RotateCcw, GripVertical } from 'lucide-react';
import { Template } from '../types';

interface PositionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onSavePositions: (reorderedTemplates: Template[]) => void;
}

export default function PositionEditorModal({
  isOpen,
  onClose,
  templates,
  onSavePositions,
}: PositionEditorModalProps) {
  const [items, setItems] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize ordered items on open
  useEffect(() => {
    if (isOpen) {
      // Sort templates by order property if defined, otherwise preserve current array sequence
      const sorted = [...templates].map((t, idx) => ({
        ...t,
        order: t.order ?? idx + 1,
      }));
      setItems(sorted);
      setHasChanges(false);
      setSavedSuccess(false);
      setSearchQuery('');
    }
  }, [isOpen, templates]);

  if (!isOpen) return null;

  // Swap items helper
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Re-assign order values
    const reindexed = updated.map((t, idx) => ({
      ...t,
      order: idx + 1,
    }));

    setItems(reindexed);
    setHasChanges(true);
  };

  // Move to top
  const moveToTop = (index: number) => {
    if (index === 0) return;
    moveItem(index, 0);
  };

  // Move to bottom
  const moveToBottom = (index: number) => {
    if (index === items.length - 1) return;
    moveItem(index, items.length - 1);
  };

  // Explicit position input handler
  const handlePositionInputChange = (currentIndex: number, newPosStr: string) => {
    const newPos = parseInt(newPosStr, 10);
    if (isNaN(newPos) || newPos < 1 || newPos > items.length) return;
    moveItem(currentIndex, newPos - 1);
  };

  // Reset order back to original
  const handleResetOrder = () => {
    const reset = templates.map((t, idx) => ({
      ...t,
      order: idx + 1,
    }));
    setItems(reset);
    setHasChanges(true);
  };

  // Save handler
  const handleSave = () => {
    const finalOrdered = items.map((t, idx) => ({
      ...t,
      order: idx + 1,
    }));
    onSavePositions(finalOrdered);
    setSavedSuccess(true);
    setHasChanges(false);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  // Filter items if searching
  const filteredIndices = items
    .map((t, originalIndex) => ({ t, originalIndex }))
    .filter(({ t }) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q)
      );
    });

  return (
    <div
      id="position-editor-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="position-editor-modal-card"
        className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black text-white rounded-md flex items-center justify-center">
              <ListOrdered size={16} />
            </div>
            <div>
              <h2 className="font-sans font-bold text-gray-900 text-sm tracking-tight">
                Editor de Posições dos Textos
              </h2>
              <p className="text-[11px] text-gray-500">
                Organize a ordem em que os textos aparecem na tela, busca e assistente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200/60 rounded-md transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Search and Filter Controls */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar texto na lista para reordenar..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={handleResetOrder}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            title="Restaurar ordem padrão"
          >
            <RotateCcw size={12} />
            <span>Restaurar Ordem</span>
          </button>
        </div>

        {/* Reordering List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/40">
          {filteredIndices.length > 0 ? (
            filteredIndices.map(({ t, originalIndex }) => {
              const isFirst = originalIndex === 0;
              const isLast = originalIndex === items.length - 1;

              return (
                <div
                  key={t.id}
                  className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-lg p-3 shadow-3xs flex items-center justify-between gap-3 transition-all hover:shadow-2xs"
                >
                  {/* Position number and title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-gray-300 hover:text-gray-500 cursor-grab">
                        <GripVertical size={15} />
                      </span>
                      
                      {/* Direct numeric position box */}
                      <div className="relative flex items-center">
                        <span className="text-[10px] font-mono text-gray-400 font-bold mr-1">#</span>
                        <input
                          type="number"
                          min={1}
                          max={items.length}
                          value={t.order ?? originalIndex + 1}
                          onChange={(e) => handlePositionInputChange(originalIndex, e.target.value)}
                          className="w-11 px-1.5 py-1 text-center text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black"
                          title="Digite o número da posição desejada"
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.2 rounded-sm text-[8px] font-mono font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                          {t.category}
                        </span>
                        <h4 className="font-sans font-bold text-gray-900 text-xs truncate">
                          {t.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate max-w-md font-mono">
                        {t.content}
                      </p>
                    </div>
                  </div>

                  {/* Position controls buttons */}
                  <div className="flex items-center gap-1 shrink-0 bg-gray-50 p-1 rounded-md border border-gray-200/60">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveToTop(originalIndex)}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        isFirst
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-black hover:bg-white hover:shadow-2xs'
                      }`}
                      title="Mover para o topo absoluto (#1)"
                    >
                      <ChevronsUp size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveItem(originalIndex, originalIndex - 1)}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        isFirst
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-black hover:bg-white hover:shadow-2xs'
                      }`}
                      title="Subir uma posição"
                    >
                      <ArrowUp size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveItem(originalIndex, originalIndex + 1)}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        isLast
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-black hover:bg-white hover:shadow-2xs'
                      }`}
                      title="Descer uma posição"
                    >
                      <ArrowDown size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveToBottom(originalIndex)}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        isLast
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-black hover:bg-white hover:shadow-2xs'
                      }`}
                      title="Mover para o fim da lista"
                    >
                      <ChevronsDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 text-xs">
              Nenhum texto encontrado para "{searchQuery}".
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {hasChanges ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                ● Alterações de posição não salvas
              </span>
            ) : savedSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={13} /> Posições salvas com sucesso!
              </span>
            ) : (
              <span>Total de {items.length} textos ordenados.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Salvar Posições</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

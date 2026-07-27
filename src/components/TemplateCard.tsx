import React, { useState, useEffect } from 'react';
import { Copy, Check, Edit2, Trash2, ArrowUpRight, GripVertical } from 'lucide-react';
import { Template } from '../types';
import { extractVariables } from '../utils/templateHelpers';

interface TemplateCardProps {
  key?: React.Key;
  template: Template;
  index: number;
  totalCount: number;
  onCopy: (id: string, text: string) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onQuickFill: (template: Template) => void;
  // Drag and drop props
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent, id: string, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  onMovePosition?: (fromIndex: number, toIndex: number) => void;
}

export default function TemplateCard({
  template,
  index,
  totalCount,
  onCopy,
  onEdit,
  onDelete,
  onQuickFill,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMovePosition,
}: TemplateCardProps) {
  const [copied, setCopied] = useState(false);
  const [hasVariables, setHasVariables] = useState(false);

  useEffect(() => {
    const vars = extractVariables(template.content);
    setHasVariables(vars.length > 0);
  }, [template.content]);

  const handleCardClick = () => {
    if (hasVariables) {
      onQuickFill(template);
    } else {
      navigator.clipboard.writeText(template.content).then(() => {
        setCopied(true);
        onCopy(template.id, template.content);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div
      id={`template-card-${template.id}`}
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, template.id, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDragLeave={(e) => onDragLeave && onDragLeave(e)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      onDragEnd={() => onDragEnd && onDragEnd()}
      onClick={handleCardClick}
      className={`bg-white border rounded-xl transition-all duration-150 flex flex-col justify-between cursor-pointer group relative ${
        isDragging
          ? 'opacity-40 border-dashed border-gray-400 scale-95 shadow-inner'
          : isDragOver
          ? 'ring-2 ring-black border-black bg-gray-50/80 scale-[1.02] shadow-lg z-10'
          : copied
          ? 'border-emerald-500 ring-1 ring-emerald-500'
          : 'border-gray-200 hover:border-black/30 hover:shadow-xs'
      }`}
    >
      {/* Visual Drag Over Indicator Banner */}
      {isDragOver && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full z-20 shadow-xs">
          Solte aqui para trocar posição
        </div>
      )}

      {/* Card Header */}
      <div className="p-3.5 flex items-start justify-between gap-2.5 border-b border-gray-100/70">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag handle button icon */}
          <div
            className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing transition-colors flex items-center gap-0.5 shrink-0"
            title="Arraste este botão para mudar o texto de lugar"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} className="text-gray-400 group-hover:text-gray-700" />
            <span className="text-[10px] font-mono font-bold text-gray-400">
              #{template.order || index + 1}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[8px] font-mono font-semibold tracking-wider uppercase bg-gray-50 text-gray-500 border border-gray-200/60">
                {template.category}
              </span>
              {hasVariables && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[8px] font-mono font-semibold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-100">
                  Variável
                </span>
              )}
            </div>
            <h3 className="font-sans font-bold text-gray-900 tracking-tight text-xs sm:text-sm group-hover:text-black transition-colors truncate">
              {template.title}
            </h3>
          </div>
        </div>

        {/* Header Action Buttons (Edit/Delete) */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            id={`edit-btn-${template.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(template);
            }}
            className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
            title="Editar template"
          >
            <Edit2 size={13} />
          </button>

          <button
            id={`delete-btn-${template.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(template.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Excluir template"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Card Body & Template Content Preview */}
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="bg-gray-50/50 p-3 rounded-md border border-gray-100 font-sans text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-24 overflow-hidden relative flex-1">
          {template.content.length > 150 ? `${template.content.substring(0, 150)}...` : template.content}
          
          {/* Bottom fade gradient */}
          {template.content.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50/80 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Card Footer Copy Button */}
      <div className="p-3.5 pt-0">
        <button
          id={`copy-btn-${template.id}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className={`w-full py-1.5 px-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 border cursor-pointer ${
            copied
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-black hover:bg-neutral-800 text-white border-black shadow-2xs'
          }`}
        >
          {copied ? (
            <>
              <Check size={13} />
              <span>Copiado!</span>
            </>
          ) : hasVariables ? (
            <>
              <span>Preencher e Copiar</span>
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copiar Texto</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}


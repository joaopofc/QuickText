import React, { useState, useEffect } from 'react';
import { Copy, Check, Edit2, Trash2, ArrowUpRight } from 'lucide-react';
import { Template } from '../types';
import { extractVariables } from '../utils/templateHelpers';

interface TemplateCardProps {
  key?: React.Key;
  template: Template;
  onCopy: (id: string, text: string) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onQuickFill: (template: Template) => void;
}

export default function TemplateCard({ template, onCopy, onEdit, onDelete, onQuickFill }: TemplateCardProps) {
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
      onClick={handleCardClick}
      className={`bg-white border rounded-xl hover:shadow-xs transition-all duration-150 flex flex-col justify-between cursor-pointer group ${
        copied ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-black/30'
      }`}
    >
      {/* Card Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-semibold tracking-wider uppercase bg-gray-50 text-gray-500 border border-gray-200/60">
              {template.category}
            </span>
            {hasVariables && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-semibold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-100">
                Variável
              </span>
            )}
          </div>
          <h3 className="font-sans font-bold text-gray-900 tracking-tight text-xs sm:text-sm group-hover:text-black transition-colors">
            {template.title}
          </h3>
        </div>

        {/* Action icons shown on hover or subtly always */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button
            id={`edit-btn-${template.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(template);
            }}
            className="p-1 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
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
      <div className="px-4 pb-4 flex-1 flex flex-col">
        <div className="bg-gray-50/40 p-3 rounded-md border border-gray-100 font-sans text-xs text-gray-500 whitespace-pre-wrap leading-relaxed max-h-24 overflow-hidden relative flex-1">
          {template.content.length > 150 ? `${template.content.substring(0, 150)}...` : template.content}
          
          {/* Subtle bottom fade to indicate overflow */}
          {template.content.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50/40 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 pt-0">
        <button
          id={`copy-btn-${template.id}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className={`w-full py-1.5 px-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 border ${
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

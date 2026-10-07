import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, Info, Plus, Pencil, Check } from 'lucide-react';
import { Template } from '../types';
import { extractVariables } from '../utils/templateHelpers';

interface TemplateFormProps {
  categories: string[];
  onSubmit: (data: { title: string; content: string; category: string; variablePresets?: Record<string, string[]> }) => void;
  onCancel: () => void;
  initialData?: Template | null;
}

export default function TemplateForm({ categories, onSubmit, onCancel, initialData }: TemplateFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Outros');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [variablePresets, setVariablePresets] = useState<Record<string, string[]>>({});
  const [selectedVarForPresets, setSelectedVarForPresets] = useState<string | null>(null);
  const [presetInputValue, setPresetInputValue] = useState('');
  const [editingPresetIdx, setEditingPresetIdx] = useState<number | null>(null);
  const [editingPresetValue, setEditingPresetValue] = useState('');

  // Initialize fields on editing load
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setVariablePresets(initialData.variablePresets || {});
      setSelectedVarForPresets(null);
      setPresetInputValue('');
      if (categories.includes(initialData.category)) {
        setCategory(initialData.category);
        setShowNewCategoryInput(false);
      } else {
        setCategory('custom');
        setNewCategory(initialData.category);
        setShowNewCategoryInput(true);
      }
    } else {
      setTitle('');
      setContent('');
      setCategory(categories[0] || 'Outros');
      setNewCategory('');
      setShowNewCategoryInput(false);
      setVariablePresets({});
      setSelectedVarForPresets(null);
      setPresetInputValue('');
    }
  }, [initialData, categories]);

  // Track and extract variables reactively
  useEffect(() => {
    const mainVars = extractVariables(content);
    const allVars = new Set(mainVars);

    // Recursively extract variables from any defined presets as well
    Object.values(variablePresets).forEach((presetsList) => {
      if (Array.isArray(presetsList)) {
        presetsList.forEach((presetText) => {
          extractVariables(presetText).forEach((v) => allVars.add(v));
        });
      }
    });

    setDetectedVars(Array.from(allVars));
  }, [content, variablePresets]);

  useEffect(() => {
    setEditingPresetIdx(null);
    setEditingPresetValue('');
  }, [selectedVarForPresets]);

  const handleAddPreset = () => {
    if (!selectedVarForPresets || !presetInputValue.trim()) return;
    const current = variablePresets[selectedVarForPresets] || [];
    const newVal = presetInputValue.trim();
    if (!current.includes(newVal)) {
      setVariablePresets({
        ...variablePresets,
        [selectedVarForPresets]: [...current, newVal]
      });
    }
    setPresetInputValue('');
  };

  const handleSavePresetEdit = (idx: number) => {
    if (!selectedVarForPresets || !editingPresetValue.trim()) return;
    const current = variablePresets[selectedVarForPresets] || [];
    const updated = [...current];
    updated[idx] = editingPresetValue.trim();
    setVariablePresets({
      ...variablePresets,
      [selectedVarForPresets]: updated
    });
    setEditingPresetIdx(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const finalCategory = showNewCategoryInput && newCategory.trim() 
      ? newCategory.trim() 
      : (category === 'custom' ? 'Outros' : category);

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category: finalCategory,
      variablePresets: variablePresets,
    });
  };


  return (
    <div id="template-form-card" className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <h3 className="font-sans font-semibold text-gray-900 tracking-tight text-sm">
          {initialData ? 'Editar Texto Padronizado' : 'Novo Texto Padronizado'}
        </h3>
        <button
          id="close-form-button"
          onClick={onCancel}
          className="text-gray-400 hover:text-black p-1 rounded-md hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="form-title-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 font-mono">
            Título do Texto
          </label>
          <input
            id="form-title-input"
            type="text"
            required
            placeholder="Ex: Confirmação de Cadastro, Assinatura de Email, etc..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden transition-all font-sans"
          />
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 font-mono">
            Categoria
          </label>
          <div className="flex gap-2">
            {!showNewCategoryInput ? (
              <div className="relative flex-1">
                <select
                  id="form-category-select"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === 'new_custom') {
                      setShowNewCategoryInput(true);
                      setCategory('custom');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden transition-all appearance-none font-sans"
                >
                  {categories.filter(c => c !== 'Outros').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Outros">Outros</option>
                  <option value="new_custom">+ Criar Nova Categoria...</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 border-l border-gray-100">
                  <Plus size={14} />
                </div>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <input
                  id="form-new-category-input"
                  type="text"
                  required
                  placeholder="Nome da categoria..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden transition-all font-sans"
                />
                <button
                  id="cancel-new-category"
                  type="button"
                  onClick={() => {
                    setShowNewCategoryInput(false);
                    setCategory(categories[0] || 'Outros');
                    setNewCategory('');
                  }}
                  className="px-2.5 py-2 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Template TextArea */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="form-content-textarea" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
              Conteúdo do Texto
            </label>
            <div className="flex flex-col items-end text-[10px] text-gray-400 font-mono gap-0.5">
              <span className="flex items-center gap-1"><Info size={11} /> Use {"{{variável}}"} para caixa simples</span>
              <span className="text-indigo-500 font-bold">Use {"[[variável]]"} para caixa grande (textarea)</span>
            </div>
          </div>
          <textarea
            id="form-content-textarea"
            required
            rows={6}
            placeholder={`Olá, {{nome}}!\n\nAgradecemos pelo contato. Detalhes do problema:\n[[detalhes_reclamacao]]\n\nAtenciosamente,\n{{seu_nome}}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-md focus:border-black focus:outline-hidden transition-all font-sans resize-y leading-relaxed"
          />
        </div>

        {/* Detected Variables Highlight */}
        {detectedVars.length > 0 && (
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in duration-150 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">
                <Sliders size={13} className="text-gray-500" />
                <span>Variáveis Detectadas ({detectedVars.length})</span>
              </div>
              <span className="text-[10px] text-gray-400 font-sans">Clique para criar textos rápidos/opções</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {detectedVars.map((v) => {
                const presets = variablePresets[v] || [];
                const hasPresets = presets.length > 0;
                const isSelected = selectedVarForPresets === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectedVarForPresets(isSelected ? null : v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all duration-150 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : hasPresets
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-black/30 hover:bg-gray-100'
                    }`}
                  >
                    <span>{v}</span>
                    {hasPresets && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold ${isSelected ? 'bg-white text-black' : 'bg-indigo-600 text-white'}`}>
                        {presets.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Presets Manager for the selected variable */}
            {selectedVarForPresets && detectedVars.includes(selectedVarForPresets) && (
              <div className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 font-mono flex items-center gap-1.5">
                    <span>Opções de textos para:</span>
                    <span className="text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md font-bold">{selectedVarForPresets}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedVarForPresets(null)}
                    className="text-gray-400 hover:text-black text-xs font-semibold transition-colors"
                  >
                    Fechar
                  </button>
                </div>

                {/* List of current presets */}
                {(variablePresets[selectedVarForPresets] || []).length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(variablePresets[selectedVarForPresets] || []).map((preset, idx) => {
                      const isEditing = editingPresetIdx === idx;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 px-2.5 bg-gray-50 rounded-md border border-gray-200 hover:border-gray-300 transition-colors gap-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingPresetValue}
                              onChange={(e) => setEditingPresetValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSavePresetEdit(idx);
                                } else if (e.key === 'Escape') {
                                  setEditingPresetIdx(null);
                                }
                              }}
                              className="flex-1 px-2 py-1 bg-white text-xs text-gray-900 border border-gray-300 rounded focus:border-black focus:outline-hidden font-sans"
                              autoFocus
                            />
                          ) : (
                            <span className="text-xs text-gray-700 font-sans truncate pr-2 flex-1">{preset}</span>
                          )}
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSavePresetEdit(idx)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-gray-150 transition-colors"
                                  title="Salvar alteração"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPresetIdx(null)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-150 transition-colors"
                                  title="Cancelar"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPresetIdx(idx);
                                    setEditingPresetValue(preset);
                                  }}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-150"
                                  title="Editar opção"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = variablePresets[selectedVarForPresets] || [];
                                    const updated = current.filter((_, i) => i !== idx);
                                    setVariablePresets({
                                      ...variablePresets,
                                      [selectedVarForPresets]: updated
                                    });
                                    if (editingPresetIdx === idx) {
                                      setEditingPresetIdx(null);
                                    }
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-150"
                                  title="Remover opção"
                                >
                                  <X size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic font-sans py-1">
                    Nenhum texto pronto cadastrado para esta variável. Adicione novas opções abaixo.
                  </p>
                )}

                {/* Add new preset form inline */}
                <div className="flex gap-2 pt-1">
                  <input
                    id="new-preset-input"
                    type="text"
                    placeholder="Inserir opção (Ex: Problema de IOF, Atraso de entrega...)"
                    value={presetInputValue}
                    onChange={(e) => setPresetInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPreset();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white text-xs text-gray-850 border border-gray-200 rounded-md focus:border-black focus:outline-hidden font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreset}
                    className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold rounded-md transition-colors shrink-0 shadow-3xs"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            id="cancel-submit-button"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-all duration-150"
          >
            Cancelar
          </button>
          <button
            id="submit-template-button"
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-md shadow-xs flex items-center gap-1.5 transition-all duration-150"
          >
            <Save size={14} />
            <span>{initialData ? 'Atualizar Texto' : 'Salvar Texto'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

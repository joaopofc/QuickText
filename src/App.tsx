import React, { useState, useEffect, useMemo } from 'react';
import { Plus, RotateCcw, FileText, Check, Search, Trash2, Download, ListOrdered, Settings as SettingsIcon } from 'lucide-react';
import { Template } from './types';
import { DEFAULT_TEMPLATES, AVAILABLE_CATEGORIES } from './defaultTemplates';
import { extractVariables } from './utils/templateHelpers';
import SearchDropdown from './components/SearchDropdown';
import TemplateCard from './components/TemplateCard';
import TemplateForm from './components/TemplateForm';
import QuickFillModal from './components/QuickFillModal';
import ConfirmModal from './components/ConfirmModal';
import PrivacyTermsModal from './components/PrivacyTermsModal';
import SettingsModal from './components/SettingsModal';
import PositionEditorModal from './components/PositionEditorModal';

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [activeQuickFill, setActiveQuickFill] = useState<Template | null>(null);
  const [globalCopiedAlert, setGlobalCopiedAlert] = useState<string | null>(null);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState<boolean>(true); // true initially to avoid flicker, corrected on mount
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
  
  // Custom confirmation modal states (replaces blocked window.confirm in iframe)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    // Check if privacy terms have been accepted
    const accepted = localStorage.getItem('quick_text_privacy_accepted') === 'true';
    setHasAcceptedPrivacy(accepted);
    if (!accepted) {
      setIsPrivacyOpen(true);
    }

    const stored = localStorage.getItem('quick_text_templates');
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao ler templates do localStorage:', e);
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem('quick_text_templates', JSON.stringify(DEFAULT_TEMPLATES));
    }
  }, []);

  const handleAcceptPrivacy = () => {
    localStorage.setItem('quick_text_privacy_accepted', 'true');
    setHasAcceptedPrivacy(true);
    setIsPrivacyOpen(false);
  };

  // Save to localStorage whenever templates change
  const saveTemplates = (updated: Template[]) => {
    setTemplates(updated);
    localStorage.setItem('quick_text_templates', JSON.stringify(updated));
  };

  // Compute all unique categories dynamically
  const categories = useMemo(() => {
    const templateCats = templates.map((t) => t.category);
    const merged = [...AVAILABLE_CATEGORIES, ...templateCats];
    return Array.from(new Set(merged)).filter((c) => c && c.trim() !== '');
  }, [templates]);

  // Form submission handler (Adds or edits template)
  const handleFormSubmit = (data: { title: string; content: string; category: string; variablePresets?: Record<string, string[]> }) => {
    if (editingTemplate) {
      // Editing
      const updated = templates.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              title: data.title,
              content: data.content,
              category: data.category,
              variablePresets: data.variablePresets || {},
            }
          : t
      );
      saveTemplates(updated);
      setEditingTemplate(null);
    } else {
      // Adding new
      const newTemplate: Template = {
        id: `tpl-${Date.now()}`,
        title: data.title,
        content: data.content,
        category: data.category,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        variablePresets: data.variablePresets || {},
      };
      saveTemplates([newTemplate, ...templates]);
    }
    setIsFormOpen(false);
  };

  // Delete handler
  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = () => {
    if (deleteConfirmId) {
      const updated = templates.filter((t) => t.id !== deleteConfirmId);
      saveTemplates(updated);
      setDeleteConfirmId(null);
      
      setGlobalCopiedAlert('Texto excluído com sucesso!');
      setTimeout(() => setGlobalCopiedAlert(null), 2000);
    }
  };

  // Copy handler (Increments usageCount)
  const handleCopy = (id: string, copiedText: string) => {
    const updated = templates.map((t) =>
      t.id === id ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t
    );
    saveTemplates(updated);

    // Show floating success indicator
    setGlobalCopiedAlert('Texto copiado para a área de transferência!');
    setTimeout(() => setGlobalCopiedAlert(null), 2000);
  };

  // Open Form for Editing
  const handleEditInit = (template: Template) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
    document.getElementById('app-content-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset to original default templates
  const handleResetDefaults = () => {
    setIsResetConfirmOpen(true);
  };

  const executeResetDefaults = () => {
    const userCreated = templates.filter((t) => !t.id.startsWith('tpl-'));
    const combined = [...userCreated, ...DEFAULT_TEMPLATES];
    saveTemplates(combined);
    setIsResetConfirmOpen(false);
    
    setGlobalCopiedAlert('Modelos de amostra restaurados!');
    setTimeout(() => setGlobalCopiedAlert(null), 2000);
  };

  const handleRemoveSamples = () => {
    const defaultIds = ['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4', 'tpl-5', 'tpl-6'];
    const updated = templates.filter((t) => !defaultIds.includes(t.id));
    saveTemplates(updated);
    setGlobalCopiedAlert('Modelos de amostra removidos!');
    setTimeout(() => setGlobalCopiedAlert(null), 2000);
  };

  const handleRestoreSamples = () => {
    const currentIds = new Set(templates.map((t) => t.id));
    const toAdd = DEFAULT_TEMPLATES.filter((t) => !currentIds.has(t.id));
    const updated = [...templates, ...toAdd];
    saveTemplates(updated);
    setGlobalCopiedAlert('Modelos de amostra restaurados!');
    setTimeout(() => setGlobalCopiedAlert(null), 2000);
  };

  // Handle importing data (either merges with current or overwrites)
  const handleImport = (importedTemplates: Template[], overwrite: boolean) => {
    if (overwrite) {
      saveTemplates(importedTemplates);
    } else {
      // Merge: Avoid duplicating templates with exact same title and content
      const existingKeys = new Set(templates.map(t => `${t.title.trim().toLowerCase()}::${t.content.trim()}`));
      const merged = [...templates];
      
      importedTemplates.forEach(item => {
        const key = `${item.title.trim().toLowerCase()}::${item.content.trim()}`;
        if (!existingKeys.has(key)) {
          merged.push(item);
        }
      });
      saveTemplates(merged);
    }
  };

  // Filter templates shown in the grid based on category tab selection
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'Todos') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Drag and drop card reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCardDragStart = (_e: React.DragEvent, id: string, index: number) => {
    setDraggedIndex(index);
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleCardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCardDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...templates];
    const draggedItem = filteredTemplates[draggedIndex];
    const dropItem = filteredTemplates[dropIndex];

    if (!draggedItem || !dropItem) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const realDraggedIdx = updated.findIndex((t) => t.id === draggedItem.id);
    const realDropIdx = updated.findIndex((t) => t.id === dropItem.id);

    if (realDraggedIdx !== -1 && realDropIdx !== -1) {
      const [moved] = updated.splice(realDraggedIdx, 1);
      updated.splice(realDropIdx, 0, moved);

      // Re-index order property
      const reindexed = updated.map((t, idx) => ({
        ...t,
        order: idx + 1,
      }));

      saveTemplates(reindexed);
      setGlobalCopiedAlert(`Texto "${moved.title}" movido para a posição #${realDropIdx + 1}!`);
      setTimeout(() => setGlobalCopiedAlert(null), 2500);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCardDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMovePosition = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= filteredTemplates.length) return;
    const updated = [...templates];
    const fromItem = filteredTemplates[fromIndex];
    const toItem = filteredTemplates[toIndex];

    const realFrom = updated.findIndex((t) => t.id === fromItem.id);
    const realTo = updated.findIndex((t) => t.id === toItem.id);

    if (realFrom !== -1 && realTo !== -1) {
      const [moved] = updated.splice(realFrom, 1);
      updated.splice(realTo, 0, moved);

      const reindexed = updated.map((t, idx) => ({
        ...t,
        order: idx + 1,
      }));

      saveTemplates(reindexed);
      setGlobalCopiedAlert(`Posição alterada para #${realTo + 1}`);
      setTimeout(() => setGlobalCopiedAlert(null), 2000);
    }
  };

  return (
    <div id="main-app-container" className="min-h-screen bg-[#fafafb] flex flex-col font-sans selection:bg-black selection:text-white">
      
      {/* Stripe-style Minimal Header */}
      <header id="app-main-header" className="border-b border-gray-100 bg-white py-4 px-6 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-black text-white px-1.5 py-0.5 rounded-sm tracking-wider">TP</span>
            <h1 className="font-sans font-bold text-gray-900 text-sm tracking-tight">
              Texto Padrão <span className="font-normal text-gray-400">| Textos Padronizados</span>
            </h1>
          </div>

          {/* Clean Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              id="header-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-black bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
              title="Abrir configurações de backup, amostras e fixação"
            >
              <SettingsIcon size={13} className="text-gray-500" />
              <span>Configurações</span>
            </button>

            <button
              id="header-new-template-btn"
              onClick={() => {
                setEditingTemplate(null);
                setIsFormOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-md shadow-sm transition-all duration-150 flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Novo Texto</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main id="app-main-content-layout" className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Anchor point for scrolling */}
        <div id="app-content-top" className="scroll-mt-20"></div>

        {/* Global Notification Banner */}
        {globalCopiedAlert && (
          <div
            id="global-success-notification"
            className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-200 border border-neutral-800"
          >
            <div className="p-0.5 bg-emerald-500 rounded-full text-white">
              <Check size={11} strokeWidth={3} />
            </div>
            <span>{globalCopiedAlert}</span>
          </div>
        )}

        {/* Search Autocomplete Lookup & Filters Integrated */}
        <div className="space-y-4">
          <div className="max-w-2xl mx-auto">
            <SearchDropdown
              templates={templates}
              onSelect={(template) => {
                const vars = extractVariables(template.content);
                if (vars.length > 0) {
                  setActiveQuickFill(template);
                } else {
                  navigator.clipboard.writeText(template.content).then(() => {
                    handleCopy(template.id, template.content);
                  });
                }
              }}
            />
          </div>

          {/* Categories Tab Navigation */}
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-1 flex-wrap gap-4 max-w-4xl mx-auto pt-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <button
                id="filter-category-all"
                onClick={() => setSelectedCategory('Todos')}
                className={`px-3 py-1 text-xs font-semibold transition-colors shrink-0 rounded-md ${
                  selectedCategory === 'Todos'
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:text-black hover:bg-gray-100'
                }`}
              >
                Todos
              </button>

              {categories.map((cat) => (
                <button
                  id={`filter-category-${cat}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold transition-colors shrink-0 rounded-md ${
                    selectedCategory === cat
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-black hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-gray-400 font-mono">
              {filteredTemplates.length} de {templates.length} modelos
            </div>
          </div>
        </div>

        {/* Dynamic Form Panel (Active on demand) */}
        {isFormOpen && (
          <section id="active-template-form-container" className="max-w-3xl mx-auto animate-in fade-in duration-200">
            <TemplateForm
              categories={categories}
              initialData={editingTemplate}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTemplate(null);
              }}
            />
          </section>
        )}

        {/* Cards Grid */}
        <section id="grid-list-section" className="max-w-5xl mx-auto">
          {filteredTemplates.length > 0 ? (
            <div id="templates-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((template, idx) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  index={idx}
                  totalCount={filteredTemplates.length}
                  onCopy={handleCopy}
                  onEdit={handleEditInit}
                  onDelete={handleDelete}
                  onQuickFill={(tpl) => setActiveQuickFill(tpl)}
                  isDragging={draggedIndex === idx}
                  isDragOver={dragOverIndex === idx}
                  onDragStart={handleCardDragStart}
                  onDragOver={handleCardDragOver}
                  onDragLeave={handleCardDragLeave}
                  onDrop={handleCardDrop}
                  onDragEnd={handleCardDragEnd}
                  onMovePosition={handleMovePosition}
                />
              ))}
            </div>
          ) : (
            <div id="empty-state-card" className="border border-dashed border-gray-200 rounded-xl py-12 px-4 text-center bg-white shadow-3xs max-w-md mx-auto">
              <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 mb-3">
                <FileText size={16} />
              </div>
              <h3 className="font-sans font-semibold text-gray-900 text-xs mb-1">
                Nenhum modelo cadastrado
              </h3>
              <p className="text-[11px] text-gray-500 mb-4 max-w-xs mx-auto">
                {selectedCategory === 'Todos'
                  ? 'Adicione seu primeiro modelo de texto padronizado para uso rápido.'
                  : `Nenhum modelo foi encontrado na categoria "${selectedCategory}".`}
              </p>
              {selectedCategory === 'Todos' ? (
                <button
                  id="empty-state-add-btn"
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsFormOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-md transition-all"
                >
                  Criar Primeiro Texto
                </button>
              ) : (
                <button
                  id="empty-state-back-all-btn"
                  onClick={() => setSelectedCategory('Todos')}
                  className="px-3 py-1 text-xs font-semibold text-gray-500 bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-all"
                >
                  Ver Todos
                </button>
              )}
            </div>
          )}
        </section>

      </main>

      {/* Quick Fill Dialog Overlay */}
      <QuickFillModal
        template={activeQuickFill}
        onClose={() => setActiveQuickFill(null)}
        onCopy={handleCopy}
        templates={templates}
        onSelectTemplate={setActiveQuickFill}
      />

      {/* Custom Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Excluir Texto Padronizado"
        message="Tem certeza que deseja excluir este texto padronizado? Esta ação é irreversível."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Restaurar Amostras"
        message="Deseja restaurar os templates padrão originais? Os seus modelos customizados criados manualmente serão preservados."
        confirmText="Restaurar"
        cancelText="Cancelar"
        onConfirm={executeResetDefaults}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      <PrivacyTermsModal
        isOpen={isPrivacyOpen}
        isForced={!hasAcceptedPrivacy}
        onAccept={handleAcceptPrivacy}
        onClose={() => {
          if (hasAcceptedPrivacy) {
            setIsPrivacyOpen(false);
          }
        }}
      />

      {/* Blocking Blur Overlay when privacy is not accepted */}
      {!hasAcceptedPrivacy && (
        <div className="fixed inset-0 bg-neutral-100/50 backdrop-blur-md z-45 flex flex-col items-center justify-center p-4 select-none">
          <div className="bg-white/80 border border-gray-200/80 rounded-2xl p-6 max-w-sm text-center space-y-3.5 shadow-xl">
            <span className="font-mono text-xs font-bold bg-black text-white px-2 py-0.5 rounded-sm tracking-wider">TP</span>
            <h3 className="text-gray-900 font-bold text-sm tracking-tight">Aceite Requerido</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Para garantir a conformidade com a LGPD/GDPR e a segurança total de dados, é obrigatório aceitar os Termos de Uso e Privacidade antes de iniciar.
            </p>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        templates={templates}
        onImport={handleImport}
        onRemoveSamples={handleRemoveSamples}
        onRestoreSamples={handleRestoreSamples}
        onOpenPositionEditor={() => setIsPositionEditorOpen(true)}
      />

      <PositionEditorModal
        isOpen={isPositionEditorOpen}
        onClose={() => setIsPositionEditorOpen(false)}
        templates={templates}
        onSavePositions={(reordered) => {
          saveTemplates(reordered);
          setGlobalCopiedAlert('Posições dos textos salvas com sucesso!');
          setTimeout(() => setGlobalCopiedAlert(null), 2000);
        }}
      />

      {/* Footer */}
      <footer id="app-main-footer" className="border-t border-gray-100 py-6 px-6 mt-16 bg-white text-center text-xs text-gray-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono">
          <p>
            Texto Padrão &copy; 2026 &mdash; Tudo localmente
          </p>
          <div className="text-[10px] text-gray-400 flex items-center justify-center sm:justify-end gap-3.5">
            <button
              id="footer-privacy-btn"
              onClick={() => setIsPrivacyOpen(true)}
              className="text-gray-500 hover:text-black font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Termos &amp; Privacidade
            </button>
            <span className="text-gray-200">|</span>
            <span>Design minimalista e eficiente.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

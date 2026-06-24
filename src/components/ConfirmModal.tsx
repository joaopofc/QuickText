import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="confirm-modal-content"
        className="bg-white border border-gray-200 rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-full shrink-0 border border-amber-100">
              <AlertTriangle size={18} />
            </div>
            <div className="space-y-1">
              <h3 className="font-sans font-semibold text-gray-900 text-sm">
                {title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-gray-50/70 flex items-center justify-end gap-2.5">
          <button
            id="confirm-modal-cancel-btn"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-black bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-all duration-150"
          >
            {cancelText}
          </button>
          <button
            id="confirm-modal-confirm-btn"
            onClick={onConfirm}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 border border-black rounded-md transition-all duration-150"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

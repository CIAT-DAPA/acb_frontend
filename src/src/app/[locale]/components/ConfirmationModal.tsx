import React from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${isDangerous ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              {cancelLabel || "Cancel"}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDangerous
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              } transition-colors`}
            >
              {confirmLabel || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

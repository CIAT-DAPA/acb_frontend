"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { useTranslations } from "next-intl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  type?: "default" | "error" | "success" | "warning";
  className?: string;
  showCloseButton?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  type = "default",
  className = "",
  showCloseButton = true,
}: ModalProps) => {
  const t = useTranslations("Common");

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Type-based styling for header background
  const typeStyles = {
    default: "bg-white text-gray-900 border-b border-gray-200",
    error: "bg-red-50 text-red-900 border-b border-red-200",
    success: "bg-green-50 text-green-900 border-b border-green-200",
    warning: "bg-amber-50 text-amber-900 border-b border-amber-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-all duration-200 ease-in-out">
      <div
        className={`w-full max-w-lg bg-white rounded-xl shadow-2xl transform transition-all scale-100 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 rounded-t-xl ${typeStyles[type]}`}
        >
          <h3 className="text-lg font-semibold font-headers" id="modal-title">
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label={t("close")}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* content */}
        <div className="px-6 py-6 text-gray-700">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

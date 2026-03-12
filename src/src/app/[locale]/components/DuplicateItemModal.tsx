"use client";

import { ReactNode, useEffect } from "react";
import { Copy, Loader2, X } from "lucide-react";
import { btnOutlineSecondary, btnPrimary } from "./ui";

interface DuplicateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  title: string;
  message: string;
  nameLabel: string;
  namePlaceholder: string;
  nameValue: string;
  onNameChange: (value: string) => void;
  cancelLabel: string;
  confirmLabel: string;
  submittingLabel: string;
  originalItemLabel: string;
  originalPreview: ReactNode;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  descriptionValue?: string;
  onDescriptionChange?: (value: string) => void;
  confirmDisabled?: boolean;
  headerAccentClassName?: string;
  nameInputId?: string;
  descriptionInputId?: string;
}

export function DuplicateItemModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  title,
  message,
  nameLabel,
  namePlaceholder,
  nameValue,
  onNameChange,
  cancelLabel,
  confirmLabel,
  submittingLabel,
  originalItemLabel,
  originalPreview,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionValue,
  onDescriptionChange,
  confirmDisabled = false,
  headerAccentClassName = "bg-[#606c38]/20 text-[#606c38]",
  nameInputId = "duplicate-item-name",
  descriptionInputId = "duplicate-item-description",
}: DuplicateItemModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const canShowDescriptionField =
    onDescriptionChange !== undefined && descriptionValue !== undefined;
  const isConfirmButtonDisabled =
    isSubmitting || !nameValue.trim() || confirmDisabled;

  const handleRequestClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleRequestClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full mx-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${headerAccentClassName}`}>
              <Copy className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-[#283618]">{title}</h3>
          </div>
          <button
            onClick={handleRequestClose}
            className="p-2 text-[#283618]/80 hover:text-[#283618] transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-[#283618]">{message}</p>

          <div className="space-y-2">
            <label
              htmlFor={nameInputId}
              className="block text-sm font-medium text-[#283618]"
            >
              {nameLabel}
            </label>
            <input
              id={nameInputId}
              type="text"
              value={nameValue}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={namePlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#606c38] focus:border-transparent"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {canShowDescriptionField && (
            <div className="space-y-2">
              <label
                htmlFor={descriptionInputId}
                className="block text-sm font-medium text-[#283618]"
              >
                {descriptionLabel}
              </label>
              <textarea
                id={descriptionInputId}
                rows={3}
                value={descriptionValue}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder={descriptionPlaceholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#606c38] focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-[#283618]/60 mb-2">
              {originalItemLabel}
            </p>
            {originalPreview}
          </div>
        </div>

        <div className="flex gap-3 justify-end p-4 border-t bg-gray-50">
          <button
            onClick={handleRequestClose}
            className={btnOutlineSecondary}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmButtonDisabled}
            className={`${btnPrimary} ${
              isConfirmButtonDisabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{submittingLabel}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

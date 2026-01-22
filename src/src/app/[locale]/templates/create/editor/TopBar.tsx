import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as ui from "../../../components/ui";

interface TopBarProps {
  templateName: string;
  onNameChange: (name: string) => void;
  lastSaved: Date | null;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  templateName,
  onNameChange,
  lastSaved,
  saving,
  onBack,
  onSave,
}) => {
  const t = useTranslations("CreateTemplate");

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 shadow-sm shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-col">
          <input
            type="text"
            value={templateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t("basicInfo.fields.name.placeholder")}
            className="text-lg font-medium text-gray-900 border-none outline-none focus:ring-0 bg-transparent p-0 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">
          {saving ? (
            <span className="flex items-center gap-2">
              {t("fieldEditor.editor.saving")}
            </span>
          ) : lastSaved ? (
            <span>
              {t("autosave.lastSaved")} {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>

        <button
          onClick={onSave}
          className={`${ui.btnPrimary} font-medium text-sm py-2`}
        >
          {t("fieldEditor.editor.saveTemplate")}
        </button>
      </div>
    </div>
  );
};

import { useEffect, useRef, useCallback, useState } from "react";
import { CreateTemplateData, TemplateCreationStep } from "../types/template";

interface AutosaveData {
  data: CreateTemplateData;
  currentStep: TemplateCreationStep;
  lastSaved: string;
}

const AUTOSAVE_KEY_PREFIX = "template_creation_autosave";
const AUTOSAVE_INTERVAL = 3000; // Guardar cada 3 segundos

export function useTemplateAutosave(
  data: CreateTemplateData,
  currentStep: TemplateCreationStep,
  onRestore?: (data: CreateTemplateData, step: TemplateCreationStep) => void,
  templateId?: string // ID del template en modo edit
) {
  // Generar key única: si es edit, incluir el templateId
  const AUTOSAVE_KEY = templateId
    ? `${AUTOSAVE_KEY_PREFIX}_edit_${templateId}`
    : `${AUTOSAVE_KEY_PREFIX}_create`;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);
  const isAutosaveEnabled = useRef(true); // Flag para controlar si el autosave está habilitado
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);

  // Guardar en localStorage
  const saveToLocalStorage = useCallback(() => {
    // No guardar si el autosave está deshabilitado
    if (!isAutosaveEnabled.current) {
      console.log("⏸️ Autosave is disabled, skipping save");
      return;
    }

    try {
      const now = new Date();
      const autosaveData: AutosaveData = {
        data,
        currentStep,
        lastSaved: now.toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData));
      setLastSaved(now);
      console.log("✅ Template autosaved at", now.toLocaleTimeString());
    } catch (error) {
      console.error("❌ Error saving template to localStorage:", error);
    }
  }, [data, currentStep, AUTOSAVE_KEY]);

  // Restaurar desde localStorage
  const restoreFromLocalStorage = useCallback((): AutosaveData | null => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) return null;

      const autosaveData: AutosaveData = JSON.parse(saved);
      console.log(
        "📥 Found autosaved template from",
        new Date(autosaveData.lastSaved).toLocaleString()
      );
      return autosaveData;
    } catch (error) {
      console.error("❌ Error restoring template from localStorage:", error);
      return null;
    }
  }, [AUTOSAVE_KEY]);

  // Limpiar autoguardado
  const clearAutosave = useCallback(() => {
    try {
      isAutosaveEnabled.current = false; // Deshabilitar el autosave
      localStorage.removeItem(AUTOSAVE_KEY);
      console.log("🗑️ Autosave cleared and disabled");
    } catch (error) {
      console.error("❌ Error clearing autosave:", error);
    }
  }, [AUTOSAVE_KEY]);

  // Verificar si hay contenido significativo en el formulario
  const hasSignificantContent = useCallback(
    (checkData: CreateTemplateData): boolean => {
      return !!(
        checkData.master.template_name.trim() ||
        checkData.master.description.trim() ||
        checkData.version.content.sections.length > 0 ||
        (checkData.version.content.header_config?.fields &&
          checkData.version.content.header_config.fields.length > 0) ||
        (checkData.version.content.footer_config?.fields &&
          checkData.version.content.footer_config.fields.length > 0)
      );
    },
    []
  );

  // Restaurar al montar el componente (solo una vez)
  useEffect(() => {
    if (!hasRestoredRef.current && onRestore) {
      const saved = restoreFromLocalStorage();
      if (saved && hasSignificantContent(saved.data)) {
        // Preguntar al usuario si quiere restaurar
        const shouldRestore = window.confirm(
          `Se encontró un borrador guardado el ${new Date(
            saved.lastSaved
          ).toLocaleString()}.\n\n¿Deseas continuar desde donde lo dejaste?`
        );

        if (shouldRestore) {
          onRestore(saved.data, saved.currentStep);
          console.log("♻️ Template restored from autosave");
        } else {
          clearAutosave();
        }
      }
      hasRestoredRef.current = true;
    }
  }, [
    onRestore,
    restoreFromLocalStorage,
    clearAutosave,
    hasSignificantContent,
  ]);

  // Autoguardar cuando cambian los datos (con debounce)
  useEffect(() => {
    // No autoguardar si está deshabilitado
    if (!isAutosaveEnabled.current) {
      return;
    }

    // Solo autoguardar si hay contenido significativo
    if (!hasSignificantContent(data)) {
      return;
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programar nuevo guardado
    timeoutRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, AUTOSAVE_INTERVAL);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, currentStep, saveToLocalStorage, hasSignificantContent]);

  // Guardar antes de cerrar/recargar la página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // No guardar ni advertir si el autosave está deshabilitado
      if (!isAutosaveEnabled.current) {
        return;
      }

      if (hasSignificantContent(data)) {
        saveToLocalStorage();

        // Mostrar advertencia al usuario
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [data, saveToLocalStorage, hasSignificantContent]);

  return {
    saveNow: saveToLocalStorage,
    clearAutosave,
    restoreFromLocalStorage,
    lastSaved,
  };
}

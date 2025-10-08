"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import CreateTemplatePage from "../../create/FormTemplatePage";
import { TemplateAPIService } from "../../../../../services/templateService";
import { CreateTemplateData } from "../../../../../types/template";
import { ProtectedRoute } from "../../../../../components/ProtectedRoute";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<CreateTemplateData | null>(
    null
  );

  useEffect(() => {
    loadTemplateData();
  }, [templateId]);

  const loadTemplateData = async () => {
    if (!templateId) {
      setError("ID de template no válido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener la versión actual del template con todo su contenido
      let versionContent = {
        style_config: {
          font: "Arial",
          primary_color: "#000000",
          secondary_color: "#666666",
          background_color: "#ffffff",
        },
        sections: [],
        header_config: undefined,
        footer_config: undefined,
      };

      let template: any = null;

      // Obtener la versión actual del template
      try {
        const versionResponse = await TemplateAPIService.getCurrentVersion(
          templateId
        );

        if (versionResponse.success && versionResponse.data) {
          const currentVersion = versionResponse.data.current_version;
          template = versionResponse.data.template_master;
          console.log("Template cargado:", template);
          console.log("Versión actual cargada:", currentVersion);

          // Usar el contenido de la versión actual
          if (currentVersion.content) {
            versionContent = {
              style_config:
                currentVersion.content.style_config ||
                versionContent.style_config,
              sections: currentVersion.content.sections || [],
              header_config: currentVersion.content.header_config,
              footer_config: currentVersion.content.footer_config,
            };
          }
        } else {
          console.warn(
            "No se pudo cargar la versión actual, usando valores por defecto"
          );
        }
      } catch (versionError) {
        console.error("Error cargando versión del template:", versionError);
        // Continuar con los valores por defecto
      }

      if (!template) {
        setError("No se pudo cargar la información del template");
        return;
      }

      // Transformar los datos del template al formato CreateTemplateData
      const templateData: CreateTemplateData = {
        master: {
          template_name: template.template_name,
          description: template.description,
          status: template.status,
          log: template.log,
          access_config: template.access_config,
        },
        version: {
          commit_message: "Versión actualizada",
          log: {
            created_at: new Date().toISOString(),
            creator_user_id: template.log.creator_user_id,
            creator_first_name: template.log.creator_first_name || null,
            creator_last_name: template.log.creator_last_name || null,
          },
          content: versionContent,
        },
      };

      setInitialData(templateData);
    } catch (err) {
      console.error("Error loading template:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar los datos del template"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#ffaf68] mx-auto mb-4" />
            <p className="text-[#283618] text-lg">Cargando plantilla...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !initialData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Error al cargar la plantilla
              </h2>
              <p className="text-red-600 mb-4">
                {error || "No se pudieron cargar los datos del template"}
              </p>
              <button
                onClick={() => router.push("/templates")}
                className="bg-[#ffaf68] hover:bg-[#ff8c42] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Volver a Plantillas
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <CreateTemplatePage
        mode="edit"
        templateId={templateId}
        initialData={initialData}
      />
    </ProtectedRoute>
  );
}

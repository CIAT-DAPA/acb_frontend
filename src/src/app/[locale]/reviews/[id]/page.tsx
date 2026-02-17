"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { BulletinAPIService } from "@/services/bulletinService";
import { TemplatePreview } from "../../templates/create/TemplatePreview";
import {
  btnPrimary,
  btnOutlineSecondary,
  container,
} from "../../components/ui";
import { CreateTemplateData } from "@/types/template";
import Link from "next/link";

export default function ReviewBulletinPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("Bulletins"); // Reusing for now
  const bulletinId = params.id as string;

  const [bulletin, setBulletin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para manejo de comentarios (mock)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{
    type: string;
    id: string;
  } | null>(null);
  const [comments, setComments] = useState<Record<string, string[]>>({}); // Map entityId -> comments

  useEffect(() => {
    loadBulletinData();
  }, [bulletinId]);

  const loadBulletinData = async () => {
    try {
      setLoading(true);
      const response = await BulletinAPIService.getCurrentVersion(bulletinId);

      if (response.success && response.data) {
        setBulletin(response.data);
      } else {
        setError("Error al cargar el boletín");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    // Mock approval
    alert("Boletín aprobado y publicado (Simulado)");
    router.push("/reviews");
  };

  const handleReject = async () => {
    // Mock rejection
    alert("Boletín rechazado y devuelto a borrador (Simulado)");
    router.push("/reviews");
  };

  const handleElementClick = (
    type: "section" | "block" | "field" | "header" | "footer" | "header_field" | "footer_field",
    id: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo permitir comentarios en sections, blocks y fields por ahora
    if (type === "section" || type === "block" || type === "field") {
      setSelectedElement({ type, id });
      setIsCommentModalOpen(true);
    }
  };

  // Transformar datos de boletín a formato compatible con TemplatePreview
  const previewData: CreateTemplateData | null = bulletin
    ? ({
        master: {
          ...bulletin.master,
          template_name: bulletin.master.bulletin_name,
          template_type: "bulletin", // Dummy
          template_description: bulletin.master.description || "",
        },
        version: {
          ...bulletin.current_version,
          content: bulletin.current_version.data, // Mapear data a content
        },
      } as unknown as CreateTemplateData)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffaf68]" />
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || "No data found"}</p>
        <Link href="/reviews" className={btnPrimary}>
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className={`${container} py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <Link href="/reviews" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#283618]">
                Revisión: {bulletin.master.bulletin_name}
              </h1>
              <span className="text-sm px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                {bulletin.master.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              className={`${btnOutlineSecondary} flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50`}
            >
              <XCircle className="h-5 w-5" />
              Rechazar
            </button>
            <button
              onClick={handleApprove}
              className={`${btnPrimary} flex items-center gap-2`}
            >
              <CheckCircle className="h-5 w-5" />
              Aprobar y Publicar
            </button>
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="max-w-[1200px] mx-auto bg-white shadow-xl min-h-[1000px]">
          {/* Aquí pasamos props adicionales que implementaremos en TemplatePreview */}
          {/* @ts-ignore - Props aún no definidos en la interfaz */}
          <TemplatePreview
            data={previewData}
            reviewMode={true}
            onElementClick={handleElementClick}
          />
        </div>
      </div>

      {/* Modal de Comentarios (Mock) */}
      {isCommentModalOpen && selectedElement && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Comentario para {selectedElement.type}
            </h3>
            <textarea
              className="w-full border rounded p-2 mb-4 h-32"
              placeholder="Escribe tu observación o corrección..."
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCommentModalOpen(false)}
                className={btnOutlineSecondary}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Guardar comentario mock
                  setIsCommentModalOpen(false);
                  alert("Comentario guardado (Simulado)");
                }}
                className={btnPrimary}
              >
                Guardar Comentario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

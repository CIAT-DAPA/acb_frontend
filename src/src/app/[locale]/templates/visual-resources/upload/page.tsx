"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../../../../../components/ProtectedRoute";
import {
  container,
  btnPrimary,
  btnOutlineSecondary,
  pageTitle,
  pageSubtitle,
  inputField,
} from "../../../components/ui";
import {
  VisualResourceFileType,
  VisualResourceStatus,
} from "@/types/visualResource";
import { VisualResourcesService } from "@/services/visualResourcesService";

interface FileWithPreview {
  file: File; // El archivo original sin modificar
  preview?: string;
  customName?: string;
  id: string;
  // Propiedades delegadas del File original
  name: string;
  size: number;
  type: string;
}

export default function UploadVisualResource() {
  const t = useTranslations("VisualResources");
  const router = useRouter();

  // Estados del formulario
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [fileType, setFileType] = useState<VisualResourceFileType>("image");
  const [accessType, setAccessType] = useState<"public" | "private" | "group">(
    "public"
  );
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // Estados de UI
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploadResults, setUploadResults] = useState<{
    [key: string]: "success" | "error" | "pending";
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ref para mantener referencia actual de los archivos
  const selectedFilesRef = useRef<FileWithPreview[]>(selectedFiles);

  // Cargar grupos disponibles y recursos existentes al montar el componente
  useEffect(() => {
    loadAvailableGroups();
  }, []);

  // Mantener la ref actualizada
  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  const loadAvailableGroups = async () => {
    try {
      const response = await VisualResourcesService.getAvailableGroups();
      if (response.success && response.data) {
        setAvailableGroups(response.data);
      }
    } catch (error) {
      console.error("Error loading available groups:", error);
      // Fallback: usar grupos de ejemplo si el endpoint no está disponible
      setAvailableGroups(["Admin", "Research", "Public"]);
    }
  };

  // Validar tipo de archivo
  const isValidFileType = (file: File): boolean => {
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    const validIconTypes = ["image/svg+xml", "image/png", "image/ico"];

    if (fileType === "image") {
      return validImageTypes.includes(file.type);
    } else if (fileType === "icon") {
      return validIconTypes.includes(file.type);
    }

    return false;
  };

  // Validar tamaño del archivo
  const isValidFileSize = (file: File): boolean => {
    const maxSize = fileType === "image" ? 10 * 1024 * 1024 : 2 * 1024 * 1024; // 10MB para imágenes, 2MB para iconos
    return file.size <= maxSize;
  };

  // Manejar archivos seleccionados
  const handleFileSelect = useCallback(
    (files: FileList) => {
      const fileArray = Array.from(files);
      const validFiles: FileWithPreview[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        if (!isValidFileType(file)) {
          errors.push(
            `${file.name}: Tipo de archivo no válido para ${fileType}`
          );
          return;
        }

        if (!isValidFileSize(file)) {
          const maxSize = fileType === "image" ? "10MB" : "2MB";
          errors.push(
            `${file.name}: Archivo demasiado grande (máximo ${maxSize})`
          );
          return;
        }

        // Crear preview para imágenes y agregar ID único
        const fileWithPreview: FileWithPreview = {
          file: file, // El archivo original sin modificar
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          customName: "",
          name: file.name,
          size: file.size,
          type: file.type,
        };

        if (file.type.startsWith("image/")) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        validFiles.push(fileWithPreview);
      });

      if (errors.length > 0) {
        setError(errors.join("\n"));
        setTimeout(() => setError(null), 5000);
      }

      setSelectedFiles((prev) => [...prev, ...validFiles]);
    },
    [fileType]
  );

  // Drag and Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const { files } = e.dataTransfer;
      if (files && files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect]
  );

  // Remover archivo de la lista
  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      return prev.filter((file) => {
        if (file.id === fileId) {
          // Limpiar preview URL
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
          return false;
        }
        return true;
      });
    });
  };

  // Actualizar nombre personalizado de un archivo específico
  const updateCustomFileName = (fileId: string, customName: string) => {
    setSelectedFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, customName } : file))
    );
  };

  // Subir archivos
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Selecciona al menos un archivo para subir");
      return;
    }

    if (accessType === "group" && !selectedGroup) {
      setError("Selecciona un grupo para el acceso por grupo");
      return;
    }

    setIsUploading(true);
    setError(null);

    const results: { [key: string]: "success" | "error" | "pending" } = {};
    selectedFiles.forEach((file) => {
      results[file.id] = "pending";
    });
    setUploadResults(results);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        try {
          // Simular progreso de subida
          for (let progress = 0; progress <= 80; progress += 20) {
            setUploadProgress((prev) => ({
              ...prev,
              [file.id]: progress,
            }));
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Determinar el nombre final del archivo
          const fileName = file.name || `unnamed_file_${Date.now()}`;
          const fileExtension = fileName.includes(".")
            ? fileName.split(".").pop()
            : "unknown";

          const finalFileName = file.customName?.trim()
            ? `${file.customName}.${fileExtension}`
            : fileName;

          const uploadMetadata = {
            file_name: finalFileName,
            file_type: fileType,
            status: "active" as VisualResourceStatus,
            access_config: {
              type: accessType,
              ...(accessType === "group" && { group_name: selectedGroup }),
            },
          };

          // Usar createVisualResource con archivo y metadatos
          const response = await VisualResourcesService.createVisualResource(
            uploadMetadata,
            file.file // Usar el archivo original
          );

          // Actualizar progreso a 100%
          setUploadProgress((prev) => ({
            ...prev,
            [file.id]: 100,
          }));

          if (response.success) {
            setUploadResults((prev) => ({
              ...prev,
              [file.id]: "success",
            }));
            successCount++;
          } else {
            throw new Error(response.message || "Error al subir el archivo");
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadResults((prev) => ({ ...prev, [file.id]: "error" }));
          errorCount++;
        }
      }

      // Mostrar mensaje de resultado
      if (successCount > 0 && errorCount === 0) {
        setSuccessMessage(
          `Se subieron correctamente ${successCount} archivo${
            successCount !== 1 ? "s" : ""
          }`
        );
        // Redirigir después de un momento
        setTimeout(() => {
          router.push("/templates/visual-resources");
        }, 2000);
      } else if (successCount > 0 && errorCount > 0) {
        setSuccessMessage(
          `Se subieron ${successCount} archivo${
            successCount !== 1 ? "s" : ""
          } correctamente. ${errorCount} archivo${
            errorCount !== 1 ? "s fallaron" : " falló"
          }.`
        );
      } else {
        setError(
          "No se pudo subir ningún archivo. Revisa los errores e intenta de nuevo."
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Error general durante la subida de archivos");
    } finally {
      setIsUploading(false);
    }
  };

  // Limpiar previews al desmontar el componente
  useEffect(() => {
    return () => {
      // Usar la ref para acceder a los archivos actuales al momento del desmontaje
      selectedFilesRef.current.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []); // Solo se ejecuta al desmontar

  return (
    <ProtectedRoute>
      <main>
        <section className="bg-white py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Link
                    href="/templates/visual-resources"
                    className="flex items-center gap-2 text-[#283618]/60 hover:text-[#283618] transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t("backToVisualResources")}</span>
                  </Link>
                </div>
                <h1 className={pageTitle}>{t("uploadFile")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block rotate-12">
                <div className="w-32 h-32 bg-gradient-to-br from-[#ffaf68] to-[#ff8c42] rounded-lg flex items-center justify-center">
                  <Upload className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Formulario de configuración */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-medium text-[#283618] mb-4">
                  {t("uploadConfiguration")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Tipo de archivo */}
                  <div>
                    <label className="block text-sm font-medium text-[#283618] mb-2">
                      {t("resourceType")}
                    </label>
                    <select
                      value={fileType}
                      onChange={(e) =>
                        setFileType(e.target.value as VisualResourceFileType)
                      }
                      className={inputField}
                    >
                      <option value="image">{t("images")}</option>
                      <option value="icon">{t("icons")}</option>
                    </select>
                    <p className="text-xs text-[#283618]/80 mt-1">
                      {fileType === "image"
                        ? "Imágenes: JPG, PNG, GIF, WebP, SVG (máx. 10MB)"
                        : "Iconos: SVG, PNG, ICO (máx. 2MB)"}
                    </p>
                  </div>

                  {/* Tipo de acceso */}
                  <div>
                    <label className="block text-sm font-medium text-[#283618] mb-2">
                      {t("accessType")}
                    </label>
                    <select
                      value={accessType}
                      onChange={(e) =>
                        setAccessType(
                          e.target.value as "public" | "private" | "group"
                        )
                      }
                      className={inputField}
                    >
                      <option value="public">{t("public")}</option>
                      <option value="private">{t("private")}</option>
                      <option value="group">{t("groupSpecific")}</option>
                    </select>
                  </div>

                  {/* Selector de grupo (solo si es acceso por grupo) */}
                  {accessType === "group" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#283618] mb-2">
                        {t("selectGroup")}
                      </label>
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className={inputField}
                      >
                        <option value="">{t("selectGroup")}...</option>
                        {availableGroups.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Área de drop y selección de archivos */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragActive
                      ? "border-[#ffaf68] bg-[#ffaf68]/10"
                      : "border-[#283618]/60 hover:border-[#ffaf68]/50"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-[#ffaf68]/10 rounded-full">
                      <Upload className="h-8 w-8 text-[#ffaf68]" />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-[#283618] mb-2">
                        {isDragActive ? t("dropFiles") : t("dragFiles")}
                      </h3>
                      <p className="text-[#283618]/80 mb-4">
                        {t("clickToSelect")}
                      </p>
                    </div>

                    <input
                      type="file"
                      multiple
                      accept={
                        fileType === "image" ? "image/*" : ".svg,.png,.ico"
                      }
                      onChange={(e) =>
                        e.target.files && handleFileSelect(e.target.files)
                      }
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className={btnOutlineSecondary}>
                      {t("selectFiles")}
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-medium text-[#283618] mb-4">
                    {t("selectedFiles")} ({selectedFiles.length})
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        {/* Preview */}
                        <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                          {file.preview ? (
                            <Image
                              src={file.preview}
                              alt={file.name}
                              width={150}
                              height={150}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {fileType === "image" ? (
                                <ImageIcon className="h-8 w-8 text-[#283618]/80" />
                              ) : (
                                <FileText className="h-8 w-8 text-[#283618]/80" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Info del archivo */}
                        <div className="text-sm mb-2">
                          <p
                            className="font-medium text-[#283618] truncate"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-[#283618]/80">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {/* Campo nombre personalizado */}
                        {!isUploading && (
                          <div className="mb-2">
                            <input
                              type="text"
                              value={file.customName || ""}
                              onChange={(e) =>
                                updateCustomFileName(file.id, e.target.value)
                              }
                              placeholder={t("customFileNamePlaceholder")}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#ffaf68] focus:border-transparent"
                            />
                          </div>
                        )}

                        {/* Estado de subida */}
                        {isUploading && (
                          <div className="mt-2">
                            {uploadResults[file.id] === "pending" && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs">
                                  {uploadProgress[file.id] || 0}%
                                </span>
                              </div>
                            )}
                            {uploadResults[file.id] === "success" && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">{t("uploaded")}</span>
                              </div>
                            )}
                            {uploadResults[file.id] === "error" && (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs">
                                  {t("uploadError")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botón remover (solo si no está subiendo) */}
                        {!isUploading && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensajes de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      {error.split("\n").map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensajes de éxito */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <p>{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4 justify-between">
                <div className="flex gap-4">
                  <Link
                    href="/templates/visual-resources"
                    className={`${btnOutlineSecondary} px-4`}
                  >
                    {t("cancel")}
                  </Link>
                  <button
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className={`${btnPrimary} ${
                      selectedFiles.length === 0 || isUploading
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{t("uploading")}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>
                          {t("uploadFiles")} {selectedFiles.length} archivo
                          {selectedFiles.length !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

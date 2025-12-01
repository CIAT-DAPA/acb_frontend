"use client";

import React, { useState, useRef } from "react";
import { Field } from "../../../../../../types/template";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadInputProps {
  field?: Field;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ImageUploadInput({
  field,
  value,
  onChange,
  disabled = false,
}: ImageUploadInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener configuración del campo
  const fieldConfig = field?.field_config as any;
  const allowedFormats = fieldConfig?.allowed_formats || [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
  ];
  const maxFileSize = fieldConfig?.max_file_size || 5; // MB
  const maxHeight = fieldConfig?.max_height;
  const maxWidth = fieldConfig?.max_width;

  // Convertir formatos a MIME types
  const acceptedTypes = allowedFormats
    .map((format: string) => {
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      return mimeTypes[format.toLowerCase()];
    })
    .filter(Boolean)
    .join(",");

  const validateFile = (file: File): string | null => {
    // Validar tipo de archivo
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      return `Formato no permitido. Solo se aceptan: ${allowedFormats.join(
        ", "
      )}`;
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `El archivo es demasiado grande. Tamaño máximo: ${maxFileSize}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // Delete previous temporary image if exists
      if (
        value &&
        typeof value === "string" &&
        value.includes("/bulletins/temp/")
      ) {
        try {
          await fetch(
            `/api/delete-bulletin-image?url=${encodeURIComponent(value)}`,
            {
              method: "DELETE",
            }
          );
        } catch (deleteError) {
          console.warn("Error deleting previous temporary image:", deleteError);
        }
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-bulletin-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();
      onChange(data.url || data.path);
    } catch (err) {
      setError("Error al subir la imagen. Por favor, intenta nuevamente.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    await uploadFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleRemoveImage = async () => {
    // Delete temporary image if exists
    if (
      value &&
      typeof value === "string" &&
      value.includes("/bulletins/temp/")
    ) {
      try {
        await fetch(
          `/api/delete-bulletin-image?url=${encodeURIComponent(value)}`,
          {
            method: "DELETE",
          }
        );
      } catch (deleteError) {
        console.warn("Error deleting temporary image:", deleteError);
      }
    }
    onChange("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const containerStyle = {
    height: maxHeight ? `${maxHeight}px` : "200px",
    width: maxWidth ? `${maxWidth}px` : "100%",
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div
        style={containerStyle}
        className={`
          relative border-2 border-dashed rounded-lg overflow-hidden
          transition-all duration-200
          ${isDragging ? "border-[#283618] bg-[#283618]/5" : "border-gray-300"}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-[#283618]"
          }
          ${uploading ? "opacity-75" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {value ? (
          // Imagen cargada
          <div className="relative w-full h-full">
            <img
              src={value}
              alt="Imagen subida"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/img/imageNotFound.png";
              }}
            />
            {!disabled && !uploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          // Zona de carga
          <div className="flex flex-col items-center justify-center h-full p-4">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#283618] mb-3" />
                <p className="text-sm text-gray-600">Subiendo imagen...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 text-center mb-2">
                  <span className="font-medium text-[#283618]">
                    Haz clic para subir
                  </span>{" "}
                  o arrastra una imagen aquí
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Formatos: {allowedFormats.join(", ").toUpperCase()}
                </p>
                <p className="text-xs text-gray-500">
                  Tamaño máximo: {maxFileSize}MB
                </p>
                {(maxHeight || maxWidth) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {maxHeight && `Altura: ${maxHeight}px`}
                    {maxHeight && maxWidth && " × "}
                    {maxWidth && `Ancho: ${maxWidth}px`}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {field?.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
}

"use client";

import React, { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";
import { Field } from "../../../../../../types/template";
import { normalizeAssetUrl } from "@/utils/assetUrl";

type ImageInputValue =
  | string
  | {
      url?: string | null;
      path?: string | null;
      label?: string;
      [key: string]: unknown;
    }
  | null
  | undefined;

interface ImageInputProps {
  field?: Field;
  value: ImageInputValue;
  onChange: (value: ImageInputValue) => void;
  disabled?: boolean;
}

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

const isTemporaryBulletinImage = (url: string) =>
  url.includes("/bulletins/temp/");

const getImageUrl = (value: ImageInputValue): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (typeof value.url === "string") {
      return value.url.trim();
    }

    if (typeof value.path === "string") {
      return value.path.trim();
    }
  }

  return "";
};

export function ImageInput({
  field,
  value,
  onChange,
  disabled = false,
}: ImageInputProps) {
  const t = useTranslations("CreateBulletin.imageInput");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldConfig = (field?.field_config as any) || {};
  const imageUrl = getImageUrl(value);

  const buildNextValue = (nextUrl: string): ImageInputValue => {
    if (!nextUrl) {
      return "";
    }

    // Preserve legacy metadata such as an item-specific label while updating
    // the URL. New values continue to be stored as a plain string.
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const { path: _legacyPath, ...currentValue } = value;
      return {
        ...currentValue,
        url: nextUrl,
      };
    }

    return nextUrl;
  };

  const allowedFormats = useMemo(
    () =>
      (
        fieldConfig.allowed_formats || ["jpg", "jpeg", "png", "gif", "webp"]
      ).map((format: string) => format.toLowerCase()),
    [fieldConfig.allowed_formats],
  );

  const maxFileSize = Number(fieldConfig.max_file_size) || 5;
  const configuredMaxHeight = Number(fieldConfig.max_height);
  const maxHeight =
    Number.isFinite(configuredMaxHeight) && configuredMaxHeight > 0
      ? configuredMaxHeight
      : undefined;

  const acceptedTypes = allowedFormats
    .map((format: string) => MIME_TYPES[format])
    .filter(Boolean)
    .join(",");

  const deleteTemporaryImage = async (imageUrl: string) => {
    if (!isTemporaryBulletinImage(imageUrl)) return;

    try {
      await fetch(
        `/api/delete-bulletin-image?url=${encodeURIComponent(imageUrl)}`,
        { method: "DELETE" },
      );
    } catch (deleteError) {
      console.warn("Error deleting temporary bulletin image:", deleteError);
    }
  };

  const validateFile = (file: File): string | null => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      return t("errors.invalidFormat", {
        formats: allowedFormats.join(", ").toUpperCase(),
      });
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return t("errors.fileTooLarge", { size: maxFileSize });
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-bulletin-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      const uploadedUrl = data.url || data.path;

      if (!uploadedUrl || typeof uploadedUrl !== "string") {
        throw new Error("The upload endpoint did not return an image URL");
      }

      // Only delete the previous temp file after the new upload succeeds.
      if (imageUrl && imageUrl !== uploadedUrl) {
        await deleteTemporaryImage(imageUrl);
      }

      onChange(buildNextValue(uploadedUrl));
    } catch (uploadError) {
      console.error("Image upload error:", uploadError);
      setError(t("errors.upload"));
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

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) void handleFileSelect(file);
    event.target.value = "";
  };

  const handleRemoveImage = async () => {
    if (imageUrl) await deleteTemporaryImage(imageUrl);

    onChange("");
    setError(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClick = () => {
    if (!disabled && !uploading) fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) void handleFileSelect(file);
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
        className={[
          "relative w-full overflow-hidden rounded-lg border-2 border-dashed",
          "transition-all duration-200",
          isDragging ? "border-[#283618] bg-[#283618]/5" : "border-gray-300",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-[#283618]",
          uploading ? "opacity-75" : "",
        ].join(" ")}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {imageUrl ? (
          <div className="relative flex w-full items-center justify-center p-3">
            <img
              src={normalizeAssetUrl(imageUrl)}
              alt={field?.label || t("uploadedImageAlt")}
              className="block object-contain"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: maxHeight ? `${maxHeight}px` : undefined,
              }}
              onError={(event) => {
                const image = event.currentTarget;
                const fallback = "/assets/img/imageNotFound.png";
                if (!image.src.endsWith(fallback)) image.src = fallback;
              }}
            />

            {!disabled && !uploading && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleRemoveImage();
                }}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600"
                title={t("remove")}
                aria-label={t("remove")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center p-4">
            {uploading ? (
              <>
                <div className="mb-3 h-12 w-12 animate-spin rounded-full border-b-2 border-[#283618]" />
                <p className="text-sm text-gray-600">{t("uploading")}</p>
              </>
            ) : (
              <>
                <Upload className="mb-3 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-center text-sm text-gray-600">
                  <span className="font-medium text-[#283618]">
                    {t("clickToUpload")}
                  </span>{" "}
                  {t("orDrag")}
                </p>
                <p className="text-center text-xs text-gray-500">
                  {t("formats", {
                    formats: allowedFormats.join(", ").toUpperCase(),
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {t("maxSize", { size: maxFileSize })}
                </p>
                {maxHeight && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t("maxHeight", { height: maxHeight })}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {field?.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
}

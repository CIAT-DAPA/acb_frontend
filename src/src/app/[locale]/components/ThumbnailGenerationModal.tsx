"use client";

import React from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ThumbnailGenerationModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
  status: "loading" | "success" | "error";
  errorMessage?: string;
}

export function ThumbnailGenerationModal({
  isOpen,
  progress,
  message,
  status,
  errorMessage,
}: ThumbnailGenerationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-[#283618]">
            Generando Thumbnails
          </h3>
          <p className="text-sm text-[#606c38] mt-1">
            Por favor espera mientras se generan las imágenes de vista previa
          </p>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {status === "loading" && (
            <Loader2 className="w-12 h-12 text-[#606c38] animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle className="w-12 h-12 text-green-600" />
          )}
          {status === "error" && (
            <AlertCircle className="w-12 h-12 text-red-600" />
          )}
        </div>

        {/* Progress Bar */}
        {status === "loading" && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#606c38] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[#283618]/60 text-center mt-2">
              {progress}%
            </p>
          </div>
        )}

        {/* Message */}
        <div className="text-center">
          <p className="text-sm text-[#283618]">{message}</p>
          {status === "error" && errorMessage && (
            <p className="text-xs text-red-600 mt-2">{errorMessage}</p>
          )}
        </div>

        {/* Success Info */}
        {status === "success" && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-800 text-center">
              Las imágenes de vista previa se generaron correctamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

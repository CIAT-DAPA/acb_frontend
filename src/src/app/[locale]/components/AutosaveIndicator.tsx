"use client";

import React, { useEffect, useState } from "react";
import { Save, Check, AlertCircle } from "lucide-react";

interface AutosaveIndicatorProps {
  lastSaved?: Date;
  className?: string;
}

export function AutosaveIndicator({
  lastSaved,
  className = "",
}: AutosaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);

      if (seconds < 10) {
        setTimeAgo("ahora");
      } else if (seconds < 60) {
        setTimeAgo(`hace ${seconds}s`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`hace ${minutes}m`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Actualizar cada 10s

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (!lastSaved) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm ${className}`}
      title={`Último guardado: ${lastSaved.toLocaleString()}`}
    >
      {showSaved ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">Guardado</span>
        </>
      ) : (
        <>
          <Save className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">Autoguardado {timeAgo}</span>
        </>
      )}
    </div>
  );
}

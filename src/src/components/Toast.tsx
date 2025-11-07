"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrada animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-close después del duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Duración de la animación de salida
  };

  const bgColor = type === "success" ? "bg-green-50" : "bg-red-50";
  const borderColor =
    type === "success" ? "border-green-500" : "border-red-500";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";

  const Icon = type === "success" ? CheckCircle : XCircle;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4
        min-w-[300px] max-w-[500px]
        ${bgColor} ${borderColor}
        transition-all duration-300 ease-in-out
        ${
          isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      {/* Icono */}
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />

      {/* Mensaje */}
      <div className={`flex-1 ${textColor}`}>
        <p className="text-sm font-medium">{message}</p>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        className={`
          flex-shrink-0 p-1 rounded-md
          ${textColor} hover:bg-black/5
          transition-colors
        `}
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Context y Provider para manejar toasts globalmente
interface ToastContextValue {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [nextId, setNextId] = useState(0);

  const showToast = (message: string, type: ToastType, duration?: number) => {
    const id = nextId;
    setNextId((prev) => prev + 1);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-3">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de un ToastProvider");
  }
  return context;
}

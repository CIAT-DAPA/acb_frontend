"use client";

import React, { useEffect, useState } from "react";

interface AdaptiveSvgIconProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

export function AdaptiveSvgIcon({
  src,
  className = "",
  style = {},
  color,
}: AdaptiveSvgIconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        setIsLoading(true);
        setError(false);
        const response = await fetch(src);
        if (!response.ok) throw new Error("Failed to load SVG");

        const text = await response.text();

        // Parse SVG y modificar para que acepte currentColor
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(text, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (svgElement) {
          // Remover width y height para que sea responsive
          svgElement.removeAttribute("width");
          svgElement.removeAttribute("height");

          // Agregar viewBox si no existe
          if (!svgElement.hasAttribute("viewBox")) {
            svgElement.setAttribute("viewBox", "0 0 24 24");
          }

          // Hacer que todos los paths usen currentColor de manera inteligente
          const paths = svgElement.querySelectorAll(
            "path, circle, rect, polygon, polyline, line, ellipse"
          );

          // Detectar si el SVG es principalmente stroke-based o fill-based
          let hasStrokes = 0;
          let hasFills = 0;
          paths.forEach((path) => {
            const stroke = path.getAttribute("stroke");
            const fill = path.getAttribute("fill");

            if (stroke && stroke !== "none") hasStrokes++;
            if (fill && fill !== "none" && fill !== "") hasFills++;
          });

          // Si tiene más strokes que fills, es un icono de contorno
          const isStrokeBased = hasStrokes > hasFills;

          paths.forEach((path) => {
            const stroke = path.getAttribute("stroke");
            const fill = path.getAttribute("fill");

            if (isStrokeBased) {
              // Para iconos basados en stroke (contorno):
              // - Aplicar currentColor solo al stroke
              // - Dejar fills como transparentes o none
              if (stroke && stroke !== "none") {
                path.setAttribute("stroke", "currentColor");
              }
              // Si tiene fill que no es none, convertirlo a none para evitar bloques sólidos
              if (fill && fill !== "none" && fill !== "") {
                path.setAttribute("fill", "none");
              }
            } else {
              // Para iconos basados en fill (relleno):
              // - Aplicar currentColor solo al fill
              // - Mantener stroke si existe
              if (fill && fill !== "none") {
                path.setAttribute("fill", "currentColor");
              }
              if (stroke && stroke !== "none") {
                path.setAttribute("stroke", "currentColor");
              }
            }
          });

          setSvgContent(svgElement.outerHTML);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading SVG:", err);
        setError(true);
        setIsLoading(false);
      }
    };

    if (src) {
      fetchSvg();
    }
  }, [src]);

  if (isLoading) {
    return <div className={className} style={style}></div>;
  }

  if (error || !svgContent) {
    // Fallback a img tag si falla
    return <img src={src} className={className} style={style} alt="" />;
  }

  return (
    <div
      className={className}
      style={{
        ...style,
        color: color || "currentColor",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Helper function para detectar si una URL es un SVG
export function isSvgUrl(url: string): boolean {
  if (!url) return false;

  // Verificar por extensión
  const urlLower = url.toLowerCase();
  if (urlLower.endsWith(".svg")) return true;

  // Verificar por MIME type en la URL (algunos servicios lo incluyen)
  if (urlLower.includes("image/svg")) return true;

  return false;
}

// Componente wrapper que decide automáticamente qué usar
interface SmartIconProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  alt?: string;
}

export function SmartIcon({
  src,
  className = "",
  style = {},
  color,
  alt = "",
}: SmartIconProps) {
  const isSvg = isSvgUrl(src);

  if (isSvg) {
    return (
      <AdaptiveSvgIcon
        src={src}
        className={className}
        style={style}
        color={color}
      />
    );
  }

  return <img src={src} alt={alt} className={className} style={style} />;
}

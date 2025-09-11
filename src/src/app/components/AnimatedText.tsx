"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type AnimatedTextProps = {
  words: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  holdDelay?: number;
  className?: string;
  showCaret?: boolean;
};

export function AnimatedText({
  words,
  typeSpeed = 50,
  deleteSpeed = 35,
  holdDelay = 1200,
  className = "",
  showCaret = true,
}: AnimatedTextProps) {
  // Estado
  const [index, setIndex] = useState(0); // índice de palabra actual
  const [display, setDisplay] = useState(""); // subcadena mostrada
  const [isDeleting, setIsDeleting] = useState(false);

  const current = useMemo(() => words[index], [index]);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const clear = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };

    let delay = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && display === current) {
      // Mantiene la palabra y luego inicia borrado
      timeoutRef.current = window.setTimeout(
        () => setIsDeleting(true),
        holdDelay
      );
      return () => clear();
    }

    if (isDeleting && display === "") {
      // Pasa a la siguiente palabra y vuelve a escribir
      const next = (index + 1) % words.length;
      timeoutRef.current = window.setTimeout(() => {
        setIndex(next);
        setIsDeleting(false);
      }, 200);
      return () => clear();
    }

    // Avanza escribiendo o borrando
    timeoutRef.current = window.setTimeout(() => {
      const nextText = isDeleting
        ? current.slice(0, Math.max(0, display.length - 1))
        : current.slice(0, display.length + 1);
      setDisplay(nextText);
    }, delay);

    return () => clear();
  }, [display, isDeleting, current, index]);

  return (
    <span
      className={`text-primary inline-block align-baseline whitespace-nowrap ${className}`}
    >
      {display}
      {showCaret && (
        <span className="caret" aria-hidden>
          |
        </span>
      )}
    </span>
  );
}

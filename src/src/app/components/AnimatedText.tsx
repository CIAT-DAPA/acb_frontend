"use client";
import { useState, useEffect } from "react";

const words = [
  "información climática",
  "recomendaciones",
  "pronósticos",
  "alertas tempranas",
  "análisis de cultivos",
  "datos meteorológicos",
  "tendencias climáticas",
];

export function AnimatedText() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`text-primary transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {words[currentWordIndex]}
    </span>
  );
}

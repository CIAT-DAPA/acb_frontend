"use client";

import React, { useState, useRef, useEffect } from "react";
import { Field } from "../../../../../../types/template";
import { Search, Plus, X } from "lucide-react";

interface SearchableInputProps {
  field?: Field;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableInput({
  field,
  value,
  onChange,
  options: optionsProp,
  placeholder,
  disabled = false,
}: SearchableInputProps) {
  // Usar options de prop o extraer de field
  const predefinedOptions =
    optionsProp ||
    (field?.field_config && "options" in field.field_config
      ? field.field_config.options
      : []);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const finalPlaceholder = placeholder || "Buscar o crear nueva opción...";

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = predefinedOptions.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determinar si el término de búsqueda es una nueva opción
  const isNewOption =
    searchTerm.trim() !== "" &&
    !predefinedOptions.some(
      (opt) => opt.toLowerCase() === searchTerm.toLowerCase()
    );

  // Opciones a mostrar en el dropdown
  const displayOptions = isNewOption
    ? [...filteredOptions, `Crear: "${searchTerm}"`]
    : filteredOptions;

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejar navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < displayOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (displayOptions.length > 0) {
            handleSelectOption(displayOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm("");
          break;
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, displayOptions, highlightedIndex]);

  // Auto-scroll al elemento destacado
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectOption = (option: string) => {
    if (option.startsWith("Crear: ")) {
      // Crear nueva opción
      const newOption = option.replace('Crear: "', "").replace('"', "");
      onChange(newOption);
    } else {
      // Seleccionar opción existente
      onChange(option);
    }
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
  };

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(0);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input principal */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : value || ""}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            placeholder={finalPlaceholder}
            disabled={disabled}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de opciones */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {displayOptions.length > 0 ? (
            displayOptions.map((option, index) => {
              const isCreateOption = option.startsWith("Crear: ");
              return (
                <div
                  key={index}
                  onClick={() => handleSelectOption(option)}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center gap-2 ${
                    index === highlightedIndex
                      ? "bg-[#283618] text-white"
                      : "hover:bg-gray-100"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {isCreateOption && (
                    <Plus
                      className={`w-4 h-4 ${
                        index === highlightedIndex
                          ? "text-white"
                          : "text-green-600"
                      }`}
                    />
                  )}
                  <span className={isCreateOption ? "font-medium" : ""}>
                    {option}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 italic">
              {searchTerm
                ? "No se encontraron opciones. Presiona Enter para crear una nueva."
                : "No hay opciones disponibles"}
            </div>
          )}
        </div>
      )}

      {/* Texto de ayuda */}
      {isOpen && !disabled && (
        <p className="text-xs text-gray-500 mt-1">
          💡 Escribe para buscar o crear una nueva opción
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Loader2 } from "lucide-react";
import { inputField } from "./ui";

export interface SearchableSelectOption {
  id: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  error?: boolean;
  noResultsText?: string;
  loadingText?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  disabled = false,
  loading = false,
  icon,
  className = "",
  error = false,
  noResultsText = "No se encontraron resultados",
  loadingText = "Cargando...",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontrar la opción seleccionada
  const selectedOption = options.find((opt) => opt.id === value);

  // Filtrar opciones basadas en la búsqueda
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar click fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
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
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleSelect(filteredOptions[highlightedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm("");
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  // Scroll automático al ítem destacado
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
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
  }, [highlightedIndex]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleInputClick = () => {
    if (!disabled && !loading) {
      setIsOpen(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input / Display */}
      <div
        onClick={handleInputClick}
        className={`${inputField} cursor-pointer flex items-center gap-2 ${
          error ? "border-red-500" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${
          isOpen ? "ring-2 ring-[#606c38]/20" : ""
        }`}
      >
        {/* Icon */}
        {icon && <div className="flex-shrink-0 text-[#606c38]">{icon}</div>}

        {/* Input o Display */}
        <div className="flex-1 min-w-0">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(-1);
              }}
              placeholder={placeholder}
              disabled={disabled || loading}
              className="w-full bg-transparent outline-none text-sm"
              autoFocus
            />
          ) : (
            <div className="text-sm truncate">
              {loading ? (
                <span className="text-[#283618]/60">{loadingText}</span>
              ) : selectedOption ? (
                <span className="text-[#283618]">{selectedOption.label}</span>
              ) : (
                <span className="text-[#283618]/60">{placeholder}</span>
              )}
            </div>
          )}
        </div>

        {/* Iconos de acción */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-[#606c38]" />
          )}
          {!loading && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              tabIndex={-1}
            >
              <X className="h-3 w-3 text-[#283618]/60" />
            </button>
          )}
          {!loading && (
            <ChevronDown
              className={`h-4 w-4 text-[#283618]/60 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !loading && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? "bg-[#606c38]/10"
                    : "hover:bg-gray-50"
                } ${value === option.id ? "bg-[#606c38]/5" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {icon && (
                    <div className="flex-shrink-0 text-[#606c38] opacity-50">
                      {icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#283618] truncate">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-[#283618]/60 truncate mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {value === option.id && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-[#606c38] rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-[#283618]/60">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              {noResultsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

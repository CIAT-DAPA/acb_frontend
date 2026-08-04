"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Field } from "../../../../../../types/template";
import { Plus, Search, X } from "lucide-react";

type DisplayOption = {
  label: string;
  value: string;
  isCreateOption: boolean;
};

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
  const t = useTranslations("CreateBulletin");

  const predefinedOptions =
    optionsProp ??
    (field?.field_config && "options" in field.field_config
      ? field.field_config.options
      : []);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const finalPlaceholder = placeholder ?? t("searchableInput.placeholder");

  const filteredOptions = predefinedOptions.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isNewOption =
    searchTerm.trim() !== "" &&
    !predefinedOptions.some(
      (option) => option.toLowerCase() === searchTerm.toLowerCase(),
    );

  const displayOptions: DisplayOption[] = isNewOption
    ? [
        ...filteredOptions.map((option) => ({
          label: option,
          value: option,
          isCreateOption: false,
        })),
        {
          label: t("searchableInput.createOption", { value: searchTerm }),
          value: searchTerm,
          isCreateOption: true,
        },
      ]
    : filteredOptions.map((option) => ({
        label: option,
        value: option,
        isCreateOption: false,
      }));

  const handleSelectOption = (option: DisplayOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
  };

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((current) =>
            current < displayOptions.length - 1 ? current + 1 : current,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((current) => (current > 0 ? current - 1 : 0));
          break;
        case "Enter":
          event.preventDefault();
          if (displayOptions.length > 0) {
            handleSelectOption(displayOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setSearchTerm("");
          break;
      }
    };

    if (!isOpen) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, displayOptions, highlightedIndex]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[
        highlightedIndex
      ] as HTMLElement | undefined;

      highlightedElement?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex, isOpen]);

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm("");
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setHighlightedIndex(0);

    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="relative flex items-center">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : value || ""}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            placeholder={finalPlaceholder}
            aria-label={field?.label || finalPlaceholder}
            disabled={disabled}
            className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-10 text-sm focus:ring-2 focus:ring-[#283618] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("searchableInput.clearSelection")}
              title={t("searchableInput.clearSelection")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg"
        >
          {displayOptions.length > 0 ? (
            displayOptions.map((option, index) => (
              <div
                key={`${option.value}-${option.isCreateOption}`}
                role="option"
                aria-selected={index === highlightedIndex}
                onClick={() => handleSelectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  index === highlightedIndex
                    ? "bg-[#283618] text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {option.isCreateOption && (
                  <Plus
                    aria-hidden="true"
                    className={`h-4 w-4 ${
                      index === highlightedIndex
                        ? "text-white"
                        : "text-green-600"
                    }`}
                  />
                )}
                <span className={option.isCreateOption ? "font-medium" : ""}>
                  {option.label}
                </span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 italic">
              {searchTerm
                ? t("searchableInput.noResultsCreate")
                : t("searchableInput.noOptions")}
            </div>
          )}
        </div>
      )}

      {isOpen && !disabled && (
        <p className="mt-1 text-xs text-gray-500">
          {t("searchableInput.helper")}
        </p>
      )}
    </div>
  );
}

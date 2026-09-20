"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SchoolOption = { id: string; name: string };

/**
 * Searchable school picker. A native <select> stops being usable past a few
 * dozen schools, so this opens a filterable listbox instead. Keyboard: Enter /
 * Space / ArrowDown to open, type to filter, ArrowUp/Down to move, Enter to
 * choose, Escape to close.
 */
export function SchoolSelect({
  schools,
  value,
  onChange,
  placeholder = "Select a school",
  clearLabel,
  disabled = false,
  className = "",
  buttonClassName = "",
  ariaLabel = "Active school",
  searchPlaceholder = "Search schools...",
}: {
  schools: SchoolOption[];
  value: string;
  onChange: (schoolId: string) => void;
  placeholder?: string;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = schools.find((s) => s.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => s.name.toLowerCase().includes(q));
  }, [schools, query]);

  // The search input only exists while the list is open, so focus it once it
  // mounts. Resetting the query/highlight happens in the handlers instead - doing
  // it from an effect would cause a second render for no reason.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const nodes = listRef.current?.querySelectorAll<HTMLElement>("[role=option]");
    nodes?.[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const openList = () => {
    setQuery("");
    setHighlight(0);
    setOpen(true);
  };

  const toggleList = () => {
    if (open) {
      setOpen(false);
    } else {
      openList();
    }
  };

  const choose = (schoolId: string) => {
    onChange(schoolId);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openList();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filtered.length > 0) {
        setHighlight((current) => Math.min(current + 1, filtered.length - 1));
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const pick = filtered[highlight];
      if (pick) choose(pick.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  const optionId = (index: number) => `school-option-${index}`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="school-select-listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggleList}
        onKeyDown={onKeyDown}
        className={`w-full flex items-center justify-between gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className={`truncate ${selected ? "" : "text-gray-400"}`}>
          {selected ? selected.name : placeholder}
        </span>
        <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 min-w-[260px] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="border-b border-gray-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-autocomplete="list"
              aria-controls="school-select-listbox"
              aria-activedescendant={filtered.length > 0 ? optionId(highlight) : undefined}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <ul
            id="school-select-listbox"
            ref={listRef}
            role="listbox"
            aria-label="Schools"
            className="max-h-72 overflow-y-auto py-1"
          >
            {clearLabel && (
              <li
                role="option"
                aria-selected={value === ""}
                onClick={() => choose("")}
                onMouseEnter={() => setHighlight(-1)}
                className="cursor-pointer px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                {clearLabel}
              </li>
            )}

            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-gray-400">
                No schools match &ldquo;{query}&rdquo;
              </li>
            ) : (
              filtered.map((school, index) => {
                const isSelected = school.id === value;
                const isHighlighted = index === highlight;
                return (
                  <li
                    key={school.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => choose(school.id)}
                    onMouseEnter={() => setHighlight(index)}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      isHighlighted ? "bg-indigo-50 text-indigo-800" : "text-gray-700"
                    } ${isSelected ? "font-semibold" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate">{school.name}</span>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-medium text-gray-400">
            {filtered.length} of {schools.length} schools
          </div>
        </div>
      )}
    </div>
  );
}

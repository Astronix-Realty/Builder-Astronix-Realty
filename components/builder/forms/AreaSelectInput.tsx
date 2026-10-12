"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, MapPin, Search, Check, Sparkles, Building2 } from "lucide-react";

export const KNOWN_AREAS_BY_SUBCITY: Record<string, string[]> = {
  "dombivli east": [
    "MIDC",
    "Sonar Pada",
    "Manpada",
    "Gharipada",
    "Kolegaon",
    "Nilje",
    "Bhopar",
    "Sagarli",
    "Lodha Palava",
    "Golavali",
    "Deslepada",
    "Ayre",
    "Chole",
    "Tukaram Nagar",
    "Pendharkar College Area",
    "Kalyan-Shil Road"
  ],
  "dombivli west": [
    "Vishnu Nagar",
    "Kopar",
    "Devicha Pada",
    "Ganesh Nagar",
    "Garibachawada",
    "Reti Bunder",
    "Thakurli",
    "Old Dombivli",
    "Gupte Road"
  ],
  "kalyan west": [
    "Khadakpada",
    "Gandhar Nagar",
    "Godrej Hill",
    "Wayle Nagar",
    "Chikanghar",
    "Adharwadi",
    "Beturkar Pada",
    "Rambaug",
    "Syndicate",
    "Birla College Road",
    "Barave"
  ],
  "kalyan east": [
    "Katemanivali",
    "Kolsewadi",
    "Chinchpada",
    "Tisgaon",
    "Nandivali",
    "Netivali",
    "Chakki Naka",
    "Vijaynagar",
    "Waldhuni",
    "Pune Link Road"
  ],
  "thane west": [
    "Ghodbunder Road",
    "Majiwada",
    "Vasant Vihar",
    "Kasarvadavali",
    "Hiranandani Estate",
    "Kolshet Road",
    "Naupada",
    "Panchpakhadi",
    "Balkum",
    "Manpada (Thane)",
    "Brahmand",
    "Wagle Estate",
    "Pokhran Road 1 & 2"
  ],
  "thane east": [
    "Kopri",
    "Naupada East",
    "Mithbunder",
    "Chendani Koliwada"
  ],
  "navi mumbai": [
    "Vashi",
    "Nerul",
    "Kharghar",
    "Panvel",
    "Belapur",
    "Seawoods",
    "Ulwe",
    "Dronagiri",
    "Airoli",
    "Ghansoli",
    "Kopar Khairane",
    "Taloja"
  ]
};

interface AreaSelectInputProps {
  value: string;
  onChange: (val: string) => void;
  subCity?: string;
  city?: string;
  detectedOptions?: string[];
  placeholder?: string;
  className?: string;
}

export default function AreaSelectInput({
  value,
  onChange,
  subCity = "",
  city = "",
  detectedOptions = [],
  placeholder = "Select or type area/gaon...",
  className = "",
}: AreaSelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine subcity key
  const normalizedSubCity = (subCity || "").toLowerCase().trim();
  const knownAreas = useMemo(() => {
    for (const [key, areas] of Object.entries(KNOWN_AREAS_BY_SUBCITY)) {
      if (normalizedSubCity.includes(key) || key.includes(normalizedSubCity)) {
        return areas;
      }
    }
    // Fallback: check city if subcity didn't match
    const normalizedCity = (city || "").toLowerCase().trim();
    for (const [key, areas] of Object.entries(KNOWN_AREAS_BY_SUBCITY)) {
      if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
        return areas;
      }
    }
    return [];
  }, [normalizedSubCity, city]);

  // Clean detected options from map
  const cleanDetected = useMemo(() => {
    const list: string[] = [];
    if (detectedOptions && Array.isArray(detectedOptions)) {
      detectedOptions.forEach((opt) => {
        const trimmed = (opt || "").trim();
        if (
          trimmed &&
          !list.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())
        ) {
          list.push(trimmed);
        }
      });
    }
    // If value is present and not yet in list, ensure it can be found
    if (
      value &&
      !list.some((existing) => existing.toLowerCase() === value.toLowerCase())
    ) {
      list.push(value.trim());
    }
    return list;
  }, [detectedOptions, value]);

  // Combined unique suggestions
  const allKnownFiltered = useMemo(() => {
    return knownAreas.filter(
      (area) =>
        !cleanDetected.some(
          (d) => d.toLowerCase() === area.toLowerCase()
        )
    );
  }, [knownAreas, cleanDetected]);

  // Filter based on search in dropdown
  const filteredDetected = useMemo(() => {
    if (!searchFilter.trim()) return cleanDetected;
    const q = searchFilter.toLowerCase();
    return cleanDetected.filter((item) => item.toLowerCase().includes(q));
  }, [cleanDetected, searchFilter]);

  const filteredKnown = useMemo(() => {
    if (!searchFilter.trim()) return allKnownFiltered;
    const q = searchFilter.toLowerCase();
    return allKnownFiltered.filter((item) => item.toLowerCase().includes(q));
  }, [allKnownFiltered, searchFilter]);

  // Quick suggestion chips: Top detected options (e.g. MIDC, Shankara Nagar Road)
  const quickChips = useMemo(() => {
    const chips: string[] = [];
    cleanDetected.forEach((d) => {
      if (chips.length < 4 && !chips.includes(d)) {
        chips.push(d);
      }
    });
    // Add top known if needed
    knownAreas.forEach((k) => {
      if (chips.length < 4 && !chips.includes(k)) {
        chips.push(k);
      }
    });
    return chips;
  }, [cleanDetected, knownAreas]);

  const handleSelectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setSearchFilter("");
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      {/* Input container with dropdown trigger button */}
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          list="area-suggestions-datalist"
          className="pr-10 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 shadow-sm"
        />

        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setSearchFilter("");
          }}
          title="Choose from map detected areas & gaon list"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#1A3C8C]" : ""
            }`}
          />
        </button>
      </div>

      {/* HTML5 Datalist for native browser autocomplete fallback */}
      <datalist id="area-suggestions-datalist">
        {cleanDetected.map((opt) => (
          <option key={`dl-det-${opt}`} value={opt} />
        ))}
        {knownAreas.map((opt) => (
          <option key={`dl-known-${opt}`} value={opt} />
        ))}
      </datalist>

      {/* Quick Clickable Suggestion Badges below Input */}
      {quickChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span className="text-[10px] uppercase font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#1A3C8C] dark:text-blue-400" />
            Suggestions:
          </span>
          {quickChips.map((chip) => {
            const isSelected = (value || "").toLowerCase() === chip.toLowerCase();
            return (
              <button
                type="button"
                key={`chip-${chip}`}
                onClick={() => onChange(chip)}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-[#1A3C8C] text-white border-[#1A3C8C] font-semibold shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
                {chip}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[42px] left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden mt-1 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Search within Dropdown */}
          <div className="p-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search area or gaon..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A3C8C]"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-2">
            {/* 1. Map Detected Section */}
            {filteredDetected.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Detected From Map Location
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {filteredDetected.map((item) => {
                    const isSelected = (value || "").toLowerCase() === item.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={`det-item-${item}`}
                        onClick={() => handleSelectOption(item)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-[#1A3C8C]/10 text-[#1A3C8C] font-semibold dark:bg-blue-900/30 dark:text-blue-300"
                            : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1A3C8C]" />
                          {item}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1A3C8C]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Known / Gaon Area List */}
            {filteredKnown.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Known Gaon / Areas in {subCity || "Region"}
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {filteredKnown.map((item) => {
                    const isSelected = (value || "").toLowerCase() === item.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={`known-item-${item}`}
                        onClick={() => handleSelectOption(item)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-[#2BB673]/10 text-[#2BB673] font-semibold dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {item}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2BB673]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredDetected.length === 0 && filteredKnown.length === 0 && (
              <div className="p-3 text-center text-xs text-gray-400">
                No matching area found. You can type it directly in the box above!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

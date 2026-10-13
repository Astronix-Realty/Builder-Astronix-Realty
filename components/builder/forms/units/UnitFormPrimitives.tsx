import React from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";

export function Section({
  id,
  title,
  description,
  icon: Icon,
  openIds,
  setOpenIds,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  openIds: string[];
  setOpenIds: React.Dispatch<React.SetStateAction<string[]>>;
  children: React.ReactNode;
}) {
  const isOpen = openIds.includes(id);
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() =>
          setOpenIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          )
        }
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {title}
            </span>
            {description && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-[11px] text-gray-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function Grid({
  cols = 2,
  children,
  className = "",
}: {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  const cls = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };
  return <div className={`grid gap-3 ${cls[cols]} ${className}`}>{children}</div>;
}

export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
        {title}
      </span>
      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
    </div>
  );
}

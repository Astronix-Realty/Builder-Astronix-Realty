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
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden mb-3">
      <button
        type="button"
        onClick={() =>
          setOpenIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          )
        }
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
              {title}
            </span>
            {description && (
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-normal">
                {description}
              </p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
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
    <div className="flex flex-col gap-1">
      <Label className="text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{hint}</p>
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

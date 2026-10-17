import React from "react";
import { Label } from "@/components/ui/label";
import { CollapsibleSection } from "@/components/builder/shared/atomic-forms/CollapsibleSection";

export function Section({
  id,
  title,
  description,
  icon: Icon,
  badge,
  openIds,
  setOpenIds,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  openIds: string[];
  setOpenIds: React.Dispatch<React.SetStateAction<string[]>>;
  children: React.ReactNode;
}) {
  return (
    <CollapsibleSection
      id={id}
      title={title}
      description={description}
      icon={Icon}
      badge={badge}
      openIds={openIds}
      setOpenIds={setOpenIds}
      variant="compact"
    >
      {children}
    </CollapsibleSection>
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

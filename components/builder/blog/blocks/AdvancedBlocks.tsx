"use client";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { BlockProps } from './index';
import {
  Plus, Trash2, UploadCloud, X, Loader2,
  CheckCircle2, XCircle, MousePointerClick,
  ArrowRight, Star, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { normalizeListItems, NormalizedListItem } from '@/lib/utils/blog-migration';
import Link from 'next/link';

// ─────────────────────────────────────────────────────
// Takeaways Block
// ─────────────────────────────────────────────────────
export const TakeawaysBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const items: NormalizedListItem[] = normalizeListItems(data.items);

  const updateItem = useCallback((id: string, value: string) => {
    onChange({ ...data, items: items.map(item => item.id === id ? { ...item, value } : item) });
  }, [items, data, onChange]);

  const addItem = useCallback(() => {
    onChange({ ...data, items: [...items, { id: uuidv4(), value: '' }] });
  }, [items, data, onChange]);

  const removeItem = useCallback((id: string) => {
    const filtered = items.filter(item => item.id !== id);
    onChange({ ...data, items: filtered.length ? filtered : [{ id: uuidv4(), value: '' }] });
  }, [items, data, onChange]);

  if (!isEditing) {
    const filledItems = items.filter(i => i.value.trim());
    if (!filledItems.length) return null;
    return (
      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/40 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-amber-200/50 dark:border-amber-900/30 pb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
            <Star className="w-5 h-5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
          </div>
          <h3 className="text-xl font-black text-amber-900 dark:text-amber-100 tracking-tight">KEY TAKEAWAYS</h3>
        </div>
        <ul className="space-y-4">
          {filledItems.map(item => (
            <li key={item.id} className="flex items-start gap-3 text-amber-900 dark:text-amber-200 font-medium">
              <div className="mt-1 w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              </div>
              <span className="leading-relaxed">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10 p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
          <Star className="w-3 h-3 inline-block mr-1 -mt-0.5" /> Key Takeaways
        </span>
        <button
          onClick={addItem}
          className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
        >
          + Add Point
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex gap-2 items-center">
          <input
            value={item.value}
            onChange={(e) => updateItem(item.id, e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="Key takeaway point..."
          />
          <button
            onClick={() => removeItem(item.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// FAQ Block
// ─────────────────────────────────────────────────────
export const FaqBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const questions: { q: string; a: string }[] = data.questions || [{ q: '', a: '' }];

  if (!isEditing) {
    return (
      <div className="mb-8 space-y-3">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h3>
        {questions.map((faq, i) => (
          <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex justify-between items-center text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-base pr-4">
                {faq.q || 'Untitled Question'}
              </span>
              <motion.span animate={{ rotate: openIndex === i ? 180 : 0 }} className="shrink-0 text-slate-400">▾</motion.span>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.a || 'No answer provided.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }

  const updateFaq = useCallback((index: number, key: 'q' | 'a', value: string) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], [key]: value };
    onChange({ ...data, questions: newQs });
  }, [questions, data, onChange]);

  const addFaq = useCallback(() => {
    onChange({ ...data, questions: [...questions, { q: '', a: '' }] });
  }, [questions, data, onChange]);

  const removeFaq = useCallback((index: number) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    onChange({ ...data, questions: newQs });
  }, [questions, data, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">FAQ Items ({questions.length})</span>
        <button
          onClick={addFaq}
          className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold transition-colors"
        >
          <Plus className="w-3 h-3" /> Add FAQ
        </button>
      </div>
      {questions.map((faq, i) => (
        <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex-1 space-y-2">
            <input
              value={faq.q || ''}
              onChange={(e) => updateFaq(i, 'q', e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={`Question ${i + 1}`}
            />
            <textarea
              value={faq.a || ''}
              onChange={(e) => updateFaq(i, 'a', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Answer..."
              rows={2}
            />
          </div>
          <button onClick={() => removeFaq(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-0.5">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Gallery Block
// ─────────────────────────────────────────────────────
export const GalleryBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const images: string[] = data.images || [];

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    const newImages = [...images];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await res.json();
        if (res.ok) {
          newImages.push(result.url);
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error || result.details || 'Unknown error'}`);
        }
      }
      onChange({ ...dataRef.current, images: newImages });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message === 'Failed to fetch' ? 'Network error: Could not connect to upload server.' : `Image upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploading(false);
    }
  }, [images, data, onChange]);

  const removeImage = useCallback((index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange({ ...data, images: newImages });
  }, [images, data, onChange]);

  if (!isEditing) {
    return images.length === 0 ? null : (
      <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
            <img
              src={url.replace('/upload/', '/upload/f_auto,q_auto,w_600,c_fill/')}
              alt={`Gallery ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Gallery ({images.length} images)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-slate-100 border border-slate-200">
            <img
              src={url.replace('/upload/', '/upload/f_auto,q_auto,w_400,c_fill/')}
              alt="Gallery item"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={() => removeImage(i)} className="p-2 bg-red-500 text-white rounded-full hover:scale-105 transition-transform">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-slate-400 disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : <UploadCloud className="w-6 h-6 mb-1" />}
          <span className="text-xs font-medium mt-1">{isUploading ? 'Uploading...' : 'Add Images'}</span>
        </button>
      </div>
      <input type="file" accept="image/*" multiple onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Pros & Cons Block — UUID-based stable items
// ─────────────────────────────────────────────────────
export const ProsConsBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  // Normalize on first render — handles old string[] format from DB
  const pros: NormalizedListItem[] = normalizeListItems(data.pros);
  const cons: NormalizedListItem[] = normalizeListItems(data.cons);

  // ── Update by item ID (stable, never index-based) ──
  const updateItem = useCallback(
    (key: 'pros' | 'cons', id: string, value: string) => {
      const list = key === 'pros' ? pros : cons;
      const updated = list.map(item => item.id === id ? { ...item, value } : item);
      onChange({ ...data, [key]: updated });
    },
    [pros, cons, data, onChange]
  );

  const addItem = useCallback((key: 'pros' | 'cons') => {
    const list = key === 'pros' ? pros : cons;
    onChange({ ...data, [key]: [...list, { id: uuidv4(), value: '' }] });
  }, [pros, cons, data, onChange]);

  const removeItem = useCallback((key: 'pros' | 'cons', id: string) => {
    const list = key === 'pros' ? pros : cons;
    const filtered = list.filter(item => item.id !== id);
    onChange({ ...data, [key]: filtered.length ? filtered : [{ id: uuidv4(), value: '' }] });
  }, [pros, cons, data, onChange]);

  // ── View mode ──────────────────────────────────────
  if (!isEditing) {
    const filledPros = pros.filter(p => p.value.trim());
    const filledCons = cons.filter(c => c.value.trim());
    return (
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 overflow-hidden">
          <div className="px-5 py-3 bg-green-100 dark:bg-green-900/30 flex items-center gap-2 border-b border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-bold text-green-800 dark:text-green-300 text-sm">Advantages</span>
            <span className="ml-auto text-xs text-green-600 font-semibold">{filledPros.length} points</span>
          </div>
          <ul className="p-4 space-y-3">
            {filledPros.length ? filledPros.map(pro => (
              <li key={pro.id} className="flex items-start gap-2.5 text-sm text-green-900 dark:text-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pro.value}</span>
              </li>
            )) : <li className="text-sm text-green-500/60 italic">No advantages added yet.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 overflow-hidden">
          <div className="px-5 py-3 bg-red-100 dark:bg-red-900/30 flex items-center gap-2 border-b border-red-200 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="font-bold text-red-800 dark:text-red-300 text-sm">Disadvantages</span>
            <span className="ml-auto text-xs text-red-500 font-semibold">{filledCons.length} points</span>
          </div>
          <ul className="p-4 space-y-3">
            {filledCons.length ? filledCons.map(con => (
              <li key={con.id} className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-200">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{con.value}</span>
              </li>
            )) : <li className="text-sm text-red-500/60 italic">No disadvantages added yet.</li>}
          </ul>
        </div>
      </div>
    );
  }

  // ── Editor mode ────────────────────────────────────
  const renderListEditor = (items: NormalizedListItem[], itemKey: 'pros' | 'cons', color: 'green' | 'red') => (
    <div className={`flex-1 rounded-xl border p-3 space-y-2 ${
      color === 'green'
        ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
        : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold uppercase tracking-widest ${color === 'green' ? 'text-green-600' : 'text-red-500'}`}>
          {itemKey === 'pros' ? '✓ Pros' : '✕ Cons'}
        </span>
        <button
          onClick={() => addItem(itemKey)}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
            color === 'green'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          }`}
        >
          + Add
        </button>
      </div>
      {items.map((item) => (
        // key = item.id (UUID) — NEVER index-based, survives add/remove perfectly
        <div key={item.id} className="flex gap-2 items-center">
          <input
            value={item.value}
            onChange={(e) => updateItem(itemKey, item.id, e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder={`${itemKey === 'pros' ? 'Advantage' : 'Disadvantage'}...`}
          />
          <button
            onClick={() => removeItem(itemKey, item.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {renderListEditor(pros, 'pros', 'green')}
      {renderListEditor(cons, 'cons', 'red')}
    </div>
  );
};

// ─── Table Block ──────────────────────────────────────────────────────────
export const TableBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const { title = '', rows = [['Header 1', 'Header 2'], ['Row 1, Cell 1', 'Row 1, Cell 2']] } = data;

  if (!isEditing) {
    if (!rows || rows.length === 0) return null;
    return (
      <div className="w-full max-w-4xl mx-auto px-5 mb-12 overflow-x-auto">
        {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
        <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
          <thead>
            <tr>
              {rows[0]?.map((cell: string, i: number) => (
                <th key={i} className="border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800 font-semibold">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row: string[], rowIndex: number) => (
              <tr key={rowIndex}>
                {row.map((cell: string, cellIndex: number) => (
                  <td key={cellIndex} className="border border-slate-200 dark:border-slate-700 p-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Editing Mode
  const updateCell = (rIndex: number, cIndex: number, val: string) => {
    const newRows = rows.map((r: string[], i: number) => i === rIndex ? r.map((c: string, j: number) => j === cIndex ? val : c) : r);
    onChange({ ...data, rows: newRows });
  };

  const addRow = () => {
    const cols = rows[0]?.length || 2;
    onChange({ ...data, rows: [...rows, Array(cols).fill('')] });
  };

  const addColumn = () => {
    const newRows = rows.map((r: string[]) => [...r, '']);
    onChange({ ...data, rows: newRows });
  };

  const removeRow = (rIndex: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_: any, i: number) => i !== rIndex);
    onChange({ ...data, rows: newRows });
  };

  const removeColumn = (cIndex: number) => {
    if (rows[0]?.length <= 1) return;
    const newRows = rows.map((r: string[]) => r.filter((_: any, i: number) => i !== cIndex));
    onChange({ ...data, rows: newRows });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Table Title (Optional)"
        value={title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
      />
      
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-1 mb-1">
            <div className="w-8 shrink-0" /> {/* Empty corner for row delete buttons */}
            {rows[0]?.map((_: any, cIndex: number) => (
              <div key={cIndex} className="w-48 shrink-0 flex justify-center">
                <button onClick={() => removeColumn(cIndex)} className="text-[10px] text-red-500 hover:bg-red-50 px-2 rounded">Delete Col</button>
              </div>
            ))}
          </div>

          {rows.map((row: string[], rIndex: number) => (
            <div key={rIndex} className="flex gap-1 items-center">
              <button onClick={() => removeRow(rIndex)} className="w-8 shrink-0 flex justify-center text-red-500 hover:bg-red-50 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
              {row.map((cell: string, cIndex: number) => (
                <input
                  key={cIndex}
                  type="text"
                  value={cell}
                  onChange={(e) => updateCell(rIndex, cIndex, e.target.value)}
                  placeholder={rIndex === 0 ? "Header" : "Cell data"}
                  className={`w-48 shrink-0 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none ${rIndex === 0 ? 'font-bold bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={addRow} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
          <Plus className="w-4 h-4" /> Add Row
        </button>
        <button onClick={addColumn} className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
          <Plus className="w-4 h-4" /> Add Column
        </button>
      </div>
    </div>
  );
};

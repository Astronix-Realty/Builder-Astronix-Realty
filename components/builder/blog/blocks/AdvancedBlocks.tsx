"use client";
import React, { useRef, useState, useCallback } from 'react';
import { BlockProps } from './index';
import {
  Plus, Trash2, UploadCloud, X, Loader2,
  CheckCircle2, XCircle, MousePointerClick,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { normalizeListItems, NormalizedListItem } from '@/lib/utils/blog-migration';
import Link from 'next/link';

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
        if (res.ok) {
          const result = await res.json();
          newImages.push(result.url);
        }
      }
      onChange({ ...data, images: newImages });
    } catch (error: any) {
      toast.error(error.message === 'Failed to fetch' ? 'Network error: Could not connect to upload server.' : 'Image upload failed.');
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

// ─────────────────────────────────────────────────────
// CTA Block — Fixed defaultData, fully functional
// ─────────────────────────────────────────────────────
export const CTA_VARIANTS = {
  minimal: {
    label: 'Minimal Blue',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border border-slate-200 dark:border-slate-800',
    heading: 'text-slate-950 dark:text-white',
    sub: 'text-slate-500 dark:text-slate-400',
    btn: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-blue-600/10',
  },
  luxury: {
    label: 'Luxury Gold',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    border: 'border border-amber-200 dark:border-amber-900/50',
    heading: 'text-amber-900 dark:text-amber-100',
    sub: 'text-amber-800 dark:text-amber-300',
    btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20',
  },
  dark: {
    label: 'Dark Sapphire',
    bg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950',
    border: 'border border-blue-900/40 dark:border-blue-900/20',
    heading: 'text-white',
    sub: 'text-blue-200/80',
    btn: 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-blue-600/20',
  },
  gradient: {
    label: 'Gradient Blue',
    bg: 'bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700',
    border: 'border border-transparent',
    heading: 'text-white',
    sub: 'text-blue-100 dark:text-blue-200',
    btn: 'bg-white text-blue-700 hover:bg-blue-50 shadow-blue-900/20',
  },
};

export const getButtonConfig = (url: string | undefined | null) => {
  const rawUrl = (url || '').trim();
  if (!rawUrl || rawUrl === '#') {
    return { href: '#', isExternal: false, isValid: false };
  }
  
  const isExternal = /^(https?:)?\/\//i.test(rawUrl);
  if (isExternal) {
    try {
      new URL(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl);
      return { href: rawUrl, isExternal: true, isValid: true };
    } catch {
      return { href: '#', isExternal: false, isValid: false };
    }
  }

  // Internal route
  const href = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return { href, isExternal: false, isValid: true };
};

export const CtaBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const variant = (data.variant || 'minimal') as keyof typeof CTA_VARIANTS;
  const cfg = CTA_VARIANTS[variant] || CTA_VARIANTS.minimal;

  // Always use controlled values — no undefined inputs
  const heading     = data.heading     ?? 'Ready to Get Started?';
  const description = data.description ?? 'Take the next step and discover your dream property today.';
  const buttonText  = data.buttonText  ?? 'Explore Properties';
  const buttonUrl   = data.buttonUrl   ?? '#';

  // ── View mode ──────────────────────────────────────
  if (!isEditing) {
    const { href, isExternal, isValid } = getButtonConfig(buttonUrl);

    const buttonProps = {
      className: `inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg active:scale-95 duration-200 cursor-pointer ${cfg.btn}`,
      onClick: !isValid ? (e: React.MouseEvent) => e.preventDefault() : undefined,
    };

    const buttonInner = (
      <>
        {buttonText} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </>
    );

    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 mb-12">
        <div className={`rounded-2xl ${cfg.bg} ${cfg.border} px-6 py-8 md:p-10 text-center shadow-xl relative overflow-hidden group`}>
          {variant === 'luxury' && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_45%)] pointer-events-none" />
          )}
          {variant === 'gradient' && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_40%)] pointer-events-none" />
          )}
          
          <h3 className={`text-2xl md:text-3xl font-black mb-3 leading-tight tracking-tight ${cfg.heading}`}>{heading}</h3>
          <p className={`text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed ${cfg.sub}`}>{description}</p>
          
          <div className="flex justify-center">
            {isExternal ? (
              <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                {...buttonProps}
              >
                {buttonInner}
              </motion.a>
            ) : (
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link href={href} {...buttonProps}>
                  {buttonInner}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Editor mode ────────────────────────────────────
  const update = useCallback((field: string, value: string) => {
    onChange({ ...data, [field]: value });
  }, [data, onChange]);

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Layout Preset</label>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(CTA_VARIANTS).map(([key, v]) => (
            <button
              key={key}
              onClick={() => onChange({ ...data, variant: key })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                variant === key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Heading</label>
          <input
            value={heading}
            onChange={(e) => update('heading', e.target.value)}
            className="w-full px-3 py-2.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Your CTA Headline..."
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Button Text</label>
          <input
            value={buttonText}
            onChange={(e) => update('buttonText', e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Get Started"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-slate-900 dark:text-white"
            placeholder="Compelling description..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Button URL</label>
          <input
            value={buttonUrl}
            onChange={(e) => update('buttonUrl', e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Live Preview</label>
        <div className={`rounded-2xl ${cfg.bg} ${cfg.border} p-6 text-center shadow-sm relative overflow-hidden group pointer-events-none select-none`}>
          {variant === 'luxury' && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_45%)] pointer-events-none" />
          )}
          {variant === 'gradient' && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_40%)] pointer-events-none" />
          )}
          <p className={`text-lg md:text-xl font-black mb-1.5 leading-tight tracking-tight ${cfg.heading}`}>{heading}</p>
          <p className={`text-xs md:text-sm mb-4 max-w-md mx-auto leading-relaxed ${cfg.sub}`}>{description}</p>
          <span className={`inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-[10px] font-bold ${cfg.btn} shadow`}>
            {buttonText} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

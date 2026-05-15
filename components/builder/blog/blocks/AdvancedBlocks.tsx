"use client";
import React, { useRef, useState, useCallback } from 'react';
import { BlockProps } from './index';
import {
  Plus, Trash2, UploadCloud, X, Loader2,
  CheckCircle2, XCircle, MousePointerClick,
  ArrowRight, LayoutTemplate, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────
// FAQ Block
// ─────────────────────────────────────────────────────
export const FaqBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const questions = data.questions || [{ q: '', a: '' }];

  if (!isEditing) {
    return (
      <div className="mb-8 space-y-3">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h3>
        {questions.map((faq: any, i: number) => (
          <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex justify-between items-center text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-base pr-4">
                {faq.q || 'Untitled Question'}
              </span>
              <motion.span animate={{ rotate: openIndex === i ? 180 : 0 }} className="shrink-0 text-slate-400">
                ▾
              </motion.span>
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

  const updateFaq = (index: number, key: string, value: string) => {
    const newQs = [...questions];
    newQs[index][key] = value;
    onChange({ ...data, questions: newQs });
  };

  const removeFaq = (index: number) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    onChange({ ...data, questions: newQs });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">FAQ Items ({questions.length})</span>
        <button
          onClick={() => onChange({ ...data, questions: [...questions, { q: '', a: '' }] })}
          className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold transition-colors"
        >
          <Plus className="w-3 h-3" /> Add FAQ
        </button>
      </div>
      {questions.map((faq: any, i: number) => (
        <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex-1 space-y-2">
            <input
              value={faq.q}
              onChange={(e) => updateFaq(i, 'q', e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Question ${i + 1}`}
            />
            <textarea
              value={faq.a}
              onChange={(e) => updateFaq(i, 'a', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
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
  const images = data.images || [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange({ ...data, images: newImages });
  };

  if (!isEditing) {
    return images.length === 0 ? null : (
      <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url: string, i: number) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
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
        {images.map((url: string, i: number) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-slate-100 border border-slate-200">
            <img src={url} alt="Gallery item" className="absolute inset-0 w-full h-full object-cover" />
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
          className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-slate-400"
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
// Pros & Cons Block — FULLY REDESIGNED
// ─────────────────────────────────────────────────────
export const ProsConsBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const pros: string[] = data.pros || [''];
  const cons: string[] = data.cons || [''];

  const updateList = (list: string[], index: number, value: string, key: 'pros' | 'cons') => {
    const newList = [...list];
    newList[index] = value;
    onChange({ ...data, [key]: newList });
  };

  const addItem = (list: string[], key: 'pros' | 'cons') =>
    onChange({ ...data, [key]: [...list, ''] });

  const removeItem = (list: string[], index: number, key: 'pros' | 'cons') => {
    const newList = list.filter((_, i) => i !== index);
    onChange({ ...data, [key]: newList.length ? newList : [''] });
  };

  if (!isEditing) {
    const filledPros = pros.filter(Boolean);
    const filledCons = cons.filter(Boolean);
    return (
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pros Card */}
        <div className="rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 overflow-hidden">
          <div className="px-5 py-3 bg-green-100 dark:bg-green-900/30 flex items-center gap-2 border-b border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-bold text-green-800 dark:text-green-300 text-sm">Advantages</span>
            <span className="ml-auto text-xs text-green-600 font-semibold">{filledPros.length} points</span>
          </div>
          <ul className="p-4 space-y-3">
            {filledPros.length ? filledPros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-green-900 dark:text-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pro}</span>
              </li>
            )) : <li className="text-sm text-green-500/60 italic">No advantages added yet.</li>}
          </ul>
        </div>
        {/* Cons Card */}
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 overflow-hidden">
          <div className="px-5 py-3 bg-red-100 dark:bg-red-900/30 flex items-center gap-2 border-b border-red-200 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="font-bold text-red-800 dark:text-red-300 text-sm">Disadvantages</span>
            <span className="ml-auto text-xs text-red-500 font-semibold">{filledCons.length} points</span>
          </div>
          <ul className="p-4 space-y-3">
            {filledCons.length ? filledCons.map((con, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-200">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{con}</span>
              </li>
            )) : <li className="text-sm text-red-500/60 italic">No disadvantages added yet.</li>}
          </ul>
        </div>
      </div>
    );
  }

  const ListEditor = ({ items, itemKey, color }: { items: string[], itemKey: 'pros' | 'cons', color: string }) => (
    <div className={`flex-1 rounded-xl border ${color === 'green' ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'} p-3 space-y-2`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold uppercase tracking-widest ${color === 'green' ? 'text-green-600' : 'text-red-500'}`}>
          {itemKey === 'pros' ? '✓ Pros' : '✕ Cons'}
        </span>
        <button onClick={() => addItem(items, itemKey)} className={`text-xs px-2 py-1 rounded-full font-semibold ${color === 'green' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-colors`}>
          + Add
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={item}
            onChange={(e) => updateList(items, i, e.target.value, itemKey)}
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={`${itemKey === 'pros' ? 'Advantage' : 'Disadvantage'} ${i + 1}...`}
          />
          <button onClick={() => removeItem(items, i, itemKey)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <ListEditor items={pros} itemKey="pros" color="green" />
      <ListEditor items={cons} itemKey="cons" color="red" />
    </div>
  );
};

// ─────────────────────────────────────────────────────
// CTA Block — FULLY REDESIGNED
// ─────────────────────────────────────────────────────
const CTA_VARIANTS = {
  minimal: { label: 'Minimal', bg: 'bg-white', border: 'border border-slate-200', heading: 'text-slate-900', sub: 'text-slate-500', btn: 'bg-slate-900 text-white hover:bg-slate-800' },
  luxury: { label: 'Luxury', bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border border-amber-200', heading: 'text-amber-900', sub: 'text-amber-700', btn: 'bg-amber-600 text-white hover:bg-amber-700' },
  dark: { label: 'Dark', bg: 'bg-slate-900', border: 'border border-slate-700', heading: 'text-white', sub: 'text-slate-400', btn: 'bg-white text-slate-900 hover:bg-slate-100' },
  gradient: { label: 'Gradient', bg: 'bg-gradient-to-r from-blue-600 to-purple-600', border: '', heading: 'text-white', sub: 'text-blue-100', btn: 'bg-white text-blue-700 hover:bg-blue-50' },
};

export const CtaBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const variant = (data.variant || 'minimal') as keyof typeof CTA_VARIANTS;
  const cfg = CTA_VARIANTS[variant] || CTA_VARIANTS.minimal;

  const heading = data.heading || 'Ready to Get Started?';
  const description = data.description || 'Take the next step and discover your dream property today.';
  const buttonText = data.buttonText || 'Explore Properties';
  const buttonUrl = data.buttonUrl || '#';

  if (!isEditing) {
    return (
      <div className={`mb-8 rounded-3xl ${cfg.bg} ${cfg.border} p-8 md:p-12 text-center shadow-sm`}>
        <h3 className={`text-2xl md:text-4xl font-black mb-3 ${cfg.heading}`}>{heading}</h3>
        <p className={`text-lg mb-8 max-w-xl mx-auto ${cfg.sub}`}>{description}</p>
        <a
          href={buttonUrl}
          className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg ${cfg.btn}`}
        >
          {buttonText} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

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
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${variant === key ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
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
          <input value={heading} onChange={(e) => onChange({ ...data, heading: e.target.value })}
            className="w-full px-3 py-2.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Your CTA Headline..." />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Button Text</label>
          <input value={buttonText} onChange={(e) => onChange({ ...data, buttonText: e.target.value })}
            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Get Started" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => onChange({ ...data, description: e.target.value })}
            rows={2} className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Compelling description..." />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Button URL</label>
          <input value={buttonUrl} onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="https://..." />
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Live Preview</label>
        <div className={`rounded-2xl ${cfg.bg} ${cfg.border} p-6 text-center shadow-sm pointer-events-none select-none`}>
          <p className={`text-lg font-black mb-1 ${cfg.heading}`}>{heading}</p>
          <p className={`text-xs mb-4 ${cfg.sub}`}>{description}</p>
          <span className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold ${cfg.btn} shadow`}>
            {buttonText} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

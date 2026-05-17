"use client";
import React, { useRef, useState, useCallback } from 'react';
import { BlockProps } from './index';
import { UploadCloud, X, Image as ImageIcon, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// Shared: Cloudinary DELETE helper
// ─────────────────────────────────────────────
const deleteFromCloudinary = (url: string) => {
  if (!url) return;
  fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(console.error);
};

// ─────────────────────────────────────────────
// Shared: Reusable Cover Upload Zone
// ─────────────────────────────────────────────
interface UploaderProps {
  label: string;
  hint?: string;
  imageUrl?: string;
  isUploading: boolean;
  progress?: number;
  onUpload: (file: File) => void;
  onRemove: () => void;
  aspectClass?: string; // e.g. "aspect-video" | "aspect-[4/5]"
}

const CoverUploadZone: React.FC<UploaderProps> = ({
  label, hint, imageUrl, isUploading, progress, onUpload, onRemove, aspectClass = 'aspect-video',
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onUpload(file);
  }, [onUpload]);

  return (
    <motion.div
      layout
      className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border-2 transition-all duration-200
        ${isDragging ? 'border-blue-500 shadow-xl shadow-blue-200 scale-[1.01]' : imageUrl ? 'border-transparent' : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
      />

      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 group"
          >
            {/* Blur skeleton while loading */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            )}
            <img
              src={imageUrl}
              alt={label}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Hover Action Bar */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <button
                onClick={() => { setImgLoaded(false); fileRef.current?.click(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm transition-all"
                title="Replace image"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Replace
              </button>
              <button
                onClick={() => window.open(imageUrl, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-slate-800 hover:text-white text-slate-800 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm transition-all"
                title="Open full size"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={onRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full shadow-lg transition-all"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 transition-colors p-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
                <span className="text-sm font-semibold text-blue-500">
                  Uploading{progress != null ? ` ${progress}%` : '...'}
                </span>
              </>
            ) : isDragging ? (
              <>
                <UploadCloud className="w-10 h-10 text-blue-500" />
                <span className="text-sm font-semibold text-blue-500">Drop to upload</span>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{hint || 'Click or drag & drop to upload'}</p>
                </div>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// HeroBlock
// ─────────────────────────────────────────────
export const HeroBlock: React.FC<BlockProps> = ({ data, onChange, isEditing, globalTitle, onGlobalTitleChange }) => {
  const [uploadingTarget, setUploadingTarget] = useState<'hero' | 'bg' | null>(null);

  const handleUpload = async (file: File, target: 'hero' | 'bg') => {
    setUploadingTarget(target);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const result = await res.json();

      // Safe cleanup: delete OLD only after NEW succeeds
      const oldUrl = target === 'hero' ? data.heroImageUrl : data.imageUrl;
      if (oldUrl) deleteFromCloudinary(oldUrl);

      if (target === 'hero') onChange({ ...data, heroImageUrl: result.url });
      else onChange({ ...data, imageUrl: result.url });
    } catch (err) {
      console.error(err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingTarget(null);
    }
  };

  const removeImg = (target: 'hero' | 'bg') => {
    const oldUrl = target === 'hero' ? data.heroImageUrl : data.imageUrl;
    deleteFromCloudinary(oldUrl);
    if (target === 'hero') onChange({ ...data, heroImageUrl: '' });
    else onChange({ ...data, imageUrl: '' });
  };

  // ─── PREVIEW MODE ───────────────────────────
  if (!isEditing) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full mb-12 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800"
      >
        {/* ── Cover Image ── */}
        <div className="w-full aspect-[16/7] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
          {data.imageUrl ? (
            <motion.img
              initial={{ scale: 1.04 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              src={data.imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_1600,c_fill/')}
              alt={data.heading || 'Cover'}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <ImageIcon className="w-14 h-14 text-slate-300 dark:text-slate-600" />
              <span className="text-sm text-slate-400 font-medium">No background image</span>
            </div>
          )}

          {/* Soft bottom fade so text doesn't fight the image */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />

          {/* Hero portrait pinned bottom-right */}
          {data.heroImageUrl && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 180 }}
              className="absolute bottom-0 right-8 w-28 md:w-40 aspect-[3/4] rounded-t-2xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-900"
            >
              <img
                src={data.heroImageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_400,c_fill,g_face/')}
                alt="Hero"
                className="w-full h-full object-cover object-top"
              />
            </motion.div>
          )}
        </div>

        {/* ── Text block below image ── */}
        <div className="px-6 pt-6 pb-10 md:px-12 md:pt-8 md:pb-12 space-y-4 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight"
          >
            {globalTitle || data.heading || <span className="text-slate-300 font-normal">Type here blog title</span>}
          </motion.h1>

          {data.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="text-lg md:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium"
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      </motion.article>
    );
  }

  // ─── EDITOR MODE ────────────────────────────
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">

      {/* Section header */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Hero Block</span>
      </div>

      <div className="p-5 space-y-5">

        {/* Row 1: Portrait + Text Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* Portrait image (left, 4/12 cols) */}
          <div className="md:col-span-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Hero Portrait
            </label>
            <CoverUploadZone
              label="Upload Portrait"
              hint="Best: 3:4 portrait · JPG/PNG/WebP"
              imageUrl={data.heroImageUrl}
              isUploading={uploadingTarget === 'hero'}
              onUpload={(f) => handleUpload(f, 'hero')}
              onRemove={() => removeImg('hero')}
              aspectClass="aspect-[3/4]"
            />
          </div>

          {/* Text inputs (right, 8/12 cols) */}
          <div className="md:col-span-8 flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Headline</label>
              <input
                type="text"
                value={globalTitle !== undefined ? globalTitle : (data.heading || '')}
                onChange={(e) => {
                  if (onGlobalTitleChange) onGlobalTitleChange(e.target.value);
                  else onChange({ ...data, heading: e.target.value });
                }}
                className="w-full px-4 py-3 text-xl font-extrabold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:font-normal placeholder:text-slate-300"
                placeholder="Type here blog title"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subtitle</label>
              <textarea
                value={data.subtitle || ''}
                onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder:text-slate-300"
                placeholder="A compelling description that draws readers in..."
              />
            </div>
          </div>
        </div>

        {/* Row 2: Background Cover Image (full width) */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
            Background Cover <span className="text-slate-300 font-normal normal-case">(16 : 9 landscape)</span>
          </label>
          <CoverUploadZone
            label="Upload Background Image"
            hint="Best: 1600 × 900 · JPG/PNG/WebP · 16:9"
            imageUrl={data.imageUrl}
            isUploading={uploadingTarget === 'bg'}
            onUpload={(f) => handleUpload(f, 'bg')}
            onRemove={() => removeImg('bg')}
            aspectClass="aspect-[16/5]"
          />
        </div>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// TextBlock
// ─────────────────────────────────────────────
export const TextBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  if (!isEditing) {
    return (
      <div className="mb-8 px-1">
        <p className="text-slate-700 dark:text-slate-300 text-lg leading-8 whitespace-pre-wrap font-serif">
          {data.content || ''}
        </p>
      </div>
    );
  }

  return (
    <div className="p-1">
      <textarea
        value={data.content || ''}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
        className="w-full min-h-[160px] px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y transition-all"
        placeholder="Write your article content here..."
      />
    </div>
  );
};

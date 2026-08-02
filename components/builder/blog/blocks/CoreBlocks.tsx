"use client";
import React, { useRef, useState, useCallback } from 'react';
import { BlockProps } from './index';
import { UploadCloud, X, Image as ImageIcon, Loader2, Maximize2, RefreshCw, Bold, Italic, Link2, List, Heading1, Heading2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Cloudinary URL optimization helpers
// ─────────────────────────────────────────────────────────────
export function optimizeCloudinaryUrl(url: string, width = 1200, options = 'f_auto,q_auto,c_fill'): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/${options},w_${width}/`);
}

// ─────────────────────────────────────────────────────────────
// Shared: Cloudinary DELETE helper
// ─────────────────────────────────────────────────────────────
const deleteFromCloudinary = (url: string) => {
  if (!url) return;
  fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(console.error);
};

// ─────────────────────────────────────────────────────────────
// Shared: Reusable Cover Upload Zone
// ─────────────────────────────────────────────────────────────
interface UploaderProps {
  label: string;
  hint?: string;
  imageUrl?: string;
  isUploading: boolean;
  progress?: number;
  onUpload: (file: File) => void;
  onRemove: () => void;
  aspectClass?: string;
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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onUpload(f);
    e.target.value = '';
  }, [onUpload]);

  return (
    <motion.div
      layout
      className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border-2 transition-all duration-200
        ${isDragging ? 'border-blue-500 shadow-xl shadow-blue-200 scale-[1.01]'
          : imageUrl ? 'border-transparent'
          : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
        }
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 group">
            {!imgLoaded && <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />}
            <img
              src={optimizeCloudinaryUrl(imageUrl, 1200)}
              alt={label}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={() => { setImgLoaded(false); fileRef.current?.click(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Replace
              </button>
              <button
                onClick={() => window.open(imageUrl, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-slate-800 hover:text-white text-slate-800 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={onRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full shadow-lg transition-all"
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

// ─────────────────────────────────────────────────────────────
// HeroBlock
// ─────────────────────────────────────────────────────────────
export const HeroBlock: React.FC<BlockProps> = ({ data, onChange, isEditing, globalTitle, onGlobalTitleChange }) => {
  const [uploadingTarget, setUploadingTarget] = useState<'hero' | 'bg' | null>(null);

  const handleUpload = useCallback(async (file: File, target: 'hero' | 'bg') => {
    setUploadingTarget(target);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const result = await res.json();
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
  }, [data, onChange]);

  const removeImg = useCallback((target: 'hero' | 'bg') => {
    const oldUrl = target === 'hero' ? data.heroImageUrl : data.imageUrl;
    deleteFromCloudinary(oldUrl);
    if (target === 'hero') onChange({ ...data, heroImageUrl: '' });
    else onChange({ ...data, imageUrl: '' });
  }, [data, onChange]);

  // ── PREVIEW MODE ─────────────────────────────────────────
  if (!isEditing) {
    return (
      <motion.article layout style={{ containerType: 'inline-size' }} className="w-full bg-white dark:bg-slate-950 rounded-[32px] overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-800/50 group">
        <div className="relative w-full h-[450px] md:h-[550px] bg-slate-100 dark:bg-slate-900 group-hover:scale-[1.02] transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
          {data.imageUrl ? (
            <img
              src={optimizeCloudinaryUrl(data.imageUrl, 1920)}
              alt="Cover"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <ImageIcon className="w-14 h-14 text-slate-300 dark:text-slate-600" />
              <span className="text-sm text-slate-400 font-medium">No background image</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-slate-950 to-transparent" />
          {data.heroImageUrl && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 180 }}
              className="absolute bottom-0 right-[clamp(1rem,5cqw,4rem)] w-[clamp(6rem,20cqw,16rem)] aspect-[3/4] rounded-t-2xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-950"
            >
              <img
                src={optimizeCloudinaryUrl(data.heroImageUrl, 400, 'f_auto,q_auto,w_400,c_fill,g_face')}
                alt="Hero"
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </motion.div>
          )}
        </div>
        <div className="px-[clamp(1.5rem,5cqw,4rem)] pt-[clamp(1.5rem,5cqw,3rem)] pb-[clamp(2.5rem,8cqw,4rem)] space-y-[clamp(1rem,3cqw,1.5rem)]">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-[clamp(1.8rem,7cqw,4rem)] font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight break-words"
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

  // ── EDITOR MODE ───────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Hero Block</span>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Hero Portrait</label>
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
                className="w-full px-4 py-3 text-xl font-extrabold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
                placeholder="Type here blog title"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subtitle</label>
              <textarea
                value={data.subtitle || ''}
                onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all resize-none placeholder:text-slate-300"
                placeholder="A compelling description that draws readers in..."
              />
            </div>
          </div>
        </div>
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

// ─────────────────────────────────────────────────────────────
// TextBlock
// ─────────────────────────────────────────────────────────────
export const TextBlock: React.FC<BlockProps> = ({ data, onChange, isEditing }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...data, content: e.target.value });
  }, [data, onChange]);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);

    const newText = before + prefix + selected + suffix + after;
    onChange({ ...data, content: newText });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  if (!isEditing) {
    return (
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-6 md:px-8 mb-8">
        <p className="whitespace-pre-wrap font-serif text-[clamp(1.0625rem,4vw,1.1875rem)] leading-[clamp(1.8rem,6vw,1.95rem)] text-slate-800 dark:text-slate-200 tracking-tight">
          {data.content || ''}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button type="button" onClick={() => insertMarkdown('# ', '')} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertMarkdown('## ', '')} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button type="button" onClick={() => insertMarkdown('- ', '')} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Bullet List">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Link">
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={data.content || ''}
        onChange={handleChange}
        className="w-full min-h-[160px] px-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed resize-y placeholder:text-slate-400"
        placeholder="Write your article content here... (Markdown supported)"
      />
    </div>
  );
};

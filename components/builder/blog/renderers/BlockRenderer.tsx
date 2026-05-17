"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { optimizeCloudinaryUrl } from '@/components/builder/blog/blocks/CoreBlocks';
import { normalizeListItems } from '@/lib/utils/blog-migration';
import Link from 'next/link';

export const BlockRenderer = ({ blocks, title }: { blocks: any[]; title?: string }) => {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'hero':     return <HeroRenderer     key={block.id || index} data={block.data} title={title} />;
          case 'text':     return <TextRenderer     key={block.id || index} data={block.data} />;
          case 'faq':      return <FaqRenderer      key={block.id || index} data={block.data} />;
          case 'gallery':  return <GalleryRenderer  key={block.id || index} data={block.data} />;
          case 'pros-cons':return <ProsConsRenderer key={block.id || index} data={block.data} />;
          case 'cta':      return <CtaRenderer      key={block.id || index} data={block.data} />;
          default:         return null;
        }
      })}
    </div>
  );
};

// ─── Hero ──────────────────────────────────────────────────────────────────
const HeroRenderer = ({ data, title }: { data: any; title?: string }) => (
  <div style={{ containerType: 'inline-size' }} className="relative w-full min-h-[420px] bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden mb-12 shadow-xl mt-4 md:mt-8 flex flex-wrap items-center justify-between p-[clamp(1.5rem,5cqw,4rem)] gap-[clamp(1.5rem,5cqw,3rem)]">
    {data.imageUrl ? (
      <img
        src={optimizeCloudinaryUrl(data.imageUrl, 1920)}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-40 select-none pointer-events-none"
        loading="lazy"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent hidden md:block" />
    
    <div className="relative z-10 flex-1 min-w-[280px] text-left space-y-[clamp(1rem,3cqw,1.5rem)]">
      <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="text-[clamp(2rem,7cqw,4rem)] font-black text-white leading-[1.1] tracking-tight drop-shadow-xl break-words">
        {title || data.heading}
      </motion.h1>
      {data.subtitle && (
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-[clamp(0.9rem,2.5cqw,1.25rem)] text-slate-200 font-medium leading-relaxed max-w-2xl drop-shadow-md">
          {data.subtitle}
        </motion.p>
      )}
    </div>
    
    {data.heroImageUrl && (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 w-[clamp(8rem,20cqw,20rem)] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border border-white/20 shrink-0 mx-auto">
        <img src={optimizeCloudinaryUrl(data.heroImageUrl, 900)} alt="Hero" className="w-full h-full object-cover" loading="lazy" />
      </motion.div>
    )}
  </div>
);

// ─── Text ──────────────────────────────────────────────────────────────────
const TextRenderer = ({ data }: { data: any }) => {
  if (!data.content) return null;
  return (
    <div className="w-full max-w-3xl mx-auto px-5 sm:px-6 md:px-8 mb-8">
      <p className="whitespace-pre-wrap font-serif text-[clamp(1.0625rem,4vw,1.1875rem)] leading-[clamp(1.8rem,6vw,1.95rem)] text-slate-800 dark:text-slate-200 tracking-tight">
        {data.content}
      </p>
    </div>
  );
};

// ─── FAQ ───────────────────────────────────────────────────────────────────
const FaqRenderer = ({ data }: { data: any }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!data.questions?.length) return null;
  return (
    <div className="px-4 md:px-8 space-y-4">
      <h3 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Frequently Asked Questions</h3>
      {data.questions.map((faq: any, i: number) => (
        <div key={i} className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex justify-between items-center text-left py-2 focus:outline-none group">
            <span className="text-xl font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{faq.q}</span>
            <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="pt-4 pb-2 text-slate-600 dark:text-slate-400 text-lg">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

// ─── Gallery ───────────────────────────────────────────────────────────────
const GalleryRenderer = ({ data }: { data: any }) => {
  if (!data.images?.length) return null;
  return (
    <div className="px-4 md:px-8 mb-16">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {data.images.map((url: string, i: number) => (
          <motion.div key={i} whileHover={{ scale: 1.03 }} className="relative aspect-square rounded-2xl overflow-hidden shadow-md cursor-pointer">
            <img src={optimizeCloudinaryUrl(url, 800)} alt={`Gallery ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Pros & Cons ───────────────────────────────────────────────────────────
const ProsConsRenderer = ({ data }: { data: any }) => {
  const pros = normalizeListItems(data.pros).filter(p => p.value.trim());
  const cons = normalizeListItems(data.cons).filter(c => c.value.trim());
  return (
    <div className="px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      <div className="rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 overflow-hidden">
        <div className="px-5 py-3 bg-green-100 dark:bg-green-900/30 flex items-center gap-2 border-b border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="font-bold text-green-800 dark:text-green-300 text-sm">Advantages</span>
          <span className="ml-auto text-xs text-green-600 font-semibold">{pros.length} points</span>
        </div>
        <ul className="p-4 space-y-3">
          {pros.length ? pros.map(pro => (
            <li key={pro.id} className="flex items-start gap-2.5 text-sm text-green-900 dark:text-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{pro.value}</span>
            </li>
          )) : <li className="text-sm text-green-500/60 italic">No advantages added.</li>}
        </ul>
      </div>
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 overflow-hidden">
        <div className="px-5 py-3 bg-red-100 dark:bg-red-900/30 flex items-center gap-2 border-b border-red-200 dark:border-red-800">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="font-bold text-red-800 dark:text-red-300 text-sm">Disadvantages</span>
          <span className="ml-auto text-xs text-red-500 font-semibold">{cons.length} points</span>
        </div>
        <ul className="p-4 space-y-3">
          {cons.length ? cons.map(con => (
            <li key={con.id} className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-200">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{con.value}</span>
            </li>
          )) : <li className="text-sm text-red-500/60 italic">No disadvantages added.</li>}
        </ul>
      </div>
    </div>
  );
};

// ─── CTA ───────────────────────────────────────────────────────────────────
import { getButtonConfig, CTA_VARIANTS } from '@/components/builder/blog/blocks/AdvancedBlocks';

const CtaRenderer = ({ data }: { data: any }) => {
  const variant = data.variant || 'minimal';
  const cfg = (CTA_VARIANTS as any)[variant] || (CTA_VARIANTS as any).minimal;
  const heading = data.heading || 'Ready to Get Started?';
  const description = data.description || '';
  const buttonText = data.buttonText || 'Explore Properties';
  const buttonUrl = data.buttonUrl || '#';

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
        
        <h3 className={`text-2xl md:text-3xl font-black mb-3 leading-tight tracking-tight ${cfg.heading}`}>
          {heading}
        </h3>
        {description && (
          <p className={`text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed ${cfg.sub}`}>
            {description}
          </p>
        )}
        
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
};

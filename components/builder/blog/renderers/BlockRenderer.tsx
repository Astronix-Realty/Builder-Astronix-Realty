"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, XCircle, ArrowRight, Star, ShieldCheck } from 'lucide-react';
import { optimizeCloudinaryUrl } from '@/components/builder/blog/blocks/CoreBlocks';
import { normalizeListItems } from '@/lib/utils/blog-migration';
import Link from 'next/link';

export const BlockRenderer = ({ blocks, title, blog }: { blocks: any[]; title?: string; blog?: any }) => {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'hero':     return <HeroRenderer     key={block.id || index} data={block.data} title={title} blog={blog} />;
          case 'text':     return <TextRenderer     key={block.id || index} data={block.data} />;
          case 'faq':      return <FaqRenderer      key={block.id || index} data={block.data} />;
          case 'gallery':  return <GalleryRenderer  key={block.id || index} data={block.data} />;
          case 'pros-cons':return <ProsConsRenderer key={block.id || index} data={block.data} />;
          case 'cta':      return <CtaRenderer      key={block.id || index} data={block.data} />;
          case 'takeaways':return <TakeawaysRenderer key={block.id || index} data={block.data} />;
          default:         return null;
        }
      })}
    </div>
  );
};

// ─── Hero ──────────────────────────────────────────────────────────────────
const HeroRenderer = ({ data, title, blog }: { data: any; title?: string; blog?: any }) => {
  const publishedDate = blog?.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft Preview';
  const category = blog?.category || 'General';
  const readTime = blog?.readTime || '5 min read';
  const authorName = blog?.authorName || 'Astronix Audit Team';
  const authorRole = blog?.authorRole || 'Real Estate Analyst';
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <div style={{ containerType: 'inline-size' }} className="relative w-full min-h-[500px] bg-slate-900 overflow-hidden mb-12 flex flex-wrap items-center justify-between p-[clamp(2rem,6cqw,5rem)] gap-[clamp(1.5rem,5cqw,3rem)]">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent hidden md:block" />
      
      <div className="relative z-10 w-full mb-auto pb-8">
        <Link href="/blogs" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-1">
          <ChevronDown className="w-4 h-4 rotate-90" /> BACK TO INSIGHTS
        </Link>
      </div>

      <div className="relative z-10 flex-1 min-w-[280px] text-left space-y-[clamp(1rem,3cqw,1.5rem)] mt-auto w-full max-w-4xl mx-auto md:mx-0">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/30 backdrop-blur-md">
            {category}
          </span>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-300 uppercase tracking-widest">
            <span>{publishedDate}</span>
            <span className="w-1 h-1 rounded-full bg-slate-500"></span>
            <span>{readTime}</span>
          </div>
        </div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(2.5rem,7cqw,4.5rem)] font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl break-words">
          {title || data.heading}
        </motion.h1>
        {data.subtitle && (
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[clamp(1rem,2.5cqw,1.25rem)] text-slate-300 font-medium leading-relaxed max-w-3xl drop-shadow-md">
            {data.subtitle}
          </motion.p>
        )}
        
        <div className="flex items-center gap-4 pt-4 border-t border-white/10 mt-6 max-w-md">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shrink-0">
            <span className="text-lg font-black text-slate-300">{initial}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{authorName}</p>
            <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase mt-0.5">{authorRole}</p>
          </div>
        </div>
      </div>
      
      {data.heroImageUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10 w-[clamp(10rem,25cqw,25rem)] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 mx-auto hidden lg:block mt-auto mb-10">
          <img src={optimizeCloudinaryUrl(data.heroImageUrl, 900)} alt="Hero" className="w-full h-full object-cover" loading="lazy" />
        </motion.div>
      )}
    </div>
  );
};

// ─── Text ──────────────────────────────────────────────────────────────────
const TextRenderer = ({ data }: { data: any }) => {
  if (!data.content) return null;

  // Very basic markdown parser for the formatting toolbar
  let htmlContent = data.content
    .replace(/</g, '&lt;') // Sanitize somewhat
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800 dark:text-white">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 className="text-3xl font-black mt-10 mb-5 text-slate-900 dark:text-white">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 className="text-4xl font-black mt-12 mb-6 text-slate-900 dark:text-white">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong className="font-bold text-slate-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em className="italic text-slate-700 dark:text-slate-300">$1</em>')
    .replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline decoration-blue-300 underline-offset-4">$1</a>')
    .replace(/^- (.*$)/gim, '<li className="ml-6 list-disc mb-2">$1</li>')
    .replace(/\n$/gim, '<br />');

  return (
    <div className="w-full max-w-3xl mx-auto px-5 sm:px-6 md:px-8 mb-12">
      <div 
        className="prose prose-lg dark:prose-invert prose-slate max-w-none font-sans text-[clamp(1.0625rem,4vw,1.1875rem)] leading-[clamp(1.8rem,6vw,1.95rem)] text-slate-700 dark:text-slate-300 tracking-tight"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
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
          <motion.div key={i} whileHover={{ scale: 1.02, y: -4 }} className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-800/50 cursor-pointer group">
            <img src={optimizeCloudinaryUrl(url, 800)} alt={`Gallery ${i + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
    <div className="px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
      <motion.div whileHover={{ y: -2 }} className="rounded-[2rem] border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/10 dark:border-emerald-800/40 overflow-hidden shadow-lg shadow-emerald-500/5 backdrop-blur-xl">
        <div className="px-6 py-5 border-b border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-black text-emerald-900 dark:text-emerald-100 text-lg tracking-tight">Advantages</span>
        </div>
        <ul className="p-6 space-y-4">
          {pros.length ? pros.map(pro => (
            <li key={pro.id} className="flex items-start gap-3.5 text-base text-emerald-900 dark:text-emerald-100 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{pro.value}</span>
            </li>
          )) : <li className="text-sm text-emerald-500/60 italic">No advantages added.</li>}
        </ul>
      </motion.div>
      <motion.div whileHover={{ y: -2 }} className="rounded-[2rem] border border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-rose-100/30 dark:from-rose-950/30 dark:to-rose-900/10 dark:border-rose-800/40 overflow-hidden shadow-lg shadow-rose-500/5 backdrop-blur-xl">
        <div className="px-6 py-5 border-b border-rose-200/50 dark:border-rose-800/50 flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 rounded-xl shadow-sm">
            <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
          </div>
          <span className="font-black text-rose-900 dark:text-rose-100 text-lg tracking-tight">Disadvantages</span>
        </div>
        <ul className="p-6 space-y-4">
          {cons.length ? cons.map(con => (
            <li key={con.id} className="flex items-start gap-3.5 text-base text-rose-900 dark:text-rose-100 font-medium">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{con.value}</span>
            </li>
          )) : <li className="text-sm text-rose-500/60 italic">No disadvantages added.</li>}
        </ul>
      </motion.div>
    </div>
  );
};

// ─── Takeaways ─────────────────────────────────────────────────────────────
const TakeawaysRenderer = ({ data }: { data: any }) => {
  const items = normalizeListItems(data.items).filter(i => i.value.trim());
  if (!items.length) return null;
  return (
    <div className="px-4 md:px-8 mb-12">
      <div className="rounded-[2rem] border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-amber-100/20 dark:from-amber-950/40 dark:to-amber-900/10 dark:border-amber-800/30 p-8 md:p-10 shadow-xl shadow-amber-500/5 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-8 border-b border-amber-200/50 dark:border-amber-800/50 pb-5">
          <div className="p-3 bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-800 dark:to-amber-700 rounded-2xl shrink-0 shadow-sm">
            <Star className="w-6 h-6 text-amber-900 dark:text-amber-100 fill-amber-900/20 dark:fill-amber-100/20" />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-amber-900 dark:text-amber-100 tracking-tight">KEY TAKEAWAYS</h3>
        </div>
        <ul className="space-y-5">
          {items.map((item, idx) => (
            <li key={item.id} className="flex items-start gap-4 text-amber-950 dark:text-amber-100/90 font-medium">
              <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-amber-200/60 dark:bg-amber-800/50 shrink-0 text-amber-700 dark:text-amber-400 text-xs font-bold">
                {idx + 1}
              </div>
              <span className="leading-relaxed text-[1.05rem] md:text-lg">{item.value}</span>
            </li>
          ))}
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
        
        {variant === 'rera' ? (
          <div className="flex flex-col md:flex-row items-center justify-between text-left gap-6">
            <div className="flex-1 flex items-start gap-5">
              <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className={`text-xl md:text-2xl font-black mb-2 leading-tight tracking-tight ${cfg.heading}`}>{heading}</h3>
                <p className={`text-sm leading-relaxed max-w-lg ${cfg.sub}`}>{description}</p>
              </div>
            </div>
            <div className="shrink-0">
              {isExternal ? (
                <motion.a href={href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }} {...buttonProps}>
                  {buttonInner}
                </motion.a>
              ) : (
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }} className="inline-block">
                  <Link href={href} {...buttonProps}>
                    {buttonInner}
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

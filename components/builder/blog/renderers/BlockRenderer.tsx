"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const BlockRenderer = ({ blocks }: { blocks: any[] }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'hero':
            return <HeroRenderer key={block.id || index} data={block.data} />;
          case 'text':
            return <TextRenderer key={block.id || index} data={block.data} />;
          case 'faq':
            return <FaqRenderer key={block.id || index} data={block.data} />;
          case 'gallery':
            return <GalleryRenderer key={block.id || index} data={block.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

// Renderers

const HeroRenderer = ({ data }: { data: any }) => {
  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] bg-slate-900 rounded-3xl overflow-hidden mb-16 shadow-2xl mt-8">
      {data.imageUrl ? (
        <motion.img 
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          src={data.imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_1920/')} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40" 
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />

      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-12">
        <div className="flex-1 text-left space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-xl"
          >
            {data.heading}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-2xl text-slate-200 font-medium leading-relaxed max-w-2xl drop-shadow-md"
          >
            {data.subtitle}
          </motion.p>
        </div>

        {data.heroImageUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full md:w-[350px] lg:w-[450px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0"
          >
            <img 
              src={data.heroImageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_1000/')} 
              alt="Hero Subject" 
              className="w-full h-full object-cover" 
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

const TextRenderer = ({ data }: { data: any }) => {
  if (!data.content) return null;
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none px-4 md:px-8">
      <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-serif">
        {data.content}
      </p>
    </div>
  );
};

const FaqRenderer = ({ data }: { data: any }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  if (!data.questions || data.questions.length === 0) return null;

  return (
    <div className="px-4 md:px-8 space-y-4">
      <h3 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Frequently Asked Questions</h3>
      {data.questions.map((faq: any, i: number) => (
        <div key={i} className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <button 
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex justify-between items-center text-left py-2 focus:outline-none group"
          >
            <span className="text-xl font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
              {faq.q}
            </span>
            <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="pt-4 pb-2 text-slate-600 dark:text-slate-400 text-lg">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

const GalleryRenderer = ({ data }: { data: any }) => {
  if (!data.images || data.images.length === 0) return null;

  return (
    <div className="px-4 md:px-8 mb-16">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {data.images.map((url: string, i: number) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.03 }}
            className="relative aspect-square rounded-2xl overflow-hidden shadow-md cursor-pointer"
          >
            <img 
              src={url.replace('/upload/', '/upload/f_auto,q_auto,w_800/')} 
              alt={`Gallery Image ${i+1}`} 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

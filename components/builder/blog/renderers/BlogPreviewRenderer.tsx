"use client";

import React from 'react';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';
import { optimizeCloudinaryUrl } from '@/components/builder/blog/blocks/CoreBlocks';

export const BlogPreviewRenderer = ({ 
  blocks, 
  title, 
  blog, 
  onClose 
}: { 
  blocks: any[]; 
  title?: string; 
  blog?: any; 
  onClose: () => void 
}) => {
  const TOC = blocks.map(block => {
    if (block.type === 'takeaways') return { id: block.id, title: 'Key Takeaways' };
    if (block.type === 'faq') return { id: block.id, title: 'Frequently Asked Questions' };
    if (block.type === 'pros-cons') return { id: block.id, title: 'Pros & Cons' };
    if (['text', 'market-trends', 'deep-dive', 'featured-projects'].includes(block.type)) {
      if (block.data.title) return { id: block.id, title: block.data.title };
      const match = block.data.content?.match(/<h[23][^>]*>(.*?)<\/h[23]>/i);
      if (match) return { id: block.id, title: match[1].replace(/<[^>]+>/g, '') };
    }
    return null;
  }).filter(Boolean) as { id: string, title: string }[];

  const publishedDate = blog?.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft Preview';
  const category = blog?.category || 'General';
  const readTime = blog?.readTime || '5 min read';
  const authorName = blog?.authorName || 'Astronix Audit Team';
  const coverImage = blog?.coverImage?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';

  return (
    <div className="bg-white min-h-screen pb-20 font-sans relative text-slate-900 w-full overflow-y-auto">
      {/* Floating Close Button */}
      <button 
        onClick={onClose} 
        className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md text-white hover:bg-amber-500 px-4 py-2 rounded-full transition-all text-xs font-bold uppercase tracking-widest shadow-xl border border-white/10"
      >
        <ArrowLeft className="w-4 h-4" /> Close Preview
      </button>

      {/* Main Content Layout */}
      <div className="container mx-auto px-6 max-w-7xl py-12 flex flex-col md:flex-row gap-12 text-slate-900">
        
        {/* Left Sidebar (TOC + Share) - Desktop Only */}
        <aside className="hidden md:flex flex-col gap-8 w-64 sticky top-12 h-fit shrink-0">
          <div className="border-l-2 border-slate-100 pl-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">In this Article</h4>
            <ul className="space-y-3">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a href={`#block-${item.id}`} className="text-sm font-medium text-slate-600 hover:text-amber-600 hover:underline decoration-amber-500 underline-offset-4 transition-all">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Share (Preview)</h4>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-white hover:bg-slate-50 transition-colors border border-slate-100">Share</button>
            </div>
          </div>
        </aside>

        {/* Center Content */}
        <article className="flex-1 max-w-3xl">
          <div className="space-y-12">
            {blocks.map((block) => (
              <div key={block.id} id={`block-${block.id}`} className="scroll-mt-12">
                <BlockRenderer blocks={[block]} title={title} blog={blog} />
              </div>
            ))}
          </div>
        </article>

      </div>

      {/* Footer CTA */}
      <section className="bg-slate-50 border-t border-slate-200 py-24 mt-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Still have questions?</h2>
          <p className="text-slate-500 mb-10 text-lg max-w-xl mx-auto">Get unbiased advice from our RERA certified experts. No spam, just facts.</p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold uppercase tracking-widest shadow-lg cursor-not-allowed">
              Talk to an Expert
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

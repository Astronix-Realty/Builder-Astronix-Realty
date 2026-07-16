"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { BlockRenderer } from '@/components/builder/blog/renderers/BlockRenderer';
import { toast } from 'sonner';

export default function BlogPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      // 1. Check Local Storage Draft First (Real-time Preview)
      const draftKey = `blog_draft_${id}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        setBlog(JSON.parse(savedDraft));
        setLoading(false);
        return;
      }

      // 2. Fallback to Database if no unsaved draft exists
      if (id !== 'new') {
        try {
          const res = await fetch(`/api/blogs/${id}`);
          if (res.ok) {
            const data = await res.json();
            setBlog(data.blog);
          }
        } catch (error) {
          console.error("Failed to fetch blog for preview", error);
        }
      }
      setLoading(false);
    };

    fetchBlog();
  }, [id]);

  const handlePublish = async () => {
    if (id === 'new') {
      toast.error("Please save the blog in the editor first before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      const payload = { ...blog, status: "published" };
      const res = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to publish");
      }
      
      toast.success("Blog published successfully!");
      router.push('/builder-dashboard?tab=blog');
    } catch (error: any) {
      toast.error(error.message || "Failed to publish blog");
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Preview Not Found</h1>
          <p className="text-slate-500 mt-2">No draft or saved blog found for this ID.</p>
          <button onClick={() => window.close()} className="mt-4 text-blue-500 hover:underline">Close Window</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-blue-200">
      
      {/* Builder Navbar (Sticky Top) */}
      <div className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.close()} 
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Editor
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-md">
              Live Preview Mode
            </span>
          </div>

          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-md shadow-blue-500/10 transition-all disabled:opacity-50"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish Now
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-10">
        
        {/* Dynamic Title if no Hero block exists to show it */}
        {(!blog.blocks || !blog.blocks.find((b: any) => b.type === 'hero')) && (
           <div className="mb-10">
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">{blog.title || "Untitled Blog"}</h1>
           </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-12 items-start relative">
          
          {/* LEFT: Main Content */}
          <div className="flex-1 w-full min-w-0 pb-24 lg:pb-0">
            <BlockRenderer blocks={blog.blocks || []} title={blog.title} blog={blog} />
          </div>
          
          {/* RIGHT: Sticky Sidebar */}
          <aside className="w-full lg:w-[340px] shrink-0 sticky top-[100px] hidden lg:flex flex-col gap-8">
            
            {/* Table of Contents */}
            <div className="bg-white/60 dark:bg-slate-900/40 rounded-3xl p-7 border border-white dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 dark:bg-blue-400/10 rounded-bl-full pointer-events-none" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Table of Contents
              </h3>
              <ul className="space-y-4">
                {blog.blocks?.filter((b: any) => b.type === 'takeaways' || b.type === 'pros-cons' || b.type === 'faq').map((b: any, idx: number) => {
                  const labels: any = { 'takeaways': 'Key Takeaways', 'pros-cons': 'Pros & Cons', 'faq': 'FAQs' };
                  return (
                    <li key={idx} className="group flex items-center gap-3">
                      <span className="text-slate-300 dark:text-slate-600 font-mono text-xs font-bold transition-colors group-hover:text-blue-500">0{idx + 1}</span>
                      <a href="#" className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-all group-hover:translate-x-1">
                        {labels[b.type]}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Featured Projects placeholder if IDs exist */}
            {blog.linkedProperties && blog.linkedProperties.length > 0 && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-7 border border-blue-500 shadow-xl shadow-blue-900/20 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-100 mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Featured Projects
                </h3>
                <div className="space-y-4">
                  {blog.linkedProperties.map((pid: string | any, i: number) => {
                    const id = typeof pid === 'string' ? pid : pid._id;
                    const name = typeof pid === 'string' ? `Project ID: ${id.slice(-6)}` : pid.name;
                    return (
                      <div key={i} className="flex gap-4 items-center bg-white/10 hover:bg-white/20 p-3 rounded-2xl border border-white/10 transition-all cursor-pointer group">
                        <div className="w-12 h-12 rounded-xl bg-black/20 shrink-0 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white truncate group-hover:text-blue-100 transition-colors">{name}</p>
                          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mt-0.5 group-hover:translate-x-1 transition-transform inline-block">Explore Project →</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </aside>
        </div>
      </main>

    </div>
  );
}

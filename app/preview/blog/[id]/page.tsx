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
            setBlog(data.data);
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
      const res = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" })
      });

      if (!res.ok) throw new Error("Failed to publish");
      
      toast.success("Blog published successfully!");
      router.push('/builder-dashboard?tab=blog');
    } catch (error) {
      toast.error("Failed to publish blog");
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
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
              Live Preview Mode
            </span>
          </div>

          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold rounded-full transition-all disabled:opacity-50"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish Now
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      <main className="pb-24">
        {/* Dynamic Title if no Hero block exists to show it */}
        {(!blog.blocks || !blog.blocks.find((b: any) => b.type === 'hero')) && (
           <div className="max-w-4xl mx-auto px-4 mt-12 mb-8">
             <h1 className="text-4xl font-black text-slate-900 dark:text-white">{blog.title || "Untitled Blog"}</h1>
           </div>
        )}
        
        <BlockRenderer blocks={blog.blocks || []} />
      </main>

    </div>
  );
}

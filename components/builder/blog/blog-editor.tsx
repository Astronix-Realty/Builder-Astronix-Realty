"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Play, CheckCircle2, AlertCircle, LayoutTemplate,
  HelpCircle, Image as ImageIcon, Scale, MousePointerClick, AlignLeft,
  Monitor, Smartphone, Lock, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

import { BlockRegistry, BlockType } from './blocks';
import { calculateBlogHealthScore, HealthScore } from '@/lib/utils/health-score';
import { SeoScoreWidget } from './SeoScoreWidget';
// import { useQuery, useMutation } from '@tanstack/react-query'; // Assuming installed



export function BlogEditor({ blogId, initialData, onBack }: { blogId?: string, initialData?: any, onBack: () => void }) {
  const router = useRouter();
  const [blog, setBlog] = useState(initialData || {
    title: '', slug: '', excerpt: '', status: 'draft', blocks: [], seo: {}, coverImage: {}
  });
  const [savedBlog, setSavedBlog] = useState(initialData); // Track server state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [health, setHealth] = useState<HealthScore>(calculateBlogHealthScore(blog));
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialData && !!blogId && blogId !== 'new');
  
  const draftPrompted = React.useRef(false);

  // Update Health score when blog changes
  useEffect(() => {
    setHealth(calculateBlogHealthScore(blog));
  }, [blog]);

  // Initial Fetch if only ID provided
  useEffect(() => {
    if (!initialData && blogId && blogId !== 'new') {
      const fetchBlog = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/blogs/${blogId}`);
          if (res.ok) {
            const data = await res.json();
            setBlog(data.blog);
            setSavedBlog(data.blog);
          } else {
            toast.error("This article could not be loaded.");
          }
        } catch (e) {
          toast.error("Failed to connect to server.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchBlog();
    }
  }, [blogId, initialData]);

  // Local Storage Draft Recovery
  useEffect(() => {
    if (draftPrompted.current) return;
    
    const draftKey = `blog_draft_${blogId || 'new'}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      draftPrompted.current = true;
      try {
        const parsed = JSON.parse(savedDraft);
        const draftTime = parsed.localUpdatedAt || 0;
        const serverTime = savedBlog?.updatedAt ? new Date(savedBlog.updatedAt).getTime() : 0;

        // Only show recovery if local draft is significantly newer (>10 seconds)
        if (draftTime - serverTime > 10000) {
            toast('Unsaved draft found', {
            description: 'Would you like to recover your unsaved changes?',
            action: {
                label: 'Recover',
                onClick: () => setBlog(parsed)
            },
            cancel: {
                label: 'Discard',
                onClick: () => localStorage.removeItem(draftKey)
            },
            duration: 10000,
            });
        } else {
            // Silently discard old drafts
            localStorage.removeItem(draftKey);
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
        localStorage.removeItem(draftKey); // Discard corrupted
      }
    }
  }, [blogId, savedBlog]);

  // Auto-save to Local Storage
  useEffect(() => {
    const draftKey = `blog_draft_${blogId || 'new'}`;
    const timer = setTimeout(() => {
      // Only save to local storage if there are unsaved changes
      if (JSON.stringify(blog) !== JSON.stringify(savedBlog)) {
        if (blog.title || (blog.blocks && blog.blocks.length > 0)) {
          localStorage.setItem(draftKey, JSON.stringify({ ...blog, localUpdatedAt: Date.now() }));
        }
      } else {
        // If clean, ensure no stale draft exists
        localStorage.removeItem(draftKey);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [blog, blogId, savedBlog]);

  const handleAddBlock = (type: BlockType) => {
    // Enforce single instance for unique blocks
    if (type === 'hero' || type === 'pros-cons') {
      const exists = (blog.blocks || []).find((b: any) => b.type === type);
      if (exists) {
        toast.error(`Only one ${BlockRegistry[type].label} is allowed.`);
        return;
      }
    }

    const def = BlockRegistry[type];
    const newBlock = { id: `block-${Date.now()}`, type, data: { ...def.defaultData } };
    setBlog({ ...blog, blocks: [...(blog.blocks || []), newBlock] });
  };

  const updateBlock = (index: number, data: any) => {
    const newBlocks = [...blog.blocks];
    newBlocks[index] = { ...newBlocks[index], data };
    setBlog({ ...blog, blocks: newBlocks });
  };

  const handlePublish = async () => {
    const newErrors: Record<string, string> = {};

    if (!blog.title || blog.title.length < 5) {
      newErrors.title = "A descriptive title (5+ chars) is required.";
    }
    
    if (!blog.blocks || blog.blocks.length === 0) {
      newErrors.blocks = "At least 1 content block is required.";
    } else {
        const heroBlock = blog.blocks.find((b: any) => b.type === 'hero');
        if (!heroBlock?.data?.portraitImage && !heroBlock?.data?.coverImage && !blog.coverImage?.url) {
            newErrors.hero = "A hero or cover image is required.";
        }

        let wordCount = 0;
        blog.blocks.forEach((b: any) => {
            if (b.type === 'text' && b.data?.content) {
                wordCount += b.data.content.split(/\s+/).filter(Boolean).length;
            }
        });
        if (wordCount < 100) { // Slightly lower threshold for publishing than SEO "good" score
            newErrors.content = `Content too short (${wordCount}/100 words min).`;
        }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the highlighted errors before publishing.");
      return;
    }
    
    setErrors({}); // Clear errors
    
    if (health.score < 50) { // Adjusted from 80 based on new 0-based scale
      const confirmLowScore = window.confirm(`Your SEO score is low (${health.score}/100). Publish anyway?`);
      if (!confirmLowScore) return;
    } else {
        const confirmPublish = window.confirm("Ready to go live? This will make the article visible to the public.");
        if (!confirmPublish) return;
    }

    await handleSave("published");
  };

  const handleSave = async (statusOverride?: string, isAutosave = false) => {
    if (isSaving) return;
    if (!isAutosave) setIsSaving(true);

    try {
      const finalStatus = statusOverride || blog.status;
      const payload = { ...blog, status: finalStatus };
      
      const isNew = !blogId || blogId === 'new';
      const url = isNew ? '/api/blogs' : `/api/blogs/${blogId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || "Save failed");
      }

      const result = await res.json();
      const updatedBlog = result.blog;

      if (!isAutosave) {
        toast.success(finalStatus === 'published' ? 'Blog published successfully!' : 'Draft saved successfully');
      }
      
      setSavedBlog(updatedBlog);
      localStorage.removeItem(`blog_draft_${blogId || 'new'}`);
      
      // Exit editor on manual save (Draft or Publish)
      if (!isAutosave) {
        onBack();
      }
      
    } catch (err: any) {
      if (!isAutosave) toast.error(err.message);
    } finally {
      if (!isAutosave) setIsSaving(false);
    }
  };

  // Debounced Server Autosave
  useEffect(() => {
    if (isLoading || isSaving) return;
    
    // Only autosave if there are actual changes compared to server state
    const hasChanges = JSON.stringify(blog) !== JSON.stringify(savedBlog);
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      // Don't autosave empty new blogs
      if (blog.title || (blog.blocks && blog.blocks.length > 0)) {
        handleSave(blog.status, true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [blog, savedBlog, isLoading, isSaving]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Fetching your masterpiece...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* HEADER */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        <div className="flex flex-col gap-1">
          <input 
            type="text"
            value={blog.title === "Untitled Blog" ? "" : blog.title}
            onChange={e => setBlog({...blog, title: e.target.value})}
            className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-300 w-96"
            placeholder="Type here blog title"
          />
          {errors.title && <span className="text-xs text-red-500 font-medium px-1">{errors.title}</span>}
        </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium mr-2">
            {isSaving ? (
              <span className="text-slate-500 animate-pulse flex items-center gap-1"><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/> Saving...</span>
            ) : JSON.stringify(blog) !== JSON.stringify(savedBlog) ? (
              <span className="text-amber-500 flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"/> Unsaved changes</span>
            ) : (
              <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>
            )}
          </div>
          
          <SeoScoreWidget health={health} />
          
          <button 
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving && blog.status === 'draft' ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          
          <button 
            onClick={() => {
              // Ensure we save the latest state to localStorage before opening preview
              const draftKey = `blog_draft_${blogId || 'new'}`;
              localStorage.setItem(draftKey, JSON.stringify(blog));
              window.open(`/preview/blog/${blogId || 'new'}`, '_blank');
            }}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center gap-2"
          >
            <LayoutTemplate className="w-4 h-4" /> Full Preview
          </button>
          
          <button 
            onClick={handlePublish}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isSaving && blog.status === 'published' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            Publish Now
          </button>
        </div>
      </header>

      {/* Inline Errors Panel */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 items-center">
          <span className="text-sm font-bold text-red-700 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Please fix before publishing:</span>
          {Object.entries(errors).map(([key, msg]) => (
            <span key={key} className="text-xs text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded-full">{msg}</span>
          ))}
        </div>
      )}

      {/* MAIN CONTENT AREA: Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: Editor */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">

          {/* ── Sticky Block Adder ── */}
          <div className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Add Content Block</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(BlockRegistry).map((def) => {
                const icons: any = { LayoutTemplate, AlignLeft, HelpCircle, ImageIcon, Scale, MousePointerClick };
                const Icon = icons[def.icon] || AlignLeft;
                
                const isUniqueBlock = def.type === 'hero' || def.type === 'pros-cons';
                const exists = isUniqueBlock && (blog.blocks || []).some((b: any) => b.type === def.type);

                return (
                  <button
                    key={def.type}
                    onClick={() => handleAddBlock(def.type)}
                    disabled={exists}
                    className={`px-3 py-1.5 border rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all
                      ${exists 
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-500' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {def.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Scrollable Block List ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
              {(blog.blocks || []).map((block: any, index: number) => {
                const BlockComponent = BlockRegistry[block.type as BlockType]?.component;
                if (!BlockComponent) return null;
                
                return (
                  <div key={block.id} className="relative group">
                    {/* Block Toolbar */}
                    <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md flex overflow-hidden z-10">
                      <button onClick={() => {
                        const newBlocks = [...blog.blocks];
                        newBlocks.splice(index, 1);
                        setBlog({...blog, blocks: newBlocks});
                      }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Block">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                         <span className="text-xs font-bold uppercase tracking-wider">{BlockRegistry[block.type as BlockType].label}</span>
                      </div>
                      <BlockComponent 
                        id={block.id} 
                        data={block.data} 
                        onChange={(newData) => updateBlock(index, newData)} 
                        isEditing={true} 
                        globalTitle={blog.title === "Untitled Blog" ? "" : blog.title}
                        onGlobalTitleChange={(title) => setBlog({...blog, title})}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Empty state when no blocks added */}
              {(!blog.blocks || blog.blocks.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <LayoutTemplate className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No blocks yet</p>
                  <p className="text-xs text-slate-400 mt-1">Use the toolbar above to add your first block</p>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* RIGHT PANE: Live Preview + Health Engine */}
        <div className="w-1/2 flex flex-col bg-slate-100/50 dark:bg-slate-950 relative">
          
          {/* View Toggles */}
          <div className="shrink-0 flex items-center justify-center py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-md transition-colors ${previewMode==='desktop'?'bg-white dark:bg-slate-700 shadow-sm':'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Monitor className="w-4 h-4"/></button>
              <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-md transition-colors ${previewMode==='mobile'?'bg-white dark:bg-slate-700 shadow-sm':'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Smartphone className="w-4 h-4"/></button>
            </div>
          </div>

          {/* Scrollable Preview */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
             <div className={`bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ${previewMode === 'mobile' ? 'w-[375px] rounded-[2rem] border-8 min-h-[812px]' : 'w-full max-w-3xl rounded-xl'}`}>
                {/* PREVIEW RENDER */}
                <div className={`${previewMode === 'mobile' ? 'p-4' : 'p-6 md:p-10'}`}>
                   <div className="prose prose-slate dark:prose-invert max-w-none prose-img:rounded-xl prose-headings:font-bold prose-a:text-blue-600">
                     {/* Title strip only if no hero block */}
                     {!(blog.blocks || []).find((b: any) => b.type === 'hero') && (
                       <h1 className="text-3xl font-extrabold mb-8 text-slate-900 dark:text-white">
                         {(!blog.title || blog.title === "Untitled Blog") ? (
                           <span className="text-slate-300 font-normal">Type here blog title</span>
                         ) : (
                           blog.title
                         )}
                       </h1>
                     )}
                     
                     {(blog.blocks || []).map((block: any) => {
                        const BlockComponent = BlockRegistry[block.type as BlockType]?.component;
                        if (!BlockComponent) return null;
                        return <BlockComponent key={block.id} id={block.id} data={block.data} onChange={()=>{}} isEditing={false} globalTitle={blog.title === "Untitled Blog" ? "" : blog.title} />;
                     })}
                   </div>

                   {(!blog.blocks || blog.blocks.length === 0) && (
                     // Premium skeleton empty state
                     <div className="animate-pulse space-y-6 p-2">
                       <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                       <div className="space-y-3 pt-2">
                         <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-3/4" />
                         <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
                         <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6" />
                       </div>
                       <div className="space-y-2 pt-2">
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-4/5" />
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
                       </div>
                       <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl mt-4" />
                       <p className="text-center text-xs text-slate-300 dark:text-slate-600 font-medium pt-2">Add blocks on the left to see your article preview</p>
                     </div>
                   )}
                </div>
             </div>
          </div>



        </div>

      </div>
    </div>
  );
}

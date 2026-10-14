"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Edit2, Trash2, FileText, Search, X,
  Clock, Eye, Calendar, Menu, RefreshCw, Layers, CheckCircle2
} from "lucide-react";
import { BlogEditor } from "./blog-editor";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type FilterStatus = "all" | "published" | "draft" | "scheduled";

export interface BlogViewProps {
  onMenuClick?: () => void;
}

export function BlogView({ onMenuClick }: BlogViewProps) {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const BLOG_CATEGORIES = [
    "Project Reviews",
    "Locality Analysis",
    "Buying Guide",
    "Legal & RERA",
    "Investment Advisory",
    "Home Loans & Finance",
    "Market Trends"
  ];

  const handleCreateNewBlog = () => {
    if (!selectedCategory) {
      toast.error("Please select a blog category");
      return;
    }
    setIsCategoryModalOpen(false);
    setEditingBlogId("new");
  };

  const [blogSearchInput, setBlogSearchInput] = useState<Record<string, string>>({
    all: "",
    published: "",
    draft: "",
    scheduled: ""
  });
  
  const [debouncedBlogSearch, setDebouncedBlogSearch] = useState<Record<string, string>>({
    all: "",
    published: "",
    draft: "",
    scheduled: ""
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBlogSearch(blogSearchInput);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [blogSearchInput]);

  const fetchBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/blogs", window.location.origin);
      url.searchParams.set("limit", "100");
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.blogs || []);
      }
    } catch {
      toast.error("Failed to fetch blogs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!editingBlogId) fetchBlogs();
  }, [editingBlogId, fetchBlogs]);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this blog?")) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Blog deleted successfully");
        setBlogs(prev => prev.filter(b => b._id !== id));
      } else {
        toast.error("Failed to delete blog");
      }
    } catch {
      toast.error("An error occurred while deleting. Please try again.");
    }
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return <span>{text}</span>;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return <span>{text}</span>;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <span>
        {before}
        <mark className="bg-yellow-100 dark:bg-yellow-500/30 text-yellow-800 dark:text-yellow-250 px-0.5 rounded font-semibold">{match}</mark>
        {after}
      </span>
    );
  };

  const displayedBlogs = useMemo(() => {
    const query = (debouncedBlogSearch[filterStatus] || "").toLowerCase().trim();
    return blogs.filter(b => {
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      if (!query) return true;

      const title = (b.title || "").toLowerCase();
      const excerpt = (b.excerpt || "").toLowerCase();
      const category = (b.category || "").toLowerCase();
      
      return title.includes(query) || excerpt.includes(query) || category.includes(query);
    });
  }, [blogs, filterStatus, debouncedBlogSearch]);

  if (editingBlogId) {
    const blogToEdit = editingBlogId === "new" ? undefined : blogs.find(b => b._id === editingBlogId);
    return (
      <div className="h-full w-full">
        <BlogEditor 
          blogId={editingBlogId === 'new' ? undefined : editingBlogId} 
          initialData={editingBlogId === 'new' ? { category: selectedCategory } : undefined}
          onBack={() => {
            setEditingBlogId(null);
            fetchBlogs();
          }}
        />
      </div>
    );
  }

  const FILTERS: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: blogs.length },
    { key: "published", label: "Published", count: blogs.filter(b => b.status === 'published').length },
    { key: "draft", label: "Drafts", count: blogs.filter(b => b.status === 'draft').length },
    { key: "scheduled", label: "Scheduled", count: blogs.filter(b => b.status === 'scheduled').length },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 dark:bg-slate-950 overflow-hidden">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-1.5 mb-1 select-none">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold ml-1">Astronix News & Blog Studio</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Editorial Hub</h2>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 -translate-x-1/2">
             {FILTERS.map(f => (
               <button
                 key={f.key}
                 onClick={() => setFilterStatus(f.key)}
                 className={`pb-1 transition-colors ${filterStatus === f.key ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
               >
                 {f.label} ({f.count})
               </button>
             ))}
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20">
               <Plus className="h-4 w-4" />
               <span className="hidden sm:inline">Add Blog</span>
               <span className="software-kbd hidden xl:inline text-white/90 bg-white/20 border-white/30">+N</span>
             </button>
          </div>
        </div>

        <div className="md:hidden mt-4 flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
           {FILTERS.map(f => (
             <button
               key={f.key}
               onClick={() => setFilterStatus(f.key)}
               className={`flex-1 py-2 text-sm rounded-md font-medium transition ${filterStatus === f.key ? "bg-white dark:bg-slate-900 text-blue-600 shadow" : "text-slate-600 dark:text-slate-400"}`}
             >
               {f.label} ({f.count})
             </button>
           ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div>
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your Blogs</h2>
              <p className="text-slate-600 dark:text-slate-400">Manage and create new articles</p>
            </div>

            <div className="relative flex-1 max-w-md w-full md:mx-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={blogSearchInput[filterStatus] || ""}
                onChange={(e) => setBlogSearchInput(prev => ({ ...prev, [filterStatus]: e.target.value }))}
                placeholder={`Search ${filterStatus === 'all' ? '' : filterStatus} blogs...`}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-600 transition-all shadow-sm text-slate-900 dark:text-white"
              />
              {blogSearchInput[filterStatus] && (
                <button
                  onClick={() => setBlogSearchInput(prev => ({ ...prev, [filterStatus]: "" }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={fetchBlogs}
              disabled={isLoading}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && displayedBlogs.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[380px] animate-pulse">
                  <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-t-xl" />
                  <div className="p-5 flex-1">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6" />
                    <div className="grid grid-cols-1 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : displayedBlogs.length === 0 && blogs.filter(b => filterStatus === 'all' || b.status === filterStatus).length > 0 ? (
              <div className="col-span-full py-16 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Blogs Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  We couldn't find any blogs matching "{debouncedBlogSearch[filterStatus]}" in this tab. Try adjusting your search query.
                </p>
                {blogSearchInput[filterStatus] && (
                  <button
                    onClick={() => setBlogSearchInput(prev => ({ ...prev, [filterStatus]: "" }))}
                    className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              displayedBlogs.map(blog => {
                const heroBlock = blog.blocks?.find((b: any) => b.type === "hero");
                const displayImage = heroBlock?.data?.heroImageUrl || blog.coverImage?.url || heroBlock?.data?.imageUrl;
                const displayExcerpt = blog.excerpt || heroBlock?.data?.subtitle || "";
                const wordCount = blog.blocks?.reduce((n: number, b: any) =>
                  b.type === "text" ? n + (b.data?.content || "").split(/\s+/).filter(Boolean).length : n, 0) ?? 0;
                const readTime = Math.max(1, Math.ceil(wordCount / 200));
                const lastEdited = blog.updatedAt ? formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true }) : "";

                const statusConfig: Record<string, { cls: string; label: string }> = {
                  published: { cls: "bg-emerald-500/80 text-white border-emerald-400/50", label: "Published" },
                  scheduled: { cls: "bg-purple-500/80 text-white border-purple-400/50", label: "Scheduled" },
                  draft:     { cls: "bg-slate-500/80 text-white border-slate-400/50", label: "Draft" },
                  archived:  { cls: "bg-slate-400/80 text-white border-slate-300/50", label: "Archived" },
                };
                const statusCfg = statusConfig[blog.status] || statusConfig.draft;

                return (
                  <div
                    key={blog._id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                    onClick={() => setEditingBlogId(blog._id)}
                  >
                    <div className="h-44 w-full relative bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={blog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                          <div className="p-4 rounded-3xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                            <FileText className="h-10 w-10 opacity-60" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 z-20">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{blog.category || "General"}</span>
                      </div>
                      
                      <div className="absolute top-4 right-4 z-20">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-xl border backdrop-blur-sm ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2" title={blog.title}>
                            {highlightMatch(blog.title || "Untitled Blog", debouncedBlogSearch[filterStatus] || "")}
                          </h3>
                        </div>
                      </div>
                      
                      {displayExcerpt && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg mb-3">
                           <span className="line-clamp-2">{highlightMatch(displayExcerpt, debouncedBlogSearch[filterStatus] || "")}</span>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 mt-auto">
                       <div className="grid gap-4 text-center grid-cols-1">
                          <div>
                            <div className="text-xl font-black text-slate-800 dark:text-white">{readTime}m</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Read Time</div>
                          </div>
                       </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-medium uppercase tracking-tight">
                          Synced {lastEdited}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        ID: <span className="text-slate-300 dark:text-slate-600">{blog._id.slice(-6)}</span>
                      </div>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingBlogId(blog._id); }}
                        className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(blog._id, e)}
                        className="px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-red-700 dark:hover:border-red-400 transition-all shadow-sm flex justify-center items-center"
                        title="Delete Blog"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!isLoading && displayedBlogs.length === 0 && blogs.filter(b => filterStatus === 'all' || b.status === filterStatus).length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 mt-6">
              <FileText className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Blogs Found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {filterStatus === 'published' ? "You haven't published any blogs yet." :
                  filterStatus === 'scheduled' ? "You don't have any blogs scheduled." :
                  filterStatus === 'draft' ? "You don't have any drafts." :
                  "You haven't created any blogs yet."}
              </p>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors mx-auto"
              >
                <Plus className="h-5 w-5" />
                Create New Blog
              </button>
            </div>
          )}
        </div>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Blog Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                What type of blog do you want to create?
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {BLOG_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      selectedCategory === cat 
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm" 
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="font-medium text-sm">{cat}</span>
                    {selectedCategory === cat && <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3">
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateNewBlog}
                disabled={!selectedCategory}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

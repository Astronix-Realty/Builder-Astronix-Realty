 "use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Edit2, Trash2, FileText, Search, X,
  Clock, Eye, Calendar, LayoutTemplate, Menu
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
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Debounced search ────────────────────────────────────
  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQuery(val), 300);
  }, []);

  // ── Fetch blogs ─────────────────────────────────────────
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

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Permanently delete this blog?")) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Blog deleted");
        setBlogs(prev => prev.filter(b => b._id !== id));
      } else {
        toast.error("Failed to delete blog");
      }
    } catch {
      toast.error("Network error");
    }
  }, []);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('blogRecentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      setRecentSearches(prev => {
        const next = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())].slice(0, 5);
        localStorage.setItem('blogRecentSearches', JSON.stringify(next));
        return next;
      });
    }
  }, [searchQuery]);

  // ── Edit blog ───────────────────────────────────────────
  if (editingBlogId) {
    const blogToEdit = editingBlogId === "new" ? undefined : blogs.find(b => b._id === editingBlogId);
    return (
      <BlogEditor
        blogId={editingBlogId === "new" ? undefined : editingBlogId}
        initialData={blogToEdit}
        onBack={() => setEditingBlogId(null)}
      />
    );
  }

  const displayedBlogs = blogs.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (b.title || "").toLowerCase();
      const excerpt = (b.excerpt || "").toLowerCase();
      const category = (b.category || "").toLowerCase();
      if (!title.includes(q) && !excerpt.includes(q) && !category.includes(q)) return false;
    }
    return true;
  });

  const FILTERS: { key: FilterStatus; label: string; color: string; count: number }[] = [
    { key: "all",       label: "All",       color: "bg-slate-900 text-white dark:bg-white dark:text-slate-950", count: blogs.length },
    { key: "published", label: "Published", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400", count: blogs.filter(b => b.status === 'published').length },
    { key: "draft",     label: "Drafts",    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400", count: blogs.filter(b => b.status === 'draft').length },
    { key: "scheduled", label: "Scheduled", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400", count: blogs.filter(b => b.status === 'scheduled').length },
  ];

  return (
    <div className="animate-in fade-in flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">

      {/* ── Sticky Premium Glassmorphic Header ────────────────── */}
      <header className="sticky top-0 z-20 w-full backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Blog CMS & News
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {blogs.length} article{blogs.length !== 1 ? "s" : ""} · Notion/Medium-style modular editor
              </p>
            </div>
          </div>
        </div>

        {/* Desktop sticky action area */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mr-2">
            <div className="flex flex-col items-center"><span className="text-slate-900 dark:text-white text-lg leading-none">{blogs.length}</span><span className="uppercase tracking-wider opacity-60 text-[9px] mt-1">Total</span></div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center"><span className="text-emerald-600 dark:text-emerald-400 text-lg leading-none">{blogs.filter(b => b.status === 'published').length}</span><span className="uppercase tracking-wider opacity-60 text-[9px] mt-1">Live</span></div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center"><span className="text-amber-600 dark:text-amber-400 text-lg leading-none">{blogs.filter(b => b.status === 'draft').length}</span><span className="uppercase tracking-wider opacity-60 text-[9px] mt-1">Drafts</span></div>
          </div>
          <button
            onClick={() => setEditingBlogId("new")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg text-sm font-bold shadow-md shadow-blue-500/10 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in"
          >
            <Plus className="h-4 w-4" /> New Blog
          </button>
        </div>
      </header>

      {/* ── Scrollable Body Area ──────────────────────────────── */}
      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* ── Unified Responsive Toolbar ────────────────────────── */}
        <div className="relative z-30 bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          {/* Left: Search Bar */}
          <div className="relative flex-1 max-w-md w-full" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowRecent(false); }}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onFocus={() => setShowRecent(true)}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search blogs by title or excerpt..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
            />
            {searchInput && (
              <button
                onClick={() => { handleSearchChange(""); setShowRecent(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {/* Recent Searches Dropdown */}
            {showRecent && recentSearches.length > 0 && !searchInput && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">Recent Searches</div>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleSearchChange(s);
                      setShowRecent(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Filters pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {FILTERS.map(f => {
              const isActive = filterStatus === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white border-transparent dark:bg-blue-500 dark:text-white shadow-sm shadow-blue-500/10"
                      : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] leading-none ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Blog Grid ─────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedBlogs.map(blog => {
              const heroBlock = blog.blocks?.find((b: any) => b.type === "hero");
              const displayImage = heroBlock?.data?.heroImageUrl || blog.coverImage?.url || heroBlock?.data?.imageUrl;
              const displayExcerpt = blog.excerpt || heroBlock?.data?.subtitle || "";
              const wordCount = blog.blocks?.reduce((n: number, b: any) =>
                b.type === "text" ? n + (b.data?.content || "").split(/\s+/).filter(Boolean).length : n, 0) ?? 0;
              const readTime = Math.max(1, Math.ceil(wordCount / 200));
              const lastEdited = blog.updatedAt ? formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true }) : "";

              const statusConfig: Record<string, { cls: string; label: string }> = {
                published: { cls: "bg-emerald-500/90 text-white", label: "Published" },
                scheduled: { cls: "bg-purple-500/90 text-white", label: "Scheduled" },
                draft:     { cls: "bg-slate-700/90 text-slate-200", label: "Draft" },
                archived:  { cls: "bg-slate-400/90 text-white", label: "Archived" },
              };
              const statusCfg = statusConfig[blog.status] || statusConfig.draft;

              return (
                <div
                  key={blog._id}
                  onClick={() => setEditingBlogId(blog._id)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 overflow-hidden flex-shrink-0">
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                        <FileText className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 shadow-sm backdrop-blur-md">
                        {blog.category || "General"}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm backdrop-blur-md ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {blog.title || "Untitled Blog"}
                    </h3>
                    {displayExcerpt && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-1 leading-relaxed">
                        {displayExcerpt}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {readTime} min read</span>
                      {lastEdited && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {lastEdited}</span>}
                      {blog.views > 0 && <span className="flex items-center gap-1 ml-auto"><Eye className="w-3 h-3" /> {blog.views}</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingBlogId(blog._id); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700/50 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(blog._id, e)}
                        className="px-3 flex items-center justify-center py-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-slate-200 dark:border-slate-700/50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {blogs.length === 0 && (
              <div className="col-span-full py-24 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                  <LayoutTemplate className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {searchQuery ? `No results for "${searchQuery}"` : "No articles yet"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 text-sm">
                  {searchQuery ? "Try a different keyword or clear the search." : "Start writing your first modular blog post."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setEditingBlogId("new")}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Plus className="h-5 w-5" /> Start Writing
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile Floating Action Button (FAB) ──────────────── */}
      <div className="fixed bottom-6 right-6 md:hidden z-30">
        <button
          onClick={() => setEditingBlogId("new")}
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="New Blog"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

    </div>
  );
}

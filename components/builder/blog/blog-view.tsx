"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Calendar, FileText, CheckCircle2, User, LayoutTemplate } from "lucide-react";
import { BlogEditor } from "./blog-editor";
import { toast } from "sonner";

export function BlogView() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        if (!editingBlogId) {
            fetchBlogs();
        }
    }, [editingBlogId, filterStatus]);

    const fetchBlogs = async () => {
        setIsLoading(true);
        try {
            const url = new URL("/api/blogs", window.location.origin);
            if (filterStatus !== "all") url.searchParams.set("status", filterStatus);
            
            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                setBlogs(data.blogs || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch blogs");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog?")) return;
        
        try {
            const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Blog deleted");
                setBlogs(blogs.filter(b => b._id !== id));
            } else {
                toast.error("Failed to delete blog");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleCreateNewBlog = async () => {
        setIsCreating(true);
        try {
            const res = await fetch("/api/blogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Untitled Blog" })
            });

            if (res.ok) {
                const data = await res.json();
                setBlogs(prev => [data.blog, ...prev]);
                setEditingBlogId(data.blog._id);
            } else {
                toast.error("Failed to create a new draft.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while creating.");
        } finally {
            setIsCreating(false);
        }
    };

    if (editingBlogId) {
        const blogToEdit = blogs.find(b => b._id === editingBlogId);
        return <BlogEditor blogId={editingBlogId} initialData={blogToEdit} onBack={() => setEditingBlogId(null)} />;
    }

    return (
        <div className="animate-in fade-in">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <FileText className="h-8 w-8 text-blue-600" />
                        Enterprise Blog CMS
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">Manage your modular real estate articles, templates, and AI-driven content.</p>
                </div>

                <div className="flex gap-3">
                    {/* Status Filters */}
                    <select 
                       value={filterStatus} 
                       onChange={e => setFilterStatus(e.target.value)}
                       className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-medium shadow-sm focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                        <option value="scheduled">Scheduled</option>
                    </select>

                    <button
                        onClick={handleCreateNewBlog}
                        disabled={isCreating}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium shadow-sm transition-colors"
                    >
                        {isCreating ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Plus className="h-5 w-5" />
                        )}
                        New Blog
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map(blog => {
                        // Extract Display Data
                        const heroBlock = blog.blocks?.find((b: any) => b.type === 'hero');
                        const displayImage = heroBlock?.data?.heroImageUrl || heroBlock?.data?.imageUrl || blog.coverImage?.url;
                        const displayExcerpt = blog.excerpt || heroBlock?.data?.subtitle || "No excerpt provided.";
                        
                        // Calculate Read Time
                        let wordCount = 0;
                        blog.blocks?.forEach((b: any) => {
                            if (b.type === 'text' && b.data?.content) {
                                wordCount += b.data.content.split(/\s+/).filter(Boolean).length;
                            }
                        });
                        const readTime = Math.max(1, Math.ceil(wordCount / 200));

                        return (
                        <div key={blog._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col hover:-translate-y-1 cursor-pointer" onClick={() => setEditingBlogId(blog._id)}>
                            <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 overflow-hidden flex-shrink-0">
                                {displayImage ? (
                                    <Image src={displayImage} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                                    </div>
                                )}
                                
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50">
                                        {blog.category || "General"}
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm backdrop-blur-md ${
                                        blog.status === "published" ? "bg-emerald-500/90 text-white" : 
                                        blog.status === "scheduled" ? "bg-purple-500/90 text-white" : "bg-slate-800/90 text-slate-200"
                                    }`}>
                                        {blog.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={blog.title}>
                                    {blog.title || "Untitled Document"}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1 leading-relaxed">
                                    {displayExcerpt}
                                </p>

                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/60 font-medium">
                                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {blog.authorName || 'Builder Admin'}</span>
                                    <span className="flex items-center gap-1.5">{readTime} min read</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingBlogId(blog._id); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700/50"
                                    >
                                        <Edit2 className="h-4 w-4" /> Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(blog._id); }}
                                        className="px-3 flex items-center justify-center py-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-slate-200 dark:border-slate-700/50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}

                    {blogs.length === 0 && (
                        <div className="col-span-full py-24 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                                <LayoutTemplate className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Content Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">Ready to write? Create a new modular blog post with the AI-assisted editor.</p>
                            <button
                                onClick={handleCreateNewBlog}
                                disabled={isCreating}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                            >
                                {isCreating ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Plus className="h-5 w-5" />
                                )}
                                Start Writing
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

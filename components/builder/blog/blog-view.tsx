"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Edit2, Trash2, Calendar, FileText, Image as ImageIcon, CheckCircle, List, Settings, User, XCircle } from "lucide-react"

interface BlogPost {
    id: string
    title: string
    excerpt: string
    content: string
    coverImage?: string

    category?: string
    readTime?: string
    authorName?: string
    authorRole?: string

    keyTakeaways?: string[]
    prosList?: string[]
    consList?: string[]

    faqs?: { question: string, answer: string }[]
    hasRera?: boolean
    reraLink?: string

    status: "draft" | "published"
    createdAt: string
    updatedAt: string
}

export function BlogView() {
    const [blogs, setBlogs] = useState<BlogPost[]>([])
    const [showAddBlog, setShowAddBlog] = useState(false)
    const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null)
    const [activeFormTab, setActiveFormTab] = useState<"general" | "content" | "analysis" | "extras">("general")

    const [newBlog, setNewBlog] = useState<Partial<BlogPost>>({
        title: "",
        excerpt: "",
        content: "",
        coverImage: "",
        category: "PROJECT REVIEWS",
        readTime: "5 MIN READ",
        authorName: "Astronix Audit Team",
        authorRole: "Real Estate Analyst",
        keyTakeaways: [],
        prosList: [],
        consList: [],
        faqs: [],
        hasRera: true,
        reraLink: "",
        status: "draft"
    })

    useEffect(() => {
        const savedBlogs = localStorage.getItem("builderBlogs")
        if (savedBlogs) {
            try {
                setBlogs(JSON.parse(savedBlogs))
            } catch (e) {
                console.error("Failed to parse blogs", e)
            }
        }
    }, [])

    const handleSaveBlog = () => {
        if (!newBlog.title || !newBlog.content) {
            alert("Title and content are required!")
            return
        }

        let updatedBlogs: BlogPost[]
        const now = new Date().toISOString()

        if (editingBlog) {
            updatedBlogs = blogs.map(b =>
                b.id === editingBlog.id ? {
                    ...editingBlog,
                    ...newBlog,
                    updatedAt: now
                } as BlogPost : b
            )
        } else {
            const newPost: BlogPost = {
                id: `blog-${Date.now()}`,
                title: newBlog.title || "",
                excerpt: newBlog.excerpt || "",
                content: newBlog.content || "",
                coverImage: newBlog.coverImage || "",
                category: newBlog.category || "",
                readTime: newBlog.readTime || "",
                authorName: newBlog.authorName || "",
                authorRole: newBlog.authorRole || "",
                keyTakeaways: newBlog.keyTakeaways || [],
                prosList: newBlog.prosList || [],
                consList: newBlog.consList || [],
                faqs: newBlog.faqs || [],
                hasRera: newBlog.hasRera ?? false,
                reraLink: newBlog.reraLink || "",
                status: newBlog.status as "draft" | "published",
                createdAt: now,
                updatedAt: now
            }
            updatedBlogs = [...blogs, newPost]
        }

        setBlogs(updatedBlogs)
        localStorage.setItem("builderBlogs", JSON.stringify(updatedBlogs))
        setShowAddBlog(false)
        setEditingBlog(null)
        // Reset state
        setNewBlog({
            title: "",
            excerpt: "",
            content: "",
            coverImage: "",
            category: "PROJECT REVIEWS",
            readTime: "5 MIN READ",
            authorName: "Astronix Audit Team",
            authorRole: "Real Estate Analyst",
            keyTakeaways: [],
            prosList: [],
            consList: [],
            faqs: [],
            hasRera: true,
            reraLink: "",
            status: "draft"
        })
        setActiveFormTab("general")
    }

    const handleEditBlog = (blog: BlogPost) => {
        setEditingBlog(blog)
        setNewBlog(blog)
        setShowAddBlog(true)
        setActiveFormTab("general")
    }

    const handleDeleteBlog = (id: string) => {
        if (confirm("Are you sure you want to delete this blog post?")) {
            const updatedBlogs = blogs.filter(b => b.id !== id)
            setBlogs(updatedBlogs)
            localStorage.setItem("builderBlogs", JSON.stringify(updatedBlogs))
        }
    }

    // Helpers for multiline array inputs
    const handleArrayChange = (field: 'keyTakeaways' | 'prosList' | 'consList', value: string) => {
        setNewBlog({ ...newBlog, [field]: value.split('\n') })
    }

    const getArrayString = (field: 'keyTakeaways' | 'prosList' | 'consList') => {
        return (newBlog[field] || []).join('\n')
    }

    // Helpers for FAQ
    const addFaq = () => {
        setNewBlog({ ...newBlog, faqs: [...(newBlog.faqs || []), { question: "", answer: "" }] })
    }
    const updateFaq = (index: number, key: 'question' | 'answer', value: string) => {
        const newFaqs = [...(newBlog.faqs || [])]
        newFaqs[index][key] = value
        setNewBlog({ ...newBlog, faqs: newFaqs })
    }
    const removeFaq = (index: number) => {
        const newFaqs = [...(newBlog.faqs || [])]
        newFaqs.splice(index, 1)
        setNewBlog({ ...newBlog, faqs: newFaqs })
    }

    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <FileText className="h-8 w-8 text-blue-600" />
                        Blog Management
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">Manage your real estate articles and news</p>
                </div>

                {!showAddBlog && (
                    <button
                        onClick={() => {
                            setShowAddBlog(true);
                            setNewBlog({
                                title: "", excerpt: "", content: "", coverImage: "",
                                category: "PROJECT REVIEWS", readTime: "5 MIN READ",
                                authorName: "Astronix Audit Team", authorRole: "Real Estate Analyst",
                                keyTakeaways: [], prosList: [], consList: [], faqs: [], hasRera: true, reraLink: "", status: "draft"
                            })
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Blog
                    </button>
                )}
            </div>

            {showAddBlog ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Edit2 className="h-5 w-5 text-blue-600" />
                            {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                        </h3>

                        {/* Tab Navigation */}
                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveFormTab("general")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFormTab === "general" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setActiveFormTab("content")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFormTab === "content" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
                            >
                                Content
                            </button>
                            <button
                                onClick={() => setActiveFormTab("analysis")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFormTab === "analysis" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
                            >
                                Analysis & Lists
                            </button>
                            <button
                                onClick={() => setActiveFormTab("extras")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFormTab === "extras" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
                            >
                                Extras
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col lg:flex-row gap-6">
                        {/* Form Area - Responsive Width */}
                        <div className="flex-1 space-y-6">

                            {/* GENERAL TAB */}
                            {activeFormTab === "general" && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Title <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newBlog.title}
                                                    onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="First Look: Godrej Solitaire, Kalyan..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                                    <input
                                                        type="text"
                                                        value={newBlog.category}
                                                        onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="PROJECT REVIEWS"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Read Time</label>
                                                    <input
                                                        type="text"
                                                        value={newBlog.readTime}
                                                        onChange={(e) => setNewBlog({ ...newBlog, readTime: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="6 MIN READ"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Short Excerpt</label>
                                                <textarea
                                                    value={newBlog.excerpt}
                                                    onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Brief summary of the article..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 h-full">
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
                                                    Hero Cover Image
                                                </label>
                                                {newBlog.coverImage ? (
                                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-3">
                                                        <Image src={newBlog.coverImage} alt="Cover" fill className="object-cover" unoptimized />
                                                        <button
                                                            onClick={() => setNewBlog({ ...newBlog, coverImage: "" })}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 opacity-80 hover:opacity-100 shadow-sm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400 mb-3">
                                                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                                        <span className="text-xs font-medium">No cover image</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="text"
                                                    value={newBlog.coverImage}
                                                    onChange={(e) => setNewBlog({ ...newBlog, coverImage: e.target.value })}
                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Image URL (e.g. https://...)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CONTENT TAB */}
                            {activeFormTab === "content" && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Author Name</label>
                                            <input
                                                type="text"
                                                value={newBlog.authorName}
                                                onChange={(e) => setNewBlog({ ...newBlog, authorName: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Astronix Audit Team"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Author Role</label>
                                            <input
                                                type="text"
                                                value={newBlog.authorRole}
                                                onChange={(e) => setNewBlog({ ...newBlog, authorRole: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Real Estate Analyst"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Deep Dive Content <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={newBlog.content}
                                            onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                                            rows={15}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                                            placeholder="Write your main article content here. Use paragraphs, headers, etc."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ANALYSIS & LISTS TAB */}
                            {activeFormTab === "analysis" && (
                                <div className="space-y-6 animate-in fade-in">
                                    <p className="text-sm text-slate-500 mb-4">Add your list items below. Put each point on a <strong>new line</strong>.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 rounded-xl">
                                            <label className="block text-sm font-bold text-amber-800 dark:text-amber-500 mb-2 flex items-center gap-2">
                                                <span>⭐</span> Key Takeaways
                                            </label>
                                            <textarea
                                                value={getArrayString('keyTakeaways')}
                                                onChange={(e) => handleArrayChange('keyTakeaways', e.target.value)}
                                                rows={8}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                                placeholder="Core benefits analyzed for ROI...&#10;Infrastructure impact..."
                                            />
                                        </div>

                                        <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30 rounded-xl">
                                            <label className="block text-sm font-bold text-green-800 dark:text-green-500 mb-2 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> Why Buy? (Pros)
                                            </label>
                                            <textarea
                                                value={getArrayString('prosList')}
                                                onChange={(e) => handleArrayChange('prosList', e.target.value)}
                                                rows={8}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                                placeholder="Direct Highway Access&#10;Trust of Godrej Brand..."
                                            />
                                        </div>

                                        <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 rounded-xl">
                                            <label className="block text-sm font-bold text-red-800 dark:text-red-500 mb-2 flex items-center gap-2">
                                                <XCircle className="w-4 h-4" /> Watch Out (Cons)
                                            </label>
                                            <textarea
                                                value={getArrayString('consList')}
                                                onChange={(e) => handleArrayChange('consList', e.target.value)}
                                                rows={8}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                                placeholder="Higher Ticket Size...&#10;Possession is 4 Years Away..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* EXTRAS TAB */}
                            {activeFormTab === "extras" && (
                                <div className="space-y-8 animate-in fade-in">
                                    {/* RERA Banner */}
                                    <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                                Verify Before You Buy (RERA Block)
                                            </h4>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={newBlog.hasRera}
                                                    onChange={(e) => setNewBlog({ ...newBlog, hasRera: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>
                                        {newBlog.hasRera && (
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">RERA Project Link</label>
                                                <input
                                                    type="url"
                                                    value={newBlog.reraLink}
                                                    onChange={(e) => setNewBlog({ ...newBlog, reraLink: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    placeholder="https://maharera.mahaonline.gov.in..."
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* FAQs */}
                                    <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-slate-800 dark:text-white">Frequently Asked Questions (FAQs)</h4>
                                            <button
                                                onClick={addFaq}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-1"
                                            >
                                                <Plus className="w-4 h-4" /> Add FAQ
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {(newBlog.faqs || []).map((faq, index) => (
                                                <div key={index} className="flex gap-3 items-start bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                                                    <div className="flex-1 space-y-3">
                                                        <input
                                                            type="text"
                                                            value={faq.question}
                                                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-sm focus:outline-none focus:border-blue-500"
                                                            placeholder={`Question ${index + 1}`}
                                                        />
                                                        <textarea
                                                            value={faq.answer}
                                                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                                                            rows={2}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:border-blue-500"
                                                            placeholder="Answer"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeFaq(index)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-50 group-hover:opacity-100 transition-opacity"
                                                        title="Remove FAQ"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(newBlog.faqs || []).length === 0 && (
                                                <p className="text-sm text-slate-500 text-center py-4 italic">No FAQs added yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Sidebar - Fixed width on Desktop */}
                        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 sticky top-6">
                                <h4 className="font-semibold text-slate-800 dark:text-white mb-4">Publishing Status</h4>
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewBlog({ ...newBlog, status: "draft" })}
                                        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border font-medium text-sm transition-colors ${newBlog.status === "draft"
                                            ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-transparent dark:border-slate-700 dark:text-slate-400"
                                            }`}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Save as Draft
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewBlog({ ...newBlog, status: "published" })}
                                        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border font-medium text-sm transition-colors ${newBlog.status === "published"
                                            ? "bg-green-600 text-white border-green-600 dark:bg-green-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-transparent dark:border-slate-700 dark:text-slate-400"
                                            }`}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Publish Live
                                    </button>

                                    <hr className="my-2 border-slate-200 dark:border-slate-700" />

                                    <button
                                        onClick={handleSaveBlog}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex justify-center items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        {editingBlog ? "Update Post" : "Save All Details"}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowAddBlog(false)
                                            setEditingBlog(null)
                                        }}
                                        className="w-full py-2 bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors text-sm"
                                    >
                                        Cancel & Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map(blog => (
                        <div key={blog.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
                            <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 overflow-hidden flex-shrink-0">
                                {blog.coverImage ? (
                                    <Image src={blog.coverImage} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500 text-white shadow-sm backdrop-blur-md">
                                        {blog.category || "BLOG"}
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm backdrop-blur-md ${blog.status === "published"
                                        ? "bg-green-500 text-white"
                                        : "bg-slate-800 text-white"
                                        }`}>
                                        {blog.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight" title={blog.title}>
                                    {blog.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                                    {blog.excerpt || blog.content.substring(0, 100).replace(/<[^>]*>?/gm, '') + "..."}
                                </p>

                                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <span className="flex items-center gap-1.5 font-medium"><User className="h-3.5 w-3.5" /> {blog.authorName || 'No Author'}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditBlog(blog)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700"
                                    >
                                        <Edit2 className="h-4 w-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBlog(blog.id)}
                                        className="px-3 flex items-center justify-center py-2.5 bg-white dark:bg-slate-900 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-slate-200 dark:border-slate-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {blogs.length === 0 && (
                        <div className="col-span-full py-24 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                                <FileText className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Blog Posts Yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">Ready to share your real estate insights? Create a comprehensive article with pros, cons, and RERA details.</p>
                            <button
                                onClick={() => {
                                    setShowAddBlog(true);
                                    setNewBlog({
                                        title: "", excerpt: "", content: "", coverImage: "",
                                        category: "PROJECT REVIEWS", readTime: "5 MIN READ",
                                        authorName: "Astronix Audit Team", authorRole: "Real Estate Analyst",
                                        keyTakeaways: [], prosList: [], consList: [], faqs: [], hasRera: true, reraLink: "", status: "draft"
                                    })
                                }}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="h-5 w-5" />
                                Create Your First Post
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

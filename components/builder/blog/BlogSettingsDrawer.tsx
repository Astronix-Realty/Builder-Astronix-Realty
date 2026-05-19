"use client";

import React, { useState, useEffect } from 'react';
import { X, Settings, Loader2, Building, Search } from 'lucide-react';
import { useBlogEditorStore } from '@/lib/store/blog-editor-store';
import { motion, AnimatePresence } from 'framer-motion';

export function BlogSettingsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const blog = useBlogEditorStore(s => s.blog);
  const updateField = useBlogEditorStore(s => s.updateField);

  const [properties, setProperties] = useState<any[]>([]);
  const [isLoadingProps, setIsLoadingProps] = useState(false);
  const [searchProp, setSearchProp] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
    }
  }, [isOpen]);

  const fetchProperties = async () => {
    setIsLoadingProps(true);
    try {
      const res = await fetch('/api/properties?status=published');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProps(false);
    }
  };

  const handleLinkProperty = (id: string) => {
    const current = blog.linkedProperties || [];
    if (current.includes(id)) {
      updateField('linkedProperties', current.filter((p: string) => p !== id));
    } else {
      updateField('linkedProperties', [...current, id]);
    }
  };

  const filteredProps = properties.filter(p => p.name.toLowerCase().includes(searchProp.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[101] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Blog Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Section 1: Article Details */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">Article Metadata</h3>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={blog.category || 'General'}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Project Review">Project Review</option>
                    <option value="Market Analysis">Market Analysis</option>
                    <option value="Local Spotlight">Local Spotlight</option>
                    <option value="Guides">Guides</option>
                    <option value="Trends">Trends</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Read Time</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={blog.readTime || '5 min read'}
                      onChange={(e) => updateField('readTime', e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 5 min read"
                    />
                    <button
                      onClick={() => {
                        const wordCount = blog.blocks?.reduce((acc: number, b: any) => {
                          if (b.type === 'text') return acc + (b.data?.content || '').split(/\s+/).length;
                          return acc + 10; // offset for images/etc
                        }, 0) || 0;
                        const mins = Math.max(1, Math.ceil(wordCount / 200));
                        updateField('readTime', `${mins} min read`);
                      }}
                      className="px-3 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </section>

              {/* Section 2: Author Profile */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">Author Profile</h3>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Author Name</label>
                  <input
                    type="text"
                    value={blog.authorName || ''}
                    onChange={(e) => updateField('authorName', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Astronix Audit Team"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Author Role</label>
                  <input
                    type="text"
                    value={blog.authorRole || ''}
                    onChange={(e) => updateField('authorRole', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Real Estate Analyst"
                  />
                </div>
              </section>

              {/* Section 3: Linked Properties */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">Featured Projects</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select properties to automatically generate the "Featured Projects" section in the blog layout.
                </p>
                
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchProp}
                    onChange={e => setSearchProp(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 flex flex-col h-64">
                  {isLoadingProps ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <span className="text-xs">Loading projects...</span>
                    </div>
                  ) : filteredProps.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Building className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">No projects found.</span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {filteredProps.map(p => {
                        const isLinked = (blog.linkedProperties || []).includes(p._id);
                        return (
                          <label key={p._id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border ${isLinked ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50' : 'bg-white border-transparent hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750'}`}>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isLinked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                              {isLinked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            {p.thumbnail ? (
                              <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <Building className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${isLinked ? 'text-blue-900 dark:text-blue-100' : 'text-slate-800 dark:text-slate-200'}`}>{p.name}</p>
                              <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{p.type} • {p.location?.city || 'N/A'}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

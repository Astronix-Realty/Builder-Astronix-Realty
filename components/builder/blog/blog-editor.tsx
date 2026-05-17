"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import {
  ArrowLeft, Save, Play, CheckCircle2, AlertCircle, LayoutTemplate,
  HelpCircle, Image as ImageIcon, Scale, MousePointerClick, AlignLeft,
  Monitor, Smartphone, Trash2, Undo2, Redo2, Wifi, WifiOff, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { BlockRegistry, BlockType } from './blocks';
import { SeoScoreWidget } from './SeoScoreWidget';
import { calculateBlogHealthScore } from '@/lib/utils/health-score';
import { migrateBlogData } from '@/lib/utils/blog-migration';
import { useBlogEditorStore } from '@/lib/store/blog-editor-store';
import { BlockRenderer } from './renderers/BlockRenderer';

// ─── Memoized per-block card — never remounts on sibling updates ───────────
const BlockCard = React.memo(({ block, index, onUpdate, onRemove }: {
  block: any;
  index: number;
  onUpdate: (index: number, data: any) => void;
  onRemove: (index: number) => void;
}) => {
  const def = BlockRegistry[block.type as BlockType];
  const BlockComponent = def?.component;
  const globalTitle = useBlogEditorStore(s => s.blog.title);
  const updateField = useBlogEditorStore(s => s.updateField);
  if (!BlockComponent) return null;

  return (
    <div className="relative group">
      <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md flex overflow-hidden z-10">
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete Block"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{def?.label}</span>
        </div>
        <BlockComponent
          key={block.id}
          id={block.id}
          data={block.data}
          onChange={(newData: any) => onUpdate(index, newData)}
          isEditing
          globalTitle={globalTitle}
          onGlobalTitleChange={(title: string) => updateField('title', title)}
        />
      </div>
    </div>
  );
}, (prev, next) =>
  prev.block.id === next.block.id &&
  prev.block.data === next.block.data &&
  prev.index === next.index
);
BlockCard.displayName = 'BlockCard';

// ─── Memoized Preview Pane ─────────────────────────────────────────────────
const PreviewPane = React.memo(({ previewMode }: { previewMode: 'desktop' | 'mobile' }) => {
  const blocks = useBlogEditorStore(s => s.blog.blocks);
  const title = useBlogEditorStore(s => s.blog.title);

  return (
    <div 
      className={`bg-white dark:bg-slate-900 transition-all duration-300 overflow-hidden ${
        previewMode === 'mobile' 
          ? 'max-w-[390px] w-full rounded-[2.8rem] border-[12px] border-blue-950 dark:border-blue-900 shadow-[0_25px_60px_-15px_rgba(26,60,140,0.3)] h-[780px] flex flex-col relative bg-white dark:bg-slate-950' 
          : 'w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] bg-white dark:bg-slate-900 min-h-[780px]'
      }`}
    >
      {/* Phone Notch/Status Bar for realistic mobile simulator */}
      {previewMode === 'mobile' && (
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 py-2.5 px-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-900 text-[11px] font-bold text-slate-400 dark:text-slate-500 select-none shrink-0">
          <span>9:41</span>
          <div className="w-16 h-4 bg-slate-900 dark:bg-slate-950 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-1.5" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>5G</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className={`flex-1 ${
          previewMode === 'mobile' 
            ? 'overflow-y-auto overflow-x-hidden hide-scrollbar px-4 sm:px-5 py-6 bg-white dark:bg-slate-950' 
            : 'p-6 md:p-10 overflow-y-auto overflow-x-hidden'
        }`}
      >
        {blocks.length > 0 ? (
          <>
            {/* Title Header — displayed if there is no Hero block */}
            {!blocks.find((b: any) => b.type === 'hero') && (
              <div className="mb-8 border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                  {title || <span className="text-slate-300 dark:text-slate-700 font-normal">Your blog title appears here</span>}
                </h1>
              </div>
            )}
            
            <BlockRenderer blocks={blocks} title={title} />
          </>
        ) : (
          <div className="animate-pulse space-y-6 p-4 text-center mt-12">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
              <LayoutTemplate className="w-10 h-10" />
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4 mx-auto" />
              <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded-lg w-full" />
              <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded-lg w-5/6 mx-auto" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold pt-4">Add your first content block on the left to start building</p>
          </div>
        )}
      </div>
    </div>
  );
});
PreviewPane.displayName = 'PreviewPane';

const PreviewFallback = () => (
  <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4" />
    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-2" />
    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
  </div>
);

// ─── Main Editor ───────────────────────────────────────────────────────────
export function BlogEditor({ blogId, initialData, onBack }: {
  blogId?: string;
  initialData?: any;
  onBack: () => void;
}) {
  const store = useBlogEditorStore();
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const draftChecked = useRef(false);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);

  // ── Derived state from store ─────────────────────────────
  const blog      = useBlogEditorStore(s => s.blog);
  const blocks    = useBlogEditorStore(s => s.blog.blocks);
  const title     = useBlogEditorStore(s => s.blog.title);
  const isDirty   = useBlogEditorStore(s => s.isDirty);
  const isSaving  = useBlogEditorStore(s => s.isSaving);
  const isLoading = useBlogEditorStore(s => s.isLoading);
  const past      = useBlogEditorStore(s => s.past);
  const future    = useBlogEditorStore(s => s.future);
  const previewMode     = useBlogEditorStore(s => s.previewMode);
  const publishErrors   = useBlogEditorStore(s => s.publishErrors);
  const saveError       = useBlogEditorStore(s => s.saveError);
  const lastSavedAt     = useBlogEditorStore(s => s.lastSavedAt);
  const isOffline       = useBlogEditorStore(s => s.isOffline);
  const hasConflict     = useBlogEditorStore(s => s.hasConflict);

  const health = calculateBlogHealthScore(blog);

  // ── 1. Initialize store on mount ─────────────────────────
  useEffect(() => {
    if (blogId && blogId !== 'new' && initialData) {
      const migrated = migrateBlogData(initialData);
      store.loadBlog(blogId, migrated);
    } else if (blogId && blogId !== 'new' && !initialData) {
      // Fetch from server
      (async () => {
        useBlogEditorStore.setState({ isLoading: true });
        try {
          const res = await fetch(`/api/blogs/${blogId}`);
          if (res.ok) {
            const data = await res.json();
            store.loadBlog(blogId, migrateBlogData(data.blog));
          } else {
            toast.error('Could not load this blog.');
          }
        } catch {
          toast.error('Network error loading blog.');
        } finally {
          useBlogEditorStore.setState({ isLoading: false });
        }
      })();
    } else {
      store.initNew();
    }

    return () => {
      store.reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Draft recovery — runs exactly ONCE after load ────
  useEffect(() => {
    if (draftChecked.current) return;
    draftChecked.current = true;

    const info = store.getLocalDraftInfo();
    if (!info?.exists || !info.isNewer) {
      if (info?.exists) store.clearLocalDraft();
      return;
    }

    toast('📝 Unsaved draft found', {
      description: `From ${formatDistanceToNow(info.timestamp)} ago — recover it?`,
      action: {
        label: 'Recover',
        onClick: () => {
          store.recoverFromLocalDraft();
          toast.success('Draft recovered!');
        },
      },
      cancel: {
        label: 'Discard',
        onClick: () => store.clearLocalDraft(),
      },
      duration: 15_000,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // fires once isLoading settles

  // ── 3. Autosave (debounced 2s, runs only when dirty) ────
  useEffect(() => {
    if (!isDirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      store.autoSave();
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blog, isDirty]);

  // ── 4. Undo/Redo keyboard shortcuts & beforeunload ─────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); store.redo(); }
      if (ctrl && e.key === 's') { e.preventDefault(); handleSaveDraft(); }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { isDirty, blog, blogId } = useBlogEditorStore.getState();
      if (isDirty) {
        const key = `blog_draft_${blogId || 'new'}`;
        localStorage.setItem(key, JSON.stringify({ ...blog, localUpdatedAt: Date.now() }));
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 5. Online/offline detection ──────────────────────────
  useEffect(() => {
    const goOnline  = () => { store.setOffline(false); toast.success('Back online — queued saves syncing...'); };
    const goOffline = () => { store.setOffline(true);  toast.warning('You are offline. Edits are saved locally.'); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 6. Multi-tab conflict detection ─────────────────────
  useEffect(() => {
    const id = blogId && blogId !== 'new' ? blogId : null;
    if (!id || typeof window === 'undefined') return;
    const myTabId = Math.random().toString(36).slice(2);
    try {
      const bc = new BroadcastChannel(`blog_edit_${id}`);
      broadcastChannel.current = bc;
      bc.postMessage({ type: 'EDITOR_OPEN', tabId: myTabId });
      bc.onmessage = (e) => {
        if (e.data.type === 'EDITOR_OPEN' && e.data.tabId !== myTabId) {
          store.setConflict(true);
          toast.warning('⚠️ Another tab is editing this blog. Saves may conflict.', { duration: 0, id: 'conflict-warn' });
        }
      };
    } catch { /* BroadcastChannel not supported */ }
    return () => { broadcastChannel.current?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  // ── Action handlers ──────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    const result = await store.saveDraft();
    const { isOffline: offline, saveError: err } = useBlogEditorStore.getState();
    if (result) {
      toast.success('Draft saved!');
      onBack();
    } else if (offline) {
      toast.info('Offline — draft queued for sync when back online.');
      onBack();
    } else {
      toast.error(err || 'Save failed. Please try again.');
    }
  }, [onBack]);

  const handlePublish = useCallback(async () => {
    const success = await store.publish();
    if (success) {
      toast.success('🎉 Blog published successfully!');
      onBack();
    } else {
      const { publishErrors: errs, saveError: err } = useBlogEditorStore.getState();
      if (Object.keys(errs).length === 0) {
        toast.error(err || 'Publish failed. Please try again.');
      }
      // Inline errors are shown via publishErrors panel
    }
  }, [onBack]);

  const handleAddBlock = useCallback((type: BlockType) => {
    const def = BlockRegistry[type];
    if (def.singleton) {
      const exists = blocks.some((b: any) => b.type === type);
      if (exists) { toast.error(`Only one ${def.label} block is allowed.`); return; }
    }
    store.addBlock(type, def.defaultData);
  }, [blocks]);

  const handleUpdateBlock = useCallback((index: number, data: any) => {
    store.updateBlock(index, data);
  }, []);

  const handleRemoveBlock = useCallback((index: number) => {
    store.removeBlock(index);
  }, []);

  // ── Loading state ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading your article...</p>
        </div>
      </div>
    );
  }

  const BLOCK_ICONS: any = { LayoutTemplate, AlignLeft, HelpCircle, ImageIcon, Scale, MousePointerClick };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden animate-in fade-in zoom-in-95 duration-200">

      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex flex-col gap-0.5 min-w-0">
            <input
              type="text"
              value={title}
              onChange={e => store.updateField('title', e.target.value)}
              className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-300 w-72 lg:w-96 truncate"
              placeholder="Blog title..."
            />
            {publishErrors.title && (
              <span className="text-xs text-red-500 font-medium">{publishErrors.title}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Undo/Redo */}
          <div className="hidden md:flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => store.undo()}
              disabled={past.length === 0}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => store.redo()}
              disabled={future.length === 0}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Save status */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium">
            {isOffline ? (
              <span className="text-orange-500 flex items-center gap-1"><WifiOff className="w-3.5 h-3.5" /> Offline</span>
            ) : isSaving ? (
              <span className="text-slate-500 animate-pulse flex items-center gap-1"><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Saving...</span>
            ) : isDirty ? (
              <span className="text-amber-500 flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /> Unsaved</span>
            ) : (
              <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>
            )}
          </div>

          {/* Conflict warning */}
          {hasConflict && (
            <span className="hidden md:flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full font-semibold">
              <Lock className="w-3 h-3" /> Conflict
            </span>
          )}

          <SeoScoreWidget health={health} />

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>

          <button
            onClick={() => {
              const key = `blog_draft_${blogId || 'new'}`;
              localStorage.setItem(key, JSON.stringify(blog));
              window.open(`/preview/blog/${blogId || 'new'}`, '_blank');
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <LayoutTemplate className="w-4 h-4" /> Preview
          </button>

          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </header>

      {/* ── Publish Errors Panel ─────────────────────────── */}
      {Object.keys(publishErrors).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 items-center">
          <span className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Fix before publishing:
          </span>
          {Object.entries(publishErrors).map(([k, msg]) => (
            <span key={k} className="text-xs text-red-600 font-medium bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">{msg}</span>
          ))}
        </div>
      )}

      {/* ── Save Error Banner ────────────────────────────── */}
      {saveError && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 px-4 py-2 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm text-orange-700 dark:text-orange-300">{saveError} — edits queued for retry.</span>
        </div>
      )}

      {/* ── MAIN LAYOUT ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Editor Pane */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">

          {/* Block Adder Toolbar */}
          <div className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Add Content Block</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(BlockRegistry).map((def) => {
                const Icon = BLOCK_ICONS[def.icon] || AlignLeft;
                const isDisabled = def.singleton && blocks.some((b: any) => b.type === def.type);
                return (
                  <button
                    key={def.type}
                    onClick={() => handleAddBlock(def.type)}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 border rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isDisabled
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {def.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Block List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
              {blocks.map((block: any, index: number) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  index={index}
                  onUpdate={handleUpdateBlock}
                  onRemove={handleRemoveBlock}
                />
              ))}
              {blocks.length === 0 && (
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

        {/* RIGHT: Preview Pane */}
        <div className="w-1/2 flex flex-col bg-slate-100/50 dark:bg-slate-950">
          {/* Mode toggle */}
          <div className="shrink-0 flex items-center justify-center py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <button onClick={() => store.setPreviewMode('desktop')} className={`p-1.5 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Monitor className="w-4 h-4" /></button>
              <button onClick={() => store.setPreviewMode('mobile')} className={`p-1.5 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Smartphone className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <Suspense fallback={<PreviewFallback />}>
              <PreviewPane previewMode={previewMode} />
            </Suspense>
          </div>
        </div>

      </div>
    </div>
  );
}

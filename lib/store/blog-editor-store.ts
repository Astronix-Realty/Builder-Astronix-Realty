"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { BlockType } from '@/components/builder/blog/blocks';

// ─── Types ─────────────────────────────────────────────────────────────────
export interface BlogBlock {
  id: string;
  type: BlockType;
  data: any;
}

export interface BlogData {
  _id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  blocks: BlogBlock[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  coverImage?: { url?: string; publicId?: string };
  category?: string;
  authorName?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

const EMPTY_BLOG: BlogData = {
  title: '',
  status: 'draft',
  blocks: [],
  seo: {},
  coverImage: {},
};

const DRAFT_KEY_PREFIX = 'blog_draft_';
const MAX_DRAFTS = 10;
const HISTORY_MAX = 50;
const BLOG_SAVE_QUEUE_KEY = 'blog_save_queue';

// ─── Draft helpers ──────────────────────────────────────────────────────────
function getDraftKey(blogId: string | null) {
  return `${DRAFT_KEY_PREFIX}${blogId || 'new'}`;
}

function enforceMaxDrafts() {
  if (typeof window === 'undefined') return;
  const draftKeys: { key: string; ts: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(DRAFT_KEY_PREFIX)) {
      try {
        const parsed = JSON.parse(localStorage.getItem(k)!);
        draftKeys.push({ key: k, ts: parsed.localUpdatedAt || 0 });
      } catch {
        localStorage.removeItem(k);
      }
    }
  }
  if (draftKeys.length > MAX_DRAFTS) {
    draftKeys.sort((a, b) => a.ts - b.ts);
    draftKeys.slice(0, draftKeys.length - MAX_DRAFTS).forEach(({ key }) =>
      localStorage.removeItem(key)
    );
  }
}

// ─── Blog save queue (offline support) ────────────────────────────────────
interface QueuedSave {
  id: string;
  blogId: string | null;
  payload: any;
  method: 'POST' | 'PUT';
  url: string;
  timestamp: number;
  retries: number;
}

function getBlogSaveQueue(): QueuedSave[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(BLOG_SAVE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setBlogSaveQueue(queue: QueuedSave[]) {
  localStorage.setItem(BLOG_SAVE_QUEUE_KEY, JSON.stringify(queue));
}

async function flushBlogSaveQueue() {
  const queue = getBlogSaveQueue();
  if (!queue.length) return;

  const remaining: QueuedSave[] = [];
  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch {
      if (item.retries < 3) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    }
  }
  setBlogSaveQueue(remaining);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushBlogSaveQueue);
}

// ─── Store interface ────────────────────────────────────────────────────────
interface BlogEditorStore {
  // ── Data ──────────────────────────────────────────────────
  blogId: string | null;
  blog: BlogData;
  savedBlog: BlogData | null;
  isDirty: boolean;

  // ── History ───────────────────────────────────────────────
  past: BlogBlock[][];
  future: BlogBlock[][];

  // ── Status ────────────────────────────────────────────────
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSavedAt: Date | null;
  isOffline: boolean;
  hasConflict: boolean;
  publishErrors: Record<string, string>;

  // ── UI ────────────────────────────────────────────────────
  previewMode: 'desktop' | 'mobile';

  // ── Init ──────────────────────────────────────────────────
  initNew: () => void;
  loadBlog: (id: string, data: BlogData) => void;
  reset: () => void;

  // ── Field updates ─────────────────────────────────────────
  updateField: (field: keyof BlogData, value: any) => void;
  updateNestedField: (path: string, value: any) => void;

  // ── Block operations ──────────────────────────────────────
  addBlock: (type: BlockType, defaultData: any) => void;
  updateBlock: (index: number, data: any) => void;
  removeBlock: (index: number) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;

  // ── History ───────────────────────────────────────────────
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // ── Draft / Save ──────────────────────────────────────────
  saveDraft: () => Promise<{ id: string } | null>;
  publish: () => Promise<boolean>;
  autoSave: () => Promise<void>;
  saveToLocalDraft: () => void;
  recoverFromLocalDraft: () => boolean;
  clearLocalDraft: () => void;
  getLocalDraftInfo: () => { exists: boolean; timestamp: number; isNewer: boolean } | null;

  // ── Validation ────────────────────────────────────────────
  validateForPublish: () => Record<string, string>;
  setPublishErrors: (errors: Record<string, string>) => void;

  // ── UI ────────────────────────────────────────────────────
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  setConflict: (val: boolean) => void;
  setOffline: (val: boolean) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────
export const useBlogEditorStore = create<BlogEditorStore>()(
  devtools(
    (set, get) => ({
      blogId: null,
      blog: { ...EMPTY_BLOG },
      savedBlog: null,
      isDirty: false,

      past: [],
      future: [],

      isLoading: false,
      isSaving: false,
      saveError: null,
      lastSavedAt: null,
      isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
      hasConflict: false,
      publishErrors: {},

      previewMode: 'desktop',

      // ── Init ──────────────────────────────────────────────
      initNew: () => {
        set({
          blogId: null,
          blog: { ...EMPTY_BLOG },
          savedBlog: null,
          isDirty: false,
          past: [],
          future: [],
          publishErrors: {},
          saveError: null,
          lastSavedAt: null,
        }, false, 'initNew');
      },

      loadBlog: (id, data) => {
        set({
          blogId: id,
          blog: { ...data },
          savedBlog: { ...data },
          isDirty: false,
          past: [],
          future: [],
          publishErrors: {},
          saveError: null,
        }, false, 'loadBlog');
      },

      reset: () => {
        set({
          blogId: null,
          blog: { ...EMPTY_BLOG },
          savedBlog: null,
          isDirty: false,
          past: [],
          future: [],
          isLoading: false,
          isSaving: false,
          saveError: null,
          publishErrors: {},
        }, false, 'reset');
      },

      // ── Field updates ──────────────────────────────────────
      updateField: (field, value) => {
        set(state => ({
          blog: { ...state.blog, [field]: value },
          isDirty: true,
        }), false, `updateField:${field}`);
      },

      updateNestedField: (path, value) => {
        const keys = path.split('.');
        set(state => {
          const updated = { ...state.blog } as any;
          let cursor = updated;
          for (let i = 0; i < keys.length - 1; i++) {
            cursor[keys[i]] = { ...(cursor[keys[i]] || {}) };
            cursor = cursor[keys[i]];
          }
          cursor[keys[keys.length - 1]] = value;
          return { blog: updated, isDirty: true };
        }, false, `updateNestedField:${path}`);
      },

      // ── Block operations ───────────────────────────────────
      addBlock: (type, defaultData) => {
        const SINGLETONS = ['hero', 'pros-cons', 'cta'];
        if (SINGLETONS.includes(type)) {
          const exists = (get().blog.blocks || []).some(b => b.type === type);
          if (exists) return;
        }
        get().pushHistory();
        const newBlock: BlogBlock = {
          id: uuidv4(),
          type,
          data: { ...defaultData },
        };
        set(state => ({
          blog: {
            ...state.blog,
            blocks: [...(state.blog.blocks || []), newBlock],
          },
          isDirty: true,
          future: [], // clear redo on new action
        }), false, `addBlock:${type}`);
      },

      updateBlock: (index, data) => {
        set(state => {
          const blocks = [...(state.blog.blocks || [])];
          blocks[index] = { ...blocks[index], data };
          return {
            blog: { ...state.blog, blocks },
            isDirty: true,
          };
        }, false, `updateBlock:${index}`);
      },

      removeBlock: (index) => {
        get().pushHistory();
        set(state => {
          const blocks = [...(state.blog.blocks || [])];
          blocks.splice(index, 1);
          return {
            blog: { ...state.blog, blocks },
            isDirty: true,
            future: [],
          };
        }, false, `removeBlock:${index}`);
      },

      reorderBlocks: (fromIndex, toIndex) => {
        get().pushHistory();
        set(state => {
          const blocks = [...(state.blog.blocks || [])];
          const [moved] = blocks.splice(fromIndex, 1);
          blocks.splice(toIndex, 0, moved);
          return {
            blog: { ...state.blog, blocks },
            isDirty: true,
            future: [],
          };
        }, false, 'reorderBlocks');
      },

      // ── History ────────────────────────────────────────────
      pushHistory: () => {
        set(state => ({
          past: [
            ...state.past.slice(-HISTORY_MAX + 1),
            state.blog.blocks.map(b => ({ ...b, data: { ...b.data } })),
          ],
        }), false, 'pushHistory');
      },

      undo: () => {
        set(state => {
          if (!state.past.length) return state;
          const prev = state.past[state.past.length - 1];
          return {
            past: state.past.slice(0, -1),
            future: [
              state.blog.blocks.map(b => ({ ...b, data: { ...b.data } })),
              ...state.future.slice(0, HISTORY_MAX - 1),
            ],
            blog: { ...state.blog, blocks: prev },
            isDirty: true,
          };
        }, false, 'undo');
      },

      redo: () => {
        set(state => {
          if (!state.future.length) return state;
          const next = state.future[0];
          return {
            future: state.future.slice(1),
            past: [
              ...state.past.slice(-HISTORY_MAX + 1),
              state.blog.blocks.map(b => ({ ...b, data: { ...b.data } })),
            ],
            blog: { ...state.blog, blocks: next },
            isDirty: true,
          };
        }, false, 'redo');
      },

      // ── Draft operations ───────────────────────────────────
      saveToLocalDraft: () => {
        const { blogId, blog } = get();
        if (typeof window === 'undefined') return;
        const key = getDraftKey(blogId);
        const payload = { ...blog, localUpdatedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(payload));
        enforceMaxDrafts();
      },

      recoverFromLocalDraft: () => {
        const { blogId } = get();
        const key = getDraftKey(blogId);
        const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        if (!raw) return false;
        try {
          const parsed = JSON.parse(raw);
          set(state => ({
            blog: { ...parsed },
            isDirty: true,
            past: [
              ...state.past.slice(-HISTORY_MAX + 1),
              state.blog.blocks.map(b => ({ ...b })),
            ],
          }), false, 'recoverFromLocalDraft');
          return true;
        } catch {
          return false;
        }
      },

      clearLocalDraft: () => {
        const { blogId } = get();
        if (typeof window === 'undefined') return;
        localStorage.removeItem(getDraftKey(blogId));
        localStorage.removeItem(getDraftKey(null)); // always clear 'new' key too
      },

      getLocalDraftInfo: () => {
        const { blogId, savedBlog } = get();
        if (typeof window === 'undefined') return null;
        const key = getDraftKey(blogId);
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw);
          const timestamp = parsed.localUpdatedAt || 0;
          const serverTime = savedBlog?.updatedAt
            ? new Date(savedBlog.updatedAt).getTime() : 0;
          return {
            exists: true,
            timestamp,
            isNewer: timestamp - serverTime > 10_000,
          };
        } catch {
          return null;
        }
      },

      // ── Save / Publish ─────────────────────────────────────
      saveDraft: async () => {
        const { blogId, blog, isSaving } = get();
        if (isSaving) return null;
        set({ isSaving: true, saveError: null }, false, 'saveDraft:start');

        const isNew = !blogId || blogId === 'new';
        const url = isNew ? '/api/blogs' : `/api/blogs/${blogId}`;
        const method = isNew ? 'POST' : 'PUT';
        const payload = { ...blog, status: 'draft' };

        try {
          let res: Response;
          if (!navigator.onLine) {
            // Queue for later
            const queue = getBlogSaveQueue();
            queue.push({ id: uuidv4(), blogId, payload, method, url, timestamp: Date.now(), retries: 0 });
            setBlogSaveQueue(queue);
            set({ isSaving: false, saveError: null }, false, 'saveDraft:queued');
            return null;
          }

          res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Save failed');
          }

          const result = await res.json();
          const updatedBlog = result.blog;
          const newId = updatedBlog._id?.toString() || blogId;

          // Clear draft keys (both 'new' and real id)
          if (typeof window !== 'undefined') {
            localStorage.removeItem(getDraftKey(null));
            localStorage.removeItem(getDraftKey(newId));
          }

          set({
            blogId: newId,
            blog: { ...updatedBlog },
            savedBlog: { ...updatedBlog },
            isDirty: false,
            isSaving: false,
            lastSavedAt: new Date(),
          }, false, 'saveDraft:success');

          return { id: newId };
        } catch (err: any) {
          // Queue on failure
          const queue = getBlogSaveQueue();
          queue.push({ id: uuidv4(), blogId, payload, method, url, timestamp: Date.now(), retries: 0 });
          setBlogSaveQueue(queue);

          set({ isSaving: false, saveError: err.message }, false, 'saveDraft:error');
          return null;
        }
      },

      publish: async () => {
        const { blogId, blog, isSaving } = get();
        if (isSaving) return false;

        const errors = get().validateForPublish();
        if (Object.keys(errors).length > 0) {
          set({ publishErrors: errors }, false, 'publish:invalid');
          return false;
        }

        set({ isSaving: true, saveError: null, publishErrors: {} }, false, 'publish:start');

        const isNew = !blogId || blogId === 'new';
        const url = isNew ? '/api/blogs' : `/api/blogs/${blogId}`;
        const method = isNew ? 'POST' : 'PUT';
        const payload = { ...blog, status: 'published', publishedAt: new Date().toISOString() };

        try {
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Publish failed');
          }

          const result = await res.json();
          const updatedBlog = result.blog;
          const newId = updatedBlog._id?.toString() || blogId;

          if (typeof window !== 'undefined') {
            localStorage.removeItem(getDraftKey(null));
            localStorage.removeItem(getDraftKey(newId));
          }

          set({
            blogId: newId,
            blog: { ...updatedBlog },
            savedBlog: { ...updatedBlog },
            isDirty: false,
            isSaving: false,
            lastSavedAt: new Date(),
          }, false, 'publish:success');

          return true;
        } catch (err: any) {
          set({ isSaving: false, saveError: err.message }, false, 'publish:error');
          return false;
        }
      },

      autoSave: async () => {
        const { blogId, blog, savedBlog, isSaving, isDirty } = get();
        if (isSaving || !isDirty) return;
        // Only autosave if there's real content
        if (!blog.title && (!blog.blocks || blog.blocks.length === 0)) return;

        // Save to local draft always
        const key = getDraftKey(blogId);
        const payload = { ...blog, localUpdatedAt: Date.now() };
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(payload));
          enforceMaxDrafts();
        }

        // Only server-save if blog already has an ID (was previously saved)
        if (!blogId || blogId === 'new') return;

        set({ isSaving: true }, false, 'autoSave:start');
        try {
          const res = await fetch(`/api/blogs/${blogId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...blog, status: blog.status }),
          });
          if (res.ok) {
            const result = await res.json();
            if (typeof window !== 'undefined') localStorage.removeItem(key);
            set({
              savedBlog: { ...result.blog },
              isDirty: false,
              isSaving: false,
              lastSavedAt: new Date(),
            }, false, 'autoSave:success');
          } else {
            set({ isSaving: false }, false, 'autoSave:fail');
          }
        } catch {
          set({ isSaving: false }, false, 'autoSave:networkFail');
        }
      },

      // ── Validation ────────────────────────────────────────
      validateForPublish: () => {
        const { blog } = get();
        const errors: Record<string, string> = {};

        if (!blog.title || blog.title.trim().length < 5) {
          errors.title = 'Title must be at least 5 characters';
        }
        if (!blog.blocks || blog.blocks.length === 0) {
          errors.blocks = 'Add at least one content block before publishing';
        } else {
          const hero = blog.blocks.find(b => b.type === 'hero');
          if (!hero?.data?.imageUrl && !hero?.data?.heroImageUrl) {
            errors.hero = 'A Hero Section with an image is required to publish';
          }
          const wordCount = blog.blocks
            .filter(b => b.type === 'text')
            .reduce((n, b) => n + (b.data?.content || '').split(/\s+/).filter(Boolean).length, 0);
          if (wordCount < 100) {
            errors.content = `Content too short — ${wordCount}/100 words minimum`;
          }
        }
        return errors;
      },

      setPublishErrors: (errors) => set({ publishErrors: errors }, false, 'setPublishErrors'),

      // ── UI ────────────────────────────────────────────────
      setPreviewMode: (mode) => set({ previewMode: mode }, false, 'setPreviewMode'),
      setConflict: (val) => set({ hasConflict: val }, false, 'setConflict'),
      setOffline: (val) => set({ isOffline: val }, false, 'setOffline'),
    }),
    { name: 'Astronix-BlogEditor-Store' }
  )
);

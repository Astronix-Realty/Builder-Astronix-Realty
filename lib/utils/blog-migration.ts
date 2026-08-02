import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────
export interface NormalizedListItem {
  id: string;
  value: string;
}

// ─── Main entry point ─────────────────────────────────────────────────────
/**
 * Migrates a raw blog object (from DB or localStorage) to the current schema.
 * Safe to call on already-migrated data — idempotent.
 */
export function migrateBlogData(raw: any): any {
  if (!raw) return raw;
  return {
    ...raw,
    blocks: Array.isArray(raw.blocks) ? raw.blocks.map(migrateBlock) : [],
  };
}

// ─── Per-block migration ───────────────────────────────────────────────────
function migrateBlock(block: any): any {
  if (!block || !block.type) return block;

  switch (block.type) {
    case 'pros-cons':
      return migrateProsConsBlock(block);
    case 'cta':
      return migrateCtaBlock(block);
    default:
      return block;
  }
}

// ─── ProsCons: string[] → { id, value }[] ─────────────────────────────────
function migrateProsConsBlock(block: any): any {
  const pros = normalizeListItems(block.data?.pros);
  const cons = normalizeListItems(block.data?.cons);
  return {
    ...block,
    data: {
      ...block.data,
      pros,
      cons,
    },
  };
}

export function normalizeListItems(raw: any): NormalizedListItem[] {
  if (!Array.isArray(raw)) return [{ id: uuidv4(), value: '' }];
  return raw.map((item: any) => {
    if (typeof item === 'string') {
      // Old format: plain string
      return { id: uuidv4(), value: item };
    }
    if (item && typeof item === 'object' && typeof item.id === 'string') {
      // Already migrated
      return { id: item.id, value: item.value ?? '' };
    }
    return { id: uuidv4(), value: String(item ?? '') };
  });
}

// ─── CTA: old field names → new field names ───────────────────────────────
function migrateCtaBlock(block: any): any {
  const d = block.data || {};
  return {
    ...block,
    data: {
      heading:     d.heading     ?? d.text         ?? 'Ready to Get Started?',
      description: d.description ?? d.subtitle     ?? 'Take the next step and discover your dream property today.',
      buttonText:  d.buttonText  ?? d.buttonLabel  ?? d.ctaLabel ?? 'Explore Properties',
      buttonUrl:   d.buttonUrl   ?? d.link         ?? d.url      ?? '#',
      variant:     d.variant     ?? 'minimal',
    },
  };
}

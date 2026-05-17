import React from 'react';
import { HeroBlock, TextBlock } from './CoreBlocks';
import { FaqBlock, GalleryBlock, ProsConsBlock, CtaBlock } from './AdvancedBlocks';

export type BlockType = 'hero' | 'text' | 'faq' | 'gallery' | 'pros-cons' | 'cta';

export interface BlockProps {
  id: string;
  data: any;
  onChange: (data: any) => void;
  isEditing?: boolean;
  globalTitle?: string;
  onGlobalTitleChange?: (title: string) => void;
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  component: React.FC<BlockProps>;
  defaultData: any;
}

export const BlockRegistry: Record<BlockType, BlockDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero Section',
    icon: 'LayoutTemplate',
    component: HeroBlock,
    defaultData: { heading: '', subtitle: '', imageUrl: '' }
  },
  text: {
    type: 'text',
    label: 'Rich Text',
    icon: 'AlignLeft',
    component: TextBlock,
    defaultData: { content: '' }
  },
  faq: {
    type: 'faq',
    label: 'FAQs',
    icon: 'HelpCircle',
    component: FaqBlock,
    defaultData: { questions: [{ q: '', a: '' }] }
  },
  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    icon: 'Image',
    component: GalleryBlock,
    defaultData: { images: [] }
  },
  'pros-cons': {
    type: 'pros-cons',
    label: 'Pros & Cons',
    icon: 'Scale',
    component: ProsConsBlock,
    defaultData: { pros: [''], cons: [''] }
  },
  cta: {
    type: 'cta',
    label: 'Call to Action',
    icon: 'MousePointerClick',
    component: CtaBlock,
    defaultData: { text: '', buttonLabel: '', link: '' }
  }
};

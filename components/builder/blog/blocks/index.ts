import React from 'react';
import { HeroBlock, TextBlock } from './CoreBlocks';
import { FaqBlock, GalleryBlock, ProsConsBlock, TakeawaysBlock, TableBlock } from './AdvancedBlocks';

export type BlockType = 'hero' | 'text' | 'market-trends' | 'deep-dive' | 'featured-projects' | 'faq' | 'gallery' | 'pros-cons' | 'takeaways' | 'table';

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
  /** If true, only one instance allowed per blog */
  singleton?: boolean;
}

export const BlockRegistry: Record<BlockType, BlockDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero Section',
    icon: 'LayoutTemplate',
    component: HeroBlock,
    defaultData: { heading: '', subtitle: '', imageUrl: '', heroImageUrl: '' },
    singleton: true,
  },
  takeaways: {
    type: 'takeaways',
    label: 'Key Takeaways',
    icon: 'Star',
    component: TakeawaysBlock,
    defaultData: {
      items: [
        { id: '1', value: '' },
        { id: '2', value: '' },
        { id: '3', value: '' },
      ],
    },
    singleton: true,
  },
  text: {
    type: 'text',
    label: 'Rich Text',
    icon: 'AlignLeft',
    component: TextBlock,
    defaultData: { content: '' },
    singleton: true,
  },
  'market-trends': {
    type: 'market-trends',
    label: 'Market Trends',
    icon: 'TrendingUp',
    component: TextBlock,
    defaultData: { title: 'Market Trends', content: '', placeholder: 'Write your market analysis here...' },
    singleton: true,
  },
  'deep-dive': {
    type: 'deep-dive',
    label: 'Deep Dive',
    icon: 'Search',
    component: TextBlock,
    defaultData: { title: 'Deep Dive Analysis', content: '', placeholder: 'Write your detailed analysis here...' },
    singleton: true,
  },
  'featured-projects': {
    type: 'featured-projects',
    label: 'Featured Projects',
    icon: 'Building',
    component: TextBlock,
    defaultData: { title: 'Featured Projects', content: '', placeholder: 'Highlight key projects here...' },
    singleton: true,
  },
  faq: {
    type: 'faq',
    label: 'FAQs',
    icon: 'HelpCircle',
    component: FaqBlock,
    defaultData: { questions: [{ q: '', a: '' }] },
    singleton: true,
  },
  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    icon: 'Image',
    component: GalleryBlock,
    defaultData: { images: [] },
    singleton: true,
  },
  'pros-cons': {
    type: 'pros-cons',
    label: 'Pros & Cons',
    icon: 'Scale',
    component: ProsConsBlock,
    defaultData: {
      pros: [{ id: 'pro-1', value: '' }],
      cons: [{ id: 'con-1', value: '' }],
    },
    singleton: true,
  },
  table: {
    type: 'table',
    label: 'Table',
    icon: 'Table',
    component: TableBlock,
    defaultData: {
      title: '',
      rows: [
        ['Header 1', 'Header 2'],
        ['Row 1, Cell 1', 'Row 1, Cell 2'],
      ]
    },
    singleton: false,
  }
};

import React from 'react';
import { HeroBlock, TextBlock } from './CoreBlocks';
import { FaqBlock, GalleryBlock, ProsConsBlock, CtaBlock, TakeawaysBlock } from './AdvancedBlocks';

export type BlockType = 'hero' | 'text' | 'faq' | 'gallery' | 'pros-cons' | 'cta' | 'takeaways';

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
  text: {
    type: 'text',
    label: 'Rich Text',
    icon: 'AlignLeft',
    component: TextBlock,
    defaultData: { content: '' },
  },
  faq: {
    type: 'faq',
    label: 'FAQs',
    icon: 'HelpCircle',
    component: FaqBlock,
    defaultData: { questions: [{ q: '', a: '' }] },
  },
  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    icon: 'Image',
    component: GalleryBlock,
    defaultData: { images: [] },
  },
  'pros-cons': {
    type: 'pros-cons',
    label: 'Pros & Cons',
    icon: 'Scale',
    component: ProsConsBlock,
    // UUID-based items — stable keys, no typing reset
    defaultData: {
      pros: [{ id: 'pro-1', value: '' }],
      cons: [{ id: 'con-1', value: '' }],
    },
    singleton: true,
  },
  cta: {
    type: 'cta',
    label: 'Call to Action',
    icon: 'MousePointerClick',
    component: CtaBlock,
    // Field names match exactly what CtaBlock reads
    defaultData: {
      heading: 'Ready to Get Started?',
      description: 'Take the next step and discover your dream property today.',
      buttonText: 'Explore Properties',
      buttonUrl: '#',
      variant: 'minimal',
    },
    singleton: true,
  },
  takeaways: {
    type: 'takeaways',
    label: 'Key Takeaways',
    icon: 'Star',
    component: TakeawaysBlock,
    defaultData: {
      items: [
        { id: 'takeaway-1', value: 'Cost-benefit analyzed for maximum ROI potential' },
        { id: 'takeaway-2', value: 'Infrastructure impact on future valuation' }
      ]
    },
    singleton: true,
  },
};

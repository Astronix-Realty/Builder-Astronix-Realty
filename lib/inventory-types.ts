export interface AccordionItem {
  id: string
  title: string
  count: number
  subCount?: string
  status?: 'active' | 'draft' | 'selling' | 'sold'
}

export interface HierarchyLevel {
  units: number
  projects?: number
  towers?: number
  available?: number
  sold?: number
  reserved?: number
  blocked?: number
}

export interface InventoryState {
  expandedProjects: Set<string>
  expandedTowers: Set<string>
  selectedLevel: 'township' | 'project' | 'tower'
}

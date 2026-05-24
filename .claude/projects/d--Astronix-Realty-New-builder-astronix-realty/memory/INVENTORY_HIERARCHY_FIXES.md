---
name: Inventory Hierarchy Aggregation Fixes
description: Root cause analysis and fixes for Township/Project/Tower/Unit aggregation bugs
type: project
---

## Fixed Bugs

### Bug 1: Invalid Direct Tower Queries
**Root Cause**: Property schema (models/Property.ts:116) enforces strict hierarchy:
- Tower.parent MUST be a Project
- Towers cannot have Township as parent

**Problem**: API `/api/inventory/[propertyId]` lines 204-228 tried to fetch towers with `parentId=township`, which violates schema
- Query always returned 0 results
- "Direct towers" logic was phantom code

**Fix**: 
- Removed invalid query (app/api/inventory/[propertyId]/route.ts:204-228)
- Enforced strict hierarchy: Township → Project → Tower → Unit

### Bug 2: UI Had Phantom Direct Tower Logic
**Problem**: inventory-view.tsx had multiple references to non-existent direct towers:
- Line 257-259: `hasDirectTowers` detection
- Line 264, 276-280: "direct" filtering logic  
- Line 342-347: "Direct Towers" option in selector
- Line 1271-1272: Navigation logic for direct towers

**Fix**:
- Disabled `hasDirectTowers` (always returns false)
- Removed all "selectedProjectId === 'direct'" checks
- Simplified filtering to: If project selected → filter by projectId
- Removed "Direct Towers" from project selector

### Bug 3: Unit Aggregation at Hierarchy Levels
**Status**: Fixed by removing direct tower logic

**How it works now**:
- **Township level**: All units from all projects → All units visible ✓
- **Project level**: All units from all towers in project → All units visible ✓
- **Tower level**: Only units in tower → Proper subset ✓

## Data Hierarchy

**Strict Model**:
```
Township (type="township", parentId=null)
├── Project (type="project", parentId=township._id)
│   ├── Tower (type="tower", parentId=project._id)
│   │   └── Unit (towerId=tower._id, projectId=project._id)
```

**Standalone Entry Points** (future enhancement):
```
Project (type="project", flowType="project", parentId=null)
├── Tower (type="tower", parentId=project._id)
│   └── Unit (towerId=tower._id, projectId=project._id)

Tower (type="tower", flowType="tower", parentId=null)
└── Unit (towerId=tower._id, projectId=null)
```

## Files Modified

1. **app/api/inventory/[propertyId]/route.ts**
   - Removed lines 204-228 (direct tower fetching)
   - Simplified buildHierarchy for strict hierarchy only

2. **components/builder/inventory/inventory-view.tsx**
   - Lines 245-266: Removed hasDirectTowers detection, simplified tower normalization
   - Lines 269-285: Fixed scopeUnits filtering (removed "direct" logic)
   - Lines 326-355: Simplified breadcrumbs (removed "Direct Towers" option)
   - Lines 741-768: Removed "Direct Towers" from project selector
   - Lines 1267-1273: Simplified "Focus Tower" button logic

## Impact

✓ Units now properly aggregate at Township, Project, and Tower levels
✓ UI filtering is simplified and correct
✓ No phantom data flows
✓ Builder/Mandate data isolation preserved (RBAC still enforced)
✓ Code is cleaner and more maintainable

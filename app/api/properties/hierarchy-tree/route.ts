import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export interface HierarchyTreeItem {
  id: string;
  name: string;
  type: "township" | "project" | "tower" | "unit";
  level: "township" | "project" | "tower" | "unit";
  depth: number;
  breadcrumbLabel: string;
  parentId?: string | null;
  townshipId?: string | null;
  projectId?: string | null;
  towerId?: string | null;
  childCount: number;
}

export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    // Query all properties owned by this builder/mandate
    const ownership = getOwnershipQuery(context!);
    const rawProperties = await Property.find({
      ...ownership,
      isDeleted: { $ne: true },
      status: { $in: ["published", "active", "draft", "pending"] },
    })
      .select("_id name type parentId status location details")
      .sort({ updatedAt: -1 })
      .lean();

    // Deduplicate properties with the exact same name and type
    const propertyMap = new Map<string, any>();
    for (const p of rawProperties) {
      const id = (p as any)._id.toString();
      propertyMap.set(id, p);
    }

    // Separate roots and children
    const roots: any[] = [];
    const childrenByParent = new Map<string, any[]>();

    for (const p of propertyMap.values()) {
      const parentId = p.parentId ? p.parentId.toString() : null;
      if (!parentId || !propertyMap.has(parentId)) {
        roots.push(p);
      } else {
        const existing = childrenByParent.get(parentId) || [];
        existing.push(p);
        childrenByParent.set(parentId, existing);
      }
    }

    // Prepare units lookup
    const unitsByTower = new Map<string, any[]>();

    // Also check embedded projects and towers from property details
    for (const p of propertyMap.values()) {
      const rootId = (p as any)._id.toString();
      const details = p.details || {};
      const embeddedProjects: any[] = Array.isArray(details.projects) ? details.projects : [];
      const embeddedTowers: any[] = Array.isArray(details.towers) ? details.towers : [];
      const embeddedUnits: any[] = Array.isArray(details.generatedUnits) ? details.generatedUnits : [];

      const existingChildren = childrenByParent.get(rootId) || [];
      if (existingChildren.length === 0 && embeddedProjects.length > 0) {
        // Map embedded projects
        const projChildren: any[] = [];
        for (const [pIdx, proj] of embeddedProjects.entries()) {
          const projId = (proj.id || proj._id || `${rootId}-proj-${pIdx}`).toString();
          const projName = proj.name || `Phase ${pIdx + 1}`;
          const projObj = {
            _id: projId,
            name: projName,
            type: "project",
            parentId: rootId,
            details: proj,
          };
          projChildren.push(projObj);

          // Find towers belonging to this project
          const projTowers = embeddedTowers.filter((t: any) => {
            const pId = (t.projectId || t.parentProjectId || "").toString();
            return pId === projId || pId === projName;
          });

          const towerChildren: any[] = (projTowers.length > 0 ? projTowers : (Array.isArray(proj.towers) ? proj.towers : []))
            .map((t: any, tIdx: number) => ({
              _id: (t.id || t._id || `${projId}-t-${tIdx}`).toString(),
              name: t.name || `Tower ${tIdx + 1}`,
              type: "tower",
              parentId: projId,
              details: t,
            }));

          if (towerChildren.length > 0) {
            childrenByParent.set(projId, towerChildren);
          }
        }
        childrenByParent.set(rootId, projChildren);
      } else if (existingChildren.length === 0 && embeddedTowers.length > 0) {
        // Direct towers under property
        const towerChildren = embeddedTowers.map((t: any, tIdx: number) => ({
          _id: (t.id || t._id || `${rootId}-t-${tIdx}`).toString(),
          name: t.name || `Tower ${tIdx + 1}`,
          type: "tower",
          parentId: rootId,
          details: t,
        }));
        childrenByParent.set(rootId, towerChildren);
      }

      // Group embedded units by towerId
      if (embeddedUnits.length > 0) {
        for (const [uIdx, u] of embeddedUnits.entries()) {
          const tId = (u.towerId || u.parentId || "default").toString();
          const list = unitsByTower.get(tId) || [];
          list.push({
            _id: (u.id || u._id || `${rootId}-u-${uIdx}`).toString(),
            unitNumber: u.unitNumber || `U-${uIdx + 1}`,
            configuration: u.configuration || "Standard",
            floorNumber: u.floorNumber || u.floor || 1,
            towerId: tId,
          });
          unitsByTower.set(tId, list);
        }
      }
    }

    // Also fetch units from DB collection if any tower documents exist
    const towerIds = Array.from(propertyMap.values())
      .filter((p: any) => p.type === "tower")
      .map((p: any) => p._id);

    if (towerIds.length > 0) {
      const rawUnits = await Unit.find({
        ...ownership,
        towerId: { $in: towerIds },
        status: { $ne: "archived" },
      })
        .select("_id unitNumber towerId projectId parentId floorNumber configuration")
        .lean();

      for (const u of rawUnits) {
        const tId = (u.towerId || u.parentId)?.toString();
        if (tId) {
          const list = unitsByTower.get(tId) || [];
          list.push(u);
          unitsByTower.set(tId, list);
        }
      }
    }

    // Traverse and flatten tree in logical order
    const treeItems: HierarchyTreeItem[] = [];

    const traverse = (
      node: any,
      depth: number,
      ancestors: { townshipId?: string; projectId?: string; towerId?: string; path: string[] }
    ) => {
      const id = node._id.toString();
      const nodeName = (node.name || node.townshipName || "Unnamed Property").trim();
      const currentPath = [...ancestors.path, nodeName];
      const children = childrenByParent.get(id) || [];
      const nodeUnits = node.type === "tower" ? (unitsByTower.get(id) || []) : [];

      const item: HierarchyTreeItem = {
        id,
        name: nodeName,
        type: node.type,
        level: node.type,
        depth,
        breadcrumbLabel: currentPath.join(" ➔ "),
        parentId: node.parentId ? node.parentId.toString() : null,
        townshipId: node.type === "township" ? id : ancestors.townshipId || null,
        projectId: node.type === "project" ? id : ancestors.projectId || null,
        towerId: node.type === "tower" ? id : ancestors.towerId || null,
        childCount: children.length + nodeUnits.length,
      };

      treeItems.push(item);

      // Next level ancestors
      const nextAncestors = {
        townshipId: node.type === "township" ? id : ancestors.townshipId,
        projectId: node.type === "project" ? id : ancestors.projectId,
        towerId: node.type === "tower" ? id : ancestors.towerId,
        path: currentPath,
      };

      // Traverse child projects / towers
      for (const child of children) {
        traverse(child, depth + 1, nextAncestors);
      }

      // Optional: Add units if reasonable count (< 25 per tower)
      if (node.type === "tower" && nodeUnits.length > 0 && nodeUnits.length <= 25) {
        for (const unit of nodeUnits) {
          const unitId = unit._id.toString();
          const unitName = `Unit ${unit.unitNumber || unit.name || "N/A"}${unit.configuration ? ` (${unit.configuration})` : ""}`;
          treeItems.push({
            id: unitId,
            name: unitName,
            type: "unit",
            level: "unit",
            depth: depth + 1,
            breadcrumbLabel: [...currentPath, unitName].join(" ➔ "),
            parentId: id,
            townshipId: nextAncestors.townshipId || null,
            projectId: nextAncestors.projectId || null,
            towerId: id,
            childCount: 0,
          });
        }
      }
    };

    for (const root of roots) {
      traverse(root, 0, { path: [] });
    }

    return NextResponse.json({ success: true, tree: treeItems }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch hierarchy tree error:", error);
    return NextResponse.json({ error: "Failed to fetch property hierarchy tree" }, { status: 500 });
  }
}

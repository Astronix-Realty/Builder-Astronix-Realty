import mongoose from "mongoose";
import Unit from "@/models/Unit";
import Property from "@/models/Property";

// 1. Aggregate Tower Counts from its Units
export async function aggregateTowerCounts(towerId: string | mongoose.Types.ObjectId) {
  if (!towerId) return;

  try {
    // Count active published units for this tower
    const unitsCount = await Unit.countDocuments({ 
      towerId, 
      status: { $nin: ["draft", "pending", "rejected"] },
      isDeleted: { $ne: true } 
    });

    // Update Tower Property
    const tower = await Property.findByIdAndUpdate(
      towerId,
      {
        $set: {
          "details.totalUnits": unitsCount,
        }
      },
      { new: true }
    ).lean() as any;

    if (tower && tower.parentId) {
      // Propagate upward to Project
      await aggregateProjectCounts(tower.parentId);
    }
  } catch (error) {
    console.error(`[aggregateTowerCounts] Error aggregating counts for tower ${towerId}:`, error);
  }
}

// 2. Aggregate Project Counts from its Towers
export async function aggregateProjectCounts(projectId: string | mongoose.Types.ObjectId) {
  if (!projectId) return;

  try {
    // Find all towers for this project
    const towers = await Property.find({ 
      parentId: projectId, 
      type: "tower",
      status: { $nin: ["draft", "pending", "rejected"] },
      isDeleted: false,
    }).select("details.totalUnits").lean();
    
    const towersCount = towers.length;
    const unitsCount = towers.reduce((sum, t) => sum + (t.details?.totalUnits || 0), 0);

    // Update Project Property
    const project = await Property.findByIdAndUpdate(
      projectId,
      {
        $set: {
          "details.totalTowers": towersCount,
          "details.totalUnits": unitsCount,
        }
      },
      { new: true }
    ).lean() as any;

    if (project && project.parentId) {
      // Propagate upward to Township
      await aggregateTownshipCounts(project.parentId);
    }
  } catch (error) {
    console.error(`[aggregateProjectCounts] Error aggregating counts for project ${projectId}:`, error);
  }
}

// 3. Aggregate Township Counts from its Projects
export async function aggregateTownshipCounts(townshipId: string | mongoose.Types.ObjectId) {
  if (!townshipId) return;

  try {
    // Find all projects for this township
    const projects = await Property.find({ 
      parentId: townshipId, 
      type: "project",
      status: { $nin: ["draft", "pending", "rejected"] },
      isDeleted: false,
    }).select("details.totalTowers details.totalUnits").lean();
    
    const projectCount = projects.length;
    const towersCount = projects.reduce((sum, p) => sum + (p.details?.totalTowers || 0), 0);
    const unitsCount = projects.reduce((sum, p) => sum + (p.details?.totalUnits || 0), 0);

    // Update Township Property
    await Property.findByIdAndUpdate(
      townshipId,
      {
        $set: {
          "details.projectCount": projectCount,
          "details.totalTowers": towersCount,
          "details.totalUnits": unitsCount,
        }
      }
    );
  } catch (error) {
    console.error(`[aggregateTownshipCounts] Error aggregating counts for township ${townshipId}:`, error);
  }
}

import mongoose from "mongoose";
import Unit from "@/models/Unit";
import Property from "@/models/Property";

// Helper to format price label (e.g. ₹50L - ₹1.5Cr)
export function formatPriceLabel(min: number, max: number): string {
  if (min === 0 && max === 0) return "N/A";

  const format = (p: number) => {
    if (p >= 10000000) return `${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `${(p / 100000).toFixed(2)} L`;
    return p.toLocaleString();
  };

  return min === max ? `₹${format(min)}` : `₹${format(min)} - ₹${format(max)}`;
}

// 1. Aggregate Tower Pricing from its Units
export async function aggregateTowerPricing(towerId: string | mongoose.Types.ObjectId) {
  if (!towerId || !mongoose.isValidObjectId(towerId)) return;

  try {
    // Find all units for this tower
    const units = await Unit.find({ towerId, price: { $gt: 0 }, isDeleted: { $ne: true } }).select("price").lean();
    
    let min = 0;
    let max = 0;
    let label = "N/A";

    if (units.length > 0) {
      const prices = units.map(u => u.price).filter((p): p is number => typeof p === "number" && p > 0);
      if (prices.length > 0) {
        min = Math.min(...prices);
        max = Math.max(...prices);
        label = formatPriceLabel(min, max);
      }
    }

    // Update Tower Property
    const tower = await Property.findByIdAndUpdate(
      towerId,
      {
        $set: {
          "details.priceRangeMin": min,
          "details.priceRangeMax": max,
          "details.priceLabel": label,
        }
      },
      { new: true }
    ).lean() as any;

    if (tower && tower.parentId) {
      // Propagate upward to Project
      await aggregateProjectPricing(tower.parentId);
    }
  } catch (error) {
    console.error(`[aggregateTowerPricing] Error aggregating pricing for tower ${towerId}:`, error);
  }
}

// 2. Aggregate Project Pricing from its Towers
export async function aggregateProjectPricing(projectId: string | mongoose.Types.ObjectId) {
  if (!projectId || !mongoose.isValidObjectId(projectId)) return;

  try {
    // Find all towers for this project
    const towers = await Property.find({ 
      parentId: projectId, 
      type: "tower",
      isDeleted: false,
    }).select("details.priceRangeMin details.priceRangeMax").lean();
    
    let min = 0;
    let max = 0;
    let label = "N/A";

    if (towers.length > 0) {
      const mins = towers.map(t => t.details?.priceRangeMin || 0).filter(p => p > 0);
      const maxs = towers.map(t => t.details?.priceRangeMax || 0).filter(p => p > 0);
      
      if (mins.length > 0 && maxs.length > 0) {
        min = Math.min(...mins);
        max = Math.max(...maxs);
        label = formatPriceLabel(min, max);
      }
    }

    // Update Project Property
    const project = await Property.findByIdAndUpdate(
      projectId,
      {
        $set: {
          "details.priceRangeMin": min,
          "details.priceRangeMax": max,
          "details.priceLabel": label,
        }
      },
      { new: true }
    ).lean() as any;

    if (project && project.parentId) {
      // Propagate upward to Township
      await aggregateTownshipPricing(project.parentId);
    }
  } catch (error) {
    console.error(`[aggregateProjectPricing] Error aggregating pricing for project ${projectId}:`, error);
  }
}

// 3. Aggregate Township Pricing from its Projects
export async function aggregateTownshipPricing(townshipId: string | mongoose.Types.ObjectId) {
  if (!townshipId) return;

  try {
    // Find all projects for this township
    const projects = await Property.find({ 
      parentId: townshipId, 
      type: "project",
      isDeleted: false,
    }).select("details.priceRangeMin details.priceRangeMax").lean();
    
    let min = 0;
    let max = 0;
    let label = "N/A";

    if (projects.length > 0) {
      const mins = projects.map(p => p.details?.priceRangeMin || 0).filter(p => p > 0);
      const maxs = projects.map(p => p.details?.priceRangeMax || 0).filter(p => p > 0);
      
      if (mins.length > 0 && maxs.length > 0) {
        min = Math.min(...mins);
        max = Math.max(...maxs);
        label = formatPriceLabel(min, max);
      }
    }

    // Update Township Property
    await Property.findByIdAndUpdate(
      townshipId,
      {
        $set: {
          "details.priceRangeMin": min,
          "details.priceRangeMax": max,
          "details.priceLabel": label,
        }
      }
    );
  } catch (error) {
    console.error(`[aggregateTownshipPricing] Error aggregating pricing for township ${townshipId}:`, error);
  }
}

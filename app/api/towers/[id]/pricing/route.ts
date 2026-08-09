import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import User from "@/models/User";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { aggregateTowerPricing, formatPriceLabel } from "@/lib/services/pricing-sync";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
    if (errorResponse) return errorResponse;

    const { id: towerId } = await props.params;
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const body = await req.json();
    const { ratePerSqft } = body;

    if (!ratePerSqft || isNaN(parseFloat(ratePerSqft))) {
      return NextResponse.json({ error: "Invalid rate provided" }, { status: 400 });
    }

    await dbConnect();
    
    let ownershipQuery = getOwnershipQuery(context!);
    if (context!.role === "builder") {
      ownershipQuery = { builderId: context!.userId, role: { $ne: 'mandate' } };
    } else if (context!.role === "teamLeader") {
      const leaderDoc = await User.findById(context!.userId).lean();
      if (!leaderDoc || leaderDoc.profile?.propertyId !== propertyId) {
        return NextResponse.json({ error: "Unauthorized pricing update for this property" }, { status: 403 });
      }
      ownershipQuery = {};
    }

    let standaloneModified = 0;
    
    // Step 1: Update split DB documents
    const units = await Unit.find({ towerId, status: { $in: ["available", "draft", "pending", "published"] }, ...ownershipQuery });
    
    for (const unit of units) {
      if ((unit as any).area || (unit as any).carpetArea) {
        const area = (unit as any).area || (unit as any).carpetArea;
        unit.ratePerSqft = ratePerSqft;
        unit.price = area * ratePerSqft;
        await unit.save();
        standaloneModified++;
      }
    }

    // Update Split DB Tower document's baseRatePerSqft if it exists
    let splitTower: any = null;
    if (mongoose.isValidObjectId(towerId)) {
      splitTower = await Property.findOne({ _id: towerId, type: 'tower', ...ownershipQuery });
      if (splitTower) {
        if (!splitTower.details) splitTower.details = {};
        splitTower.details.baseRatePerSqft = ratePerSqft.toString();
        splitTower.markModified('details');
        await splitTower.save();
      }
    }

    // Step 2: Try embedded update in Property.details
    let embeddedModified = 0;
    if (propertyId && mongoose.isValidObjectId(propertyId)) {
      const property = await Property.findOne({ _id: propertyId, ...ownershipQuery });
      
      if (property && property.details) {
        let changed = false;

        // For standalone tower: property IS the tower
        const isStandaloneTower = property.type === 'tower' && property._id.toString() === towerId;

        // Update embedded tower config
        if (isStandaloneTower) {
           property.details.baseRatePerSqft = ratePerSqft.toString();
           if (property.details.unitTemplate) {
               property.details.unitTemplate.ratePerSqft = ratePerSqft.toString();
               property.details.unitTemplate.baseRatePerSqft = ratePerSqft.toString();
           }
           changed = true;
        } else {
           if (property.details.towers && Array.isArray(property.details.towers)) {
             property.details.towers = property.details.towers.map((t: any) => {
               if (t.id === towerId || t._dbId === towerId || t._id?.toString() === towerId || (splitTower && t.name === splitTower.name)) {
                 t.baseRatePerSqft = ratePerSqft.toString();
                 changed = true;
               }
               return t;
             });
           }
           if (property.details.projects && Array.isArray(property.details.projects)) {
             property.details.projects = property.details.projects.map((p: any) => {
               if (p.towers && Array.isArray(p.towers)) {
                 p.towers = p.towers.map((t: any) => {
                   if (t.id === towerId || t._dbId === towerId || t._id?.toString() === towerId || (splitTower && t.name === splitTower.name)) {
                     t.baseRatePerSqft = ratePerSqft.toString();
                     changed = true;
                   }
                   return t;
                 });
               }
               return p;
             });
           }
        }

        // Collect all frontend towerIds that correspond to this DB tower
        // (towerUnitConfigs uses frontend IDs like "tower-standalone-1")
        const frontendTowerIds: string[] = [towerId];
        const towerName = splitTower?.name || null;

        if (property.details.towers && Array.isArray(property.details.towers)) {
          property.details.towers.forEach((t: any) => {
            if (t.id === towerId || t._dbId === towerId || t._id?.toString() === towerId || (towerName && t.name === towerName)) {
              if (!frontendTowerIds.includes(t.id)) frontendTowerIds.push(t.id);
              // Also collect _dbId if set, in case config.towerId stores it
              if (t._dbId && !frontendTowerIds.includes(t._dbId)) frontendTowerIds.push(t._dbId);
            }
          });
        }
        if (property.details.projects && Array.isArray(property.details.projects)) {
          property.details.projects.forEach((p: any) => {
            if (p.towers && Array.isArray(p.towers)) {
              p.towers.forEach((t: any) => {
                if (t.id === towerId || t._dbId === towerId || t._id?.toString() === towerId || (towerName && t.name === towerName)) {
                  if (!frontendTowerIds.includes(t.id)) frontendTowerIds.push(t.id);
                  if (t._dbId && !frontendTowerIds.includes(t._dbId)) frontendTowerIds.push(t._dbId);
                }
              });
            }
          });
        }
        console.log(`[Pricing API Debug] towerId=${towerId}, towerName=${towerName}, frontendTowerIds=`, frontendTowerIds);
        // For standalone tower: include all config towerIds since the property IS the tower
        if (isStandaloneTower && property.details.towerUnitConfigs) {
          property.details.towerUnitConfigs.forEach((c: any) => {
            if (c.towerId) frontendTowerIds.push(c.towerId);
          });
        }

        if (property.details.towerUnitConfigs && Array.isArray(property.details.towerUnitConfigs)) {
           let matchedConfigs = 0;
           property.details.towerUnitConfigs = property.details.towerUnitConfigs.map((config: any) => {
              // Match by frontendTowerIds OR by tower name (fallback when IDs don't align)
              const configTowerId = config.towerId?.toString() || "";
              let configMatchesByName = false;
              if (towerName) {
                const allEmbeddedTowers = [...(property.details.towers || []), ...(property.details.projects?.flatMap((p: any) => p.towers || []) || [])];
                const owningTower = allEmbeddedTowers.find((t: any) => t.id === configTowerId || t._id?.toString() === configTowerId);
                if (owningTower && (owningTower.name === towerName || owningTower.title === towerName)) {
                    configMatchesByName = true;
                }
              }

              if (isStandaloneTower || frontendTowerIds.includes(configTowerId) || configMatchesByName) {
                matchedConfigs++;
                config.ratePerSqft = ratePerSqft.toString();
                config.baseRatePerSqft = ratePerSqft.toString();
                if (config.configurations && Array.isArray(config.configurations)) {
                   config.configurations = config.configurations.map((c: any) => {
                      const builtUp = c.builtUpArea || Math.round((c.carpetArea || c.area || 0) * 1.2);
                      if (builtUp > 0) {
                         c.basePrice = Math.round(builtUp * ratePerSqft);
                         c.ratePerSqft = ratePerSqft;
                      }
                      return c;
                   });
                }
                changed = true;
              }
              return config;
           });
           console.log(`[Pricing API Debug] Matched ${matchedConfigs} towerUnitConfigs`);
        }

        if (property.details.generatedUnits) {
          let matchedUnits = 0;
          property.details.generatedUnits = property.details.generatedUnits.map((u: any) => {
            const uTowerId = u.towerId?.toString() || u.parentId?.toString() || "";
            // Match if unit's towerId is in frontendTowerIds, OR this is a standalone tower (all units belong here)
            const unitBelongsToTower = isStandaloneTower || frontendTowerIds.includes(uTowerId);
            if (unitBelongsToTower && (!u.status || u.status === "available")) {
              const builtUp = u.builtUpArea || Math.round((u.carpetArea || u.area || 0) * 1.2);
              if (builtUp > 0) {
                u.ratePerSqft = ratePerSqft;
                u.price = Math.round(builtUp * ratePerSqft);
                changed = true;
                embeddedModified++;
                matchedUnits++;
              }
            }
            return u;
          });
          console.log(`[Pricing API Debug] Matched ${matchedUnits} generatedUnits`);
        }

        if (changed) {
          if (property.details.generatedUnits && Array.isArray(property.details.generatedUnits)) {
            const allUnits = property.details.generatedUnits;
            // 1. Property-level
            const validPrices = allUnits.map((u: any) => parseFloat(u.price)).filter((p: any) => p > 0 && !isNaN(p));
            if (validPrices.length > 0) {
                property.details.priceRangeMin = Math.min(...validPrices);
                property.details.priceRangeMax = Math.max(...validPrices);
                property.details.priceLabel = formatPriceLabel(property.details.priceRangeMin, property.details.priceRangeMax);
            }

            // 2. Embedded Towers (Project Hierarchy)
            if (property.details.towers && Array.isArray(property.details.towers)) {
                property.details.towers.forEach((t: any) => {
                    const towerUnits = allUnits.filter((u: any) => u.towerId === t.id || u.towerId === t._dbId || u.towerId === t._id?.toString());
                    const towerPrices = towerUnits.map((u: any) => parseFloat(u.price)).filter((p: any) => p > 0 && !isNaN(p));
                    if (towerPrices.length > 0) {
                        t.priceRangeMin = Math.min(...towerPrices);
                        t.priceRangeMax = Math.max(...towerPrices);
                        t.priceLabel = formatPriceLabel(t.priceRangeMin, t.priceRangeMax);
                    }
                });
            }
            
            // 3. Embedded Projects & Towers (Township Hierarchy)
            if (property.details.projects && Array.isArray(property.details.projects)) {
                property.details.projects.forEach((p: any) => {
                    const projUnits = allUnits.filter((u: any) => u.projectId === p.id || u.projectId === p._dbId || u.projectId === p._id?.toString());
                    const projPrices = projUnits.map((u: any) => parseFloat(u.price)).filter((p: any) => p > 0 && !isNaN(p));
                    if (projPrices.length > 0) {
                        p.priceRangeMin = Math.min(...projPrices);
                        p.priceRangeMax = Math.max(...projPrices);
                        p.priceLabel = formatPriceLabel(p.priceRangeMin, p.priceRangeMax);
                    }
                    if (p.towers && Array.isArray(p.towers)) {
                        p.towers.forEach((t: any) => {
                            const towerUnits = allUnits.filter((u: any) => u.towerId === t.id || u.towerId === t._dbId || u.towerId === t._id?.toString());
                            const towerPrices = towerUnits.map((u: any) => parseFloat(u.price)).filter((p: any) => p > 0 && !isNaN(p));
                            if (towerPrices.length > 0) {
                                t.priceRangeMin = Math.min(...towerPrices);
                                t.priceRangeMax = Math.max(...towerPrices);
                                t.priceLabel = formatPriceLabel(t.priceRangeMin, t.priceRangeMax);
                            }
                        });
                    }
                });
            }
          }

          property.markModified('details');
          await property.save();
        }
      }
    }

    // Trigger pricing aggregation
    if (standaloneModified > 0) {
      aggregateTowerPricing(towerId).catch(err => console.error("Pricing aggregation error:", err));
    }

    return NextResponse.json({ success: true, count: standaloneModified + embeddedModified }, { status: 200 });

  } catch (error: any) {
    console.error("[PATCH /api/towers/[id]/pricing] error:", error);
    return NextResponse.json({ error: "Failed to update tower pricing: " + error.message, stack: error.stack }, { status: 500 });
  }
}

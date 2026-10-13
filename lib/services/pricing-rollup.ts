import { WizardState, GeneratedUnit, TowerData, ProjectData, TownshipData } from "@/lib/builder-types";

// Helper to format price in L / Cr
export function formatCurrencyPrice(p: number): string {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
  return `₹${p.toLocaleString()}`;
}

export function computePriceLabel(min: number, max: number): string {
  if (!min || !max) return "";
  if (min === max) return formatCurrencyPrice(min);
  return `${formatCurrencyPrice(min)} – ${formatCurrencyPrice(max)}`;
}

export interface RollupResult {
  updatedTownship: TownshipData;
  updatedProjects: ProjectData[];
  updatedTowers: TowerData[];
  hasChanged: boolean;
}

/**
 * Pure, high-performance client-side upward pricing and counts rollup.
 * Calculates Unit configs -> Tower -> Project -> Township hierarchy aggregations.
 */
export function calculateUpwardPricingAndCounts(
  state: WizardState,
  generatedUnits: GeneratedUnit[] = []
): RollupResult {
  const towersCount = (state?.towers || []).filter(Boolean).length;
  const unitsCount = (generatedUnits || []).length || 0;
  const projectsCount = (state?.projects || []).filter(Boolean).length;
  const familiesCount = unitsCount;

  // 1. Calculate Tower Prices & Counts from Unit Configs & Generated Units
  const updatedTowers = [...(state.towers || [])].map((tower) => {
    const config = state.towerUnitConfigs?.find((c) => c.towerId === tower.id);
    let configs =
      config?.configurations && config.configurations.length > 0
        ? config.configurations
        : [];

    // Fallback to global template if tower config is empty or has no prices
    if (configs.length === 0 || !configs.some((c: any) => (c.allInclusivePrice || 0) > 0)) {
      configs = state.unitTemplate?.configurations || [];
    }

    const towerUnitsCount = (generatedUnits || []).filter((u) => u.towerId === tower.id).length;
    let newTower = { ...tower };
    if (newTower.totalUnits !== towerUnitsCount) {
      newTower.totalUnits = towerUnitsCount;
    }

    if (configs.length > 0) {
      const prices = configs
        .map((c: any) => c.allInclusivePrice || 0)
        .filter((p: number) => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const autoLabel = computePriceLabel(min, max);

        const shouldUpdateLabel =
          !tower.priceLabel ||
          tower.priceLabel.includes("L") ||
          tower.priceLabel.includes("Cr");

        if (
          tower.priceRangeMin !== min ||
          tower.priceRangeMax !== max ||
          (shouldUpdateLabel && tower.priceLabel !== autoLabel)
        ) {
          newTower.priceRangeMin = min;
          newTower.priceRangeMax = max;
          newTower.priceLabel = shouldUpdateLabel ? autoLabel : tower.priceLabel;
        }
      }
    }
    return newTower;
  });

  // 2. Calculate Project Prices & Counts from Towers
  const updatedProjects = [...(state.projects || [])].map((proj) => {
    const projTowers = updatedTowers.filter((t) => t.projectId === proj.id);

    let newProj = { ...proj };
    const projectTowersCount = projTowers.length;
    const projectUnitsCount = projTowers.reduce(
      (acc, t) => acc + (t.totalUnits || 0),
      0
    );

    if (
      newProj.totalTowers !== projectTowersCount ||
      newProj.totalUnits !== projectUnitsCount
    ) {
      newProj.totalTowers = projectTowersCount;
      newProj.totalUnits = projectUnitsCount;
    }

    if (projTowers.length > 0) {
      const mins = projTowers.map((t) => t.priceRangeMin).filter((p): p is number => !!p && p > 0);
      const maxs = projTowers.map((t) => t.priceRangeMax).filter((p): p is number => !!p && p > 0);
      if (mins.length > 0 && maxs.length > 0) {
        const min = Math.min(...mins);
        const max = Math.max(...maxs);
        const autoLabel = computePriceLabel(min, max);
        const shouldUpdateLabel =
          !proj.priceLabel ||
          proj.priceLabel.includes("L") ||
          proj.priceLabel.includes("Cr");

        if (
          proj.priceRangeMin !== min ||
          proj.priceRangeMax !== max ||
          (shouldUpdateLabel && proj.priceLabel !== autoLabel)
        ) {
          newProj.priceRangeMin = min;
          newProj.priceRangeMax = max;
          newProj.priceLabel = shouldUpdateLabel ? autoLabel : proj.priceLabel;
        }
      }
    }
    return newProj;
  });

  // 3. Calculate Township Prices from Projects
  let updatedTownship = { ...state.township };
  if (updatedProjects.length > 0) {
    const mins = updatedProjects.map((p) => p.priceRangeMin).filter((p): p is number => !!p && p > 0);
    const maxs = updatedProjects.map((p) => p.priceRangeMax).filter((p): p is number => !!p && p > 0);
    if (mins.length > 0 && maxs.length > 0) {
      const min = Math.min(...mins);
      const max = Math.max(...maxs);
      const autoLabel = computePriceLabel(min, max);
      const shouldUpdateLabel =
        !updatedTownship.priceLabel ||
        updatedTownship.priceLabel.includes("L") ||
        updatedTownship.priceLabel.includes("Cr");

      if (
        updatedTownship.priceRangeMin !== min ||
        updatedTownship.priceRangeMax !== max ||
        (shouldUpdateLabel && updatedTownship.priceLabel !== autoLabel)
      ) {
        updatedTownship.priceRangeMin = min;
        updatedTownship.priceRangeMax = max;
        updatedTownship.priceLabel = shouldUpdateLabel
          ? autoLabel
          : updatedTownship.priceLabel;
      }
    }
  }

  // Check if any metadata or counts changed
  const countsChanged =
    state.township.projectCount !== projectsCount ||
    state.township.totalTowers !== towersCount ||
    state.township.totalUnits !== unitsCount ||
    state.township.totalFamilies !== familiesCount;

  const pricingChanged =
    JSON.stringify(state.towers) !== JSON.stringify(updatedTowers) ||
    JSON.stringify(state.projects) !== JSON.stringify(updatedProjects) ||
    state.township.priceRangeMin !== updatedTownship.priceRangeMin ||
    state.township.priceRangeMax !== updatedTownship.priceRangeMax ||
    state.township.priceLabel !== updatedTownship.priceLabel;

  const hasChanged = countsChanged || pricingChanged;

  if (hasChanged) {
    updatedTownship.projectCount = projectsCount;
    updatedTownship.totalTowers = towersCount;
    updatedTownship.totalUnits = unitsCount;
    updatedTownship.totalFamilies = familiesCount;
  }

  return {
    updatedTownship,
    updatedProjects,
    updatedTowers,
    hasChanged,
  };
}

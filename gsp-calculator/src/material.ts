/**
 * A list of known material names by index.
 */
export const PhyMatList: string[] = [
  "ball",
  "rough",
  "fairway",
  "deeprough",
  "concrete",
  "green",
  "earth",
  "dropzone",
  "holecup",
  "holelip",
  "pin",
  "sand",
  "semirough",
  "stone",
  "wood",
  "water",
  "pinestraw",
  "leaves",
  "tee",
  "none",
  "teemarker",
  "Tree",
  "timber",
];

/**
 * Returns the material index for a given material name.
 * If the name includes "pinestraw", returns 16.
 * Otherwise returns the first matching index based on partial name match.
 * Returns 19 if no match found.
 */
export function getMaterialIndex(matName: string): number {
  // Special case check for pinestraw (index 16)
  if (matName.includes(PhyMatList[16])) {
    return 16;
  }

  // Check all other materials
  for (let i = 0; i < PhyMatList.length; i++) {
    if (matName.includes(PhyMatList[i])) {
      return i;
    }
  }

  // Default return value if no match found
  return 19;
}

/**
 * Formats a material name for UI display by:
 * 1. Capitalizing the first letter
 * 2. Splitting compound words with spaces
 * @param materialName The internal material name
 * @returns Formatted name for UI display
 */
export function formatMaterialNameForUI(materialName: string): string {
  // Special cases for compound words
  const specialCases: Record<string, string> = {
    semirough: "Semi Rough",
    deeprough: "Deep Rough",
    pinestraw: "Pine Straw",
    holecup: "Hole Cup",
    holelip: "Hole Lip",
    teemarker: "Tee Marker",
  };

  // Check if it's a special case
  if (materialName in specialCases) {
    return specialCases[materialName];
  }

  // For all other cases, just capitalize the first letter
  return materialName.charAt(0).toUpperCase() + materialName.slice(1);
}

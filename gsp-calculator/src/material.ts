/**
 * A list of known material names by index.
 */
export const PhyMatList: string[] = [
  "TVGball",
  "TVGrough",
  "TVGfairway",
  "TVGdeeprough",
  "TVGconcrete",
  "TVGgreen",
  "TVGearth",
  "TVGdropzone",
  "TVGholecup",
  "TVGholelip",
  "TVGpin",
  "TVGsand",
  "TVGsemirough",
  "TVGstone",
  "TVGwood",
  "TVGwater",
  "TVGpinestraw",
  "TVGleaves",
  "TVGtee",
  "TVGnone",
  "TVGteemarker",
  "TVGTree",
  "TVGtimber",
];

/**
 * Returns the material index for a given material name.
 * If the name includes "TVGpinestraw", returns 16.
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

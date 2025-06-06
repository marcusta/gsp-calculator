const lieVlaToVla = [1, 1, 0.7, 0.6, 0.55, 0.5, 0.45, 0.4, 0.3, 0.2];
const lieVLAtoHLA = [0.5, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.1, 0.1, 0.05];

export function calculateVLAModification(vla: number) {
  const lieIndex = Math.floor(vla / 5);
  return lieVlaToVla[lieIndex];
}

export function calculateHLAModification(vla: number) {
  const lieIndex = Math.floor(vla / 5);
  return lieVLAtoHLA[lieIndex];
}

export function getModifiedLieVla(vla: number, lieDegrees = 0) {
  const vlaModification = calculateVLAModification(vla);
  return vla + vlaModification * lieDegrees;
}

export function getModifiedLieHla(vla: number, lieDegrees = 0) {
  const hlaModification = calculateHLAModification(vla);
  return hlaModification * lieDegrees;
}

export function calculateOfflineDeviation(
  vla: number,
  lieDegrees: number,
  distanceMeters: number
) {
  const baseDeviation = distanceMeters * Math.sin((lieDegrees * Math.PI) / 180);
  const hlaModification = Math.max(
    0.4,
    Math.min(0.95, 0.95 - (vla - 10) * (0.55 / 35))
  );

  return baseDeviation * hlaModification;
  /*const hlaModification = calculateHLAModification(vla);

  // Calculate the effective horizontal angle
  const effectiveAngle = hlaModification * lieDegrees;

  // Use basic trigonometry to calculate the offline deviation
  // tan(angle) = opposite / adjacent
  // Therefore: offline = distance * tan(angle)
  const angleInRadians = (effectiveAngle * Math.PI) / 180;
  const offlineDeviation = distanceMeters * Math.tan(angleInRadians);

  // Round to 1 decimal place
  return Math.round(offlineDeviation * 10) / 10;*/
}

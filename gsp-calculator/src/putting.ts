/******************************************************
 * Speed ↔ Distance Mapping in TypeScript
 ******************************************************/

// 1. Define the interface for our data points
export interface SpeedDistanceData {
  speed: number; // Ball speed in mph
  distance: number; // Total length in meters
}

// 2. Use the data table extracted from the image
const speedDistanceTable: SpeedDistanceData[] = [
  { speed: 2.4, distance: 1.3 },
  { speed: 3.2, distance: 2.1 },
  { speed: 3.6, distance: 2.7 },
  { speed: 3.9, distance: 3.1 },
  { speed: 5.3, distance: 5.1 },
  { speed: 5.5, distance: 5.3 },
  { speed: 6.0, distance: 6.2 },
  { speed: 6.1, distance: 6.3 },
  { speed: 6.7, distance: 7.2 },
  { speed: 7.1, distance: 7.9 },
  { speed: 7.3, distance: 8.4 },
  { speed: 7.5, distance: 8.7 },
  { speed: 7.9, distance: 9.4 },
  { speed: 8.0, distance: 9.6 },
  { speed: 8.5, distance: 10.4 },
  { speed: 8.8, distance: 10.9 },
  { speed: 9.5, distance: 12.3 },
  { speed: 9.8, distance: 12.9 },
  { speed: 10.0, distance: 13.2 },
  { speed: 10.7, distance: 14.6 },
  { speed: 11.1, distance: 15.4 },
  { speed: 11.6, distance: 16.3 },
].sort((a, b) => a.speed - b.speed);

/**
 * Helper function to perform linear interpolation.
 */
function linearInterpolate(
  x: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): number {
  if (Math.abs(x1 - x0) < 1e-9) return y0; // Avoid division by zero
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/**
 * Get approximate distance for a given ball speed.
 */
export function getDistanceForSpeed(speed: number): number {
  const table = speedDistanceTable;

  // Handle values below the table range
  if (speed <= table[0].speed) return table[0].distance;

  // Handle values above the table range using extrapolation
  if (speed >= table[table.length - 1].speed) {
    const lastPoint = table[table.length - 1];
    const secondLastPoint = table[table.length - 2];
    return linearInterpolate(
      speed,
      secondLastPoint.speed,
      secondLastPoint.distance,
      lastPoint.speed,
      lastPoint.distance
    );
  }

  // Find two neighboring data points for interpolation
  for (let i = 0; i < table.length - 1; i++) {
    const curr = table[i];
    const next = table[i + 1];
    if (speed >= curr.speed && speed <= next.speed) {
      return linearInterpolate(
        speed,
        curr.speed,
        curr.distance,
        next.speed,
        next.distance
      );
    }
  }

  // Fallback (should not happen with a proper table)
  return 0;
}

/**
 * Get approximate speed for a given distance.
 */
export function getSpeedForDistance(distance: number): number {
  const table = speedDistanceTable;

  // Handle values below the table range
  if (distance <= table[0].distance) return table[0].speed;

  // Handle values above the table range using extrapolation
  if (distance >= table[table.length - 1].distance) {
    const lastPoint = table[table.length - 1];
    const secondLastPoint = table[table.length - 2];
    return linearInterpolate(
      distance,
      secondLastPoint.distance,
      secondLastPoint.speed,
      lastPoint.distance,
      lastPoint.speed
    );
  }

  // Find two neighboring data points for interpolation
  for (let i = 0; i < table.length - 1; i++) {
    const curr = table[i];
    const next = table[i + 1];
    if (distance >= curr.distance && distance <= next.distance) {
      return linearInterpolate(
        distance,
        curr.distance,
        curr.speed,
        next.distance,
        next.speed
      );
    }
  }

  // Fallback (should not happen with a proper table)
  return 0;
}

/******************************************************
 * Example usage:
 ******************************************************/

// Get distance for a given speed
const speed = 8.5; // Example speed in mph
const distance = getDistanceForSpeed(speed);
console.log(
  `For a ball speed of ${speed} mph, the putt distance is approximately ${distance.toFixed(
    2
  )} meters.`
);

// Get speed for a given distance
const targetDistance = 10.4; // Example distance in meters
const requiredSpeed = getSpeedForDistance(targetDistance);
console.log(
  `To achieve a putt distance of ${targetDistance} meters, the required ball speed is approximately ${requiredSpeed.toFixed(
    2
  )} mph.`
);

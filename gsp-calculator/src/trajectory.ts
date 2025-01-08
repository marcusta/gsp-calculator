import { getCarryDataFromServer } from "./api";
import { getModifiedLieVla } from "./lie-calculation";
import {
  getRoughSpeedPenalty,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
} from "./penalty";

interface ClubRanges {
  spinMin: number;
  spinMax: number;
  speedMin: number;
  speedMax: number;
  vlaMin: number;
  vlaMax: number;
  carryMin: number;
  carryMax: number;
}

// At the top of the file, add export to clubRanges and add club names
export const clubNames = [
  "3 Wood",
  "3 Hybrid",
  "3 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "PW",
  "48°",
  "50°",
  "54°",
  "60°",
];

export const clubRanges: ClubRanges[] = [
  // 3 wood
  {
    spinMin: 2500,
    spinMax: 3300,
    speedMin: 147,
    speedMax: 158,
    vlaMin: 12,
    vlaMax: 15,
    carryMin: 210,
    carryMax: 235,
  },
  // 3 hybrid
  {
    spinMin: 2500,
    spinMax: 3300,
    speedMin: 136,
    speedMax: 145,
    vlaMin: 13,
    vlaMax: 18,
    carryMin: 190,
    carryMax: 210,
  },
  // 3 iron
  {
    spinMin: 3500,
    spinMax: 4500,
    speedMin: 134,
    speedMax: 141,
    vlaMin: 13,
    vlaMax: 18,
    carryMin: 180,
    carryMax: 200,
  },
  // 5 iron
  {
    spinMin: 4300,
    spinMax: 5500,
    speedMin: 129,
    speedMax: 137,
    vlaMin: 15,
    vlaMax: 18,
    carryMin: 170,
    carryMax: 185,
  },
  // 6 iron
  {
    spinMin: 4900,
    spinMax: 6300,
    speedMin: 123,
    speedMax: 133,
    vlaMin: 16,
    vlaMax: 20,
    carryMin: 160,
    carryMax: 180,
  },
  // 7 iron
  {
    spinMin: 5300,
    spinMax: 7000,
    speedMin: 117,
    speedMax: 125,
    vlaMin: 17,
    vlaMax: 21,
    carryMin: 150,
    carryMax: 170,
  },
  // 8 iron
  {
    spinMin: 6300,
    spinMax: 8200,
    speedMin: 111,
    speedMax: 120,
    vlaMin: 18,
    vlaMax: 22,
    carryMin: 135,
    carryMax: 155,
  },
  // 9 iron
  {
    spinMin: 7300,
    spinMax: 9200,
    speedMin: 104,
    speedMax: 112,
    vlaMin: 20,
    vlaMax: 24,
    carryMin: 120,
    carryMax: 135,
  },
  // PW
  {
    spinMin: 8000,
    spinMax: 10500,
    speedMin: 95,
    speedMax: 105,
    vlaMin: 22,
    vlaMax: 26,
    carryMin: 110,
    carryMax: 125,
  },
  // 48 degree
  {
    spinMin: 8500,
    spinMax: 10500,
    speedMin: 91,
    speedMax: 97,
    vlaMin: 24,
    vlaMax: 27,
    carryMin: 100,
    carryMax: 115,
  },
  // 50 degree
  {
    spinMin: 9000,
    spinMax: 11000,
    speedMin: 86,
    speedMax: 94,
    vlaMin: 26,
    vlaMax: 29,
    carryMin: 95,
    carryMax: 110,
  },
  // 54 degree
  {
    spinMin: 9800,
    spinMax: 11500,
    speedMin: 70,
    speedMax: 88,
    vlaMin: 27,
    vlaMax: 31,
    carryMin: 80,
    carryMax: 95,
  },
  // 60 degree
  {
    spinMin: 9800,
    spinMax: 11500,
    speedMin: 30,
    speedMax: 80,
    vlaMin: 27,
    vlaMax: 31,
    carryMin: 30,
    carryMax: 85,
  },
];

interface ShotParameters {
  ballSpeed: number;
  spin: number;
  vla: number;
  estimatedCarry: number;
  rawCarry: number;
}

interface SuggestedShot extends ShotParameters {
  clubIndex: number;
  clubName: string;
  powerPercentage: number;
}

export async function suggestShot(
  targetCarry: number,
  materialIndex: number,
  lieDegrees: number
): Promise<SuggestedShot> {
  // Get speed modifier based on material and lie
  const getSpeedModifier = (speed: number, vla: number) => {
    return getRoughSpeedPenalty(materialIndex, speed, vla);
  };

  // Helper to calculate modified carry range for a club
  const getModifiedCarryRange = (club: ClubRanges) => {
    const avgVLA = (club.vlaMax + club.vlaMin) / 2;
    const minSpeedMod = getSpeedModifier(club.speedMin, avgVLA);
    const maxSpeedMod = getSpeedModifier(club.speedMax, avgVLA);
    return {
      minCarry: club.carryMin * minSpeedMod,
      maxCarry: club.carryMax * maxSpeedMod,
      avgVLA,
    };
  };

  // First find the best club based on carry ranges
  let bestClubIndex = -1;
  let bestScore = Infinity;

  clubRanges.forEach((club, index) => {
    const { minCarry, maxCarry } = getModifiedCarryRange(club);
    // Allow some flexibility in the ranges
    const minAllowed = minCarry * 0.9;
    const maxAllowed = maxCarry * 1.1;

    if (targetCarry >= minAllowed && targetCarry <= maxAllowed) {
      const rangeCenter = (minCarry + maxCarry) / 2;
      const score = Math.abs(targetCarry - rangeCenter);

      if (score < bestScore) {
        bestScore = score;
        bestClubIndex = index;
      }
    }
  });

  if (bestClubIndex === -1) {
    throw new Error("No suitable club found for the target carry distance");
  }

  // Function to try a specific club with carry data
  async function tryClub(clubIndex: number): Promise<SuggestedShot> {
    const club = clubRanges[clubIndex];
    const speedRange = club.speedMax - club.speedMin;
    const avgSpin = (club.spinMax + club.spinMin) / 2;
    const avgVLA = (club.vlaMax + club.vlaMin) / 2;

    // Try 5 different speeds
    const speeds = [
      club.speedMin,
      club.speedMin + speedRange * 0.25,
      club.speedMin + speedRange * 0.5,
      club.speedMin + speedRange * 0.75,
      club.speedMax,
    ];

    const results = await Promise.all(
      speeds.map(async (speed) => {
        const speedPenalty = getRoughSpeedPenalty(materialIndex, speed, avgVLA);
        const spinPenalty = getRoughSpinPenalty(materialIndex, speed, avgVLA);
        const vlaPenalty = getRoughVLAPenalty(materialIndex, speed, avgVLA);

        const adjustedSpeed = speed * speedPenalty;
        const adjustedSpin = avgSpin * spinPenalty;
        const adjustedVLA = avgVLA * vlaPenalty;
        const modifiedVLA = getModifiedLieVla(adjustedVLA, lieDegrees);

        // Get both raw and modified carry distances
        const [rawCarry, modifiedCarry] = await Promise.all([
          getCarryDataFromServer(speed, avgSpin, avgVLA).then(
            (data) => data.Carry
          ),
          getCarryDataFromServer(adjustedSpeed, adjustedSpin, modifiedVLA).then(
            (data) => data.Carry
          ),
        ]);

        return {
          ballSpeed: adjustedSpeed,
          spin: adjustedSpin,
          vla: modifiedVLA,
          estimatedCarry: modifiedCarry,
          rawCarry: rawCarry,
          powerPercentage: ((speed - club.speedMin) / speedRange) * 100,
          clubIndex,
          clubName: clubNames[clubIndex],
        };
      })
    );

    // Find the result closest to target carry
    return results.reduce((best, current) => {
      const currentDiff = Math.abs(current.estimatedCarry - targetCarry);
      const bestDiff = Math.abs(best.estimatedCarry - targetCarry);
      return currentDiff < bestDiff ? current : best;
    });
  }

  // Try the initially selected club
  let bestResult = await tryClub(bestClubIndex);
  const ACCEPTABLE_DIFF = 5; // 5 meters difference is acceptable

  // If initial result isn't close enough, try one adjacent club
  if (Math.abs(bestResult.estimatedCarry - targetCarry) > ACCEPTABLE_DIFF) {
    if (bestResult.estimatedCarry < targetCarry && bestClubIndex > 0) {
      // Try one stronger club
      const strongerResult = await tryClub(bestClubIndex - 1);
      if (
        Math.abs(strongerResult.estimatedCarry - targetCarry) <
        Math.abs(bestResult.estimatedCarry - targetCarry)
      ) {
        bestResult = strongerResult;
      }
    } else if (
      bestResult.estimatedCarry > targetCarry &&
      bestClubIndex < clubRanges.length - 1
    ) {
      // Try one weaker club
      const weakerResult = await tryClub(bestClubIndex + 1);
      if (
        Math.abs(weakerResult.estimatedCarry - targetCarry) <
        Math.abs(bestResult.estimatedCarry - targetCarry)
      ) {
        bestResult = weakerResult;
      }
    }
  }

  return bestResult;
}

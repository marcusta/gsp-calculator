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
  "Driver",
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
  // Driver
  {
    spinMin: 1500,
    spinMax: 3800,
    speedMin: 153,
    speedMax: 170,
    vlaMin: 11,
    vlaMax: 18,
    carryMin: 225,
    carryMax: 275,
  },

  // 3 wood
  {
    spinMin: 1800,
    spinMax: 4200,
    speedMin: 145,
    speedMax: 157,
    vlaMin: 10,
    vlaMax: 15,
    carryMin: 205,
    carryMax: 235,
  },
  // 3 hybrid
  {
    spinMin: 2000,
    spinMax: 4500,
    speedMin: 134,
    speedMax: 149,
    vlaMin: 12,
    vlaMax: 18,
    carryMin: 185,
    carryMax: 215,
  },
  // 3 iron
  {
    spinMin: 3500,
    spinMax: 4800,
    speedMin: 132,
    speedMax: 143,
    vlaMin: 13,
    vlaMax: 18,
    carryMin: 180,
    carryMax: 205,
  },
  // 5 iron
  {
    spinMin: 4000,
    spinMax: 5700,
    speedMin: 128,
    speedMax: 137,
    vlaMin: 15,
    vlaMax: 18,
    carryMin: 165,
    carryMax: 185,
  },
  // 6 iron
  {
    spinMin: 4600,
    spinMax: 6500,
    speedMin: 120,
    speedMax: 133,
    vlaMin: 15,
    vlaMax: 21,
    carryMin: 158,
    carryMax: 175,
  },
  // 7 iron
  {
    spinMin: 5000,
    spinMax: 7500,
    speedMin: 116,
    speedMax: 127,
    vlaMin: 16,
    vlaMax: 22,
    carryMin: 145,
    carryMax: 165,
  },
  // 8 iron
  {
    spinMin: 6300,
    spinMax: 8500,
    speedMin: 110,
    speedMax: 120,
    vlaMin: 17,
    vlaMax: 23,
    carryMin: 130,
    carryMax: 149,
  },
  // 9 iron
  {
    spinMin: 7300,
    spinMax: 9500,
    speedMin: 102,
    speedMax: 114,
    vlaMin: 20,
    vlaMax: 25,
    carryMin: 118,
    carryMax: 138,
  },
  // PW
  {
    spinMin: 8000,
    spinMax: 10500,
    speedMin: 95,
    speedMax: 106,
    vlaMin: 21,
    vlaMax: 27,
    carryMin: 105,
    carryMax: 128,
  },
  // 48 degree
  {
    spinMin: 8500,
    spinMax: 10500,
    speedMin: 93,
    speedMax: 102,
    vlaMin: 23,
    vlaMax: 28,
    carryMin: 98,
    carryMax: 115,
  },
  // 50 degree
  {
    spinMin: 8700,
    spinMax: 11200,
    speedMin: 86,
    speedMax: 94,
    vlaMin: 24,
    vlaMax: 29,
    carryMin: 90,
    carryMax: 110,
  },
  // 54 degree
  {
    spinMin: 9800,
    spinMax: 11500,
    speedMin: 50,
    speedMax: 90,
    vlaMin: 27,
    vlaMax: 31,
    carryMin: 50,
    carryMax: 96,
  },
  // 60 degree
  {
    spinMin: 9800,
    spinMax: 12000,
    speedMin: 30,
    speedMax: 80,
    vlaMin: 27,
    vlaMax: 31,
    carryMin: 30,
    carryMax: 82,
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

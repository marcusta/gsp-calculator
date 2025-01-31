import type { ShotRequest, ShotResult } from "../types";
import type { Club } from "./club-ranges";
import type { TrajectoryService } from "./database.service";
import {
  calculateOfflineDeviation,
  getModifiedLieVla,
} from "./lie-calculation";
import {
  getAltitudeModifier,
  getElevationDistanceModifier,
  getRoughSpeedPenalty,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
} from "./penalty";

export async function calculateTrajectory(
  request: ShotRequest,
  trajectoryService: TrajectoryService
): Promise<ShotResult | null> {
  const speedPenalty = getRoughSpeedPenalty(
    request.material,
    request.speed,
    request.vla
  );
  const spinPenalty = getRoughSpinPenalty(
    request.material,
    request.speed,
    request.vla
  );
  const vlaPenalty = getRoughVLAPenalty(
    request.material,
    request.speed,
    request.vla
  );

  const adjustedSpeed = request.speed * speedPenalty;
  const adjustedSpin = request.spin * spinPenalty;
  const adjustedVLA = request.vla * vlaPenalty;
  const modifiedVLA = getModifiedLieVla(adjustedVLA, request.upDownLie);

  console.log(
    "adjustedSpeed: ",
    adjustedSpeed,
    "adjustedSpin: ",
    adjustedSpin,
    "adjustedVLA: ",
    adjustedVLA,
    "modifiedVLA: ",
    modifiedVLA
  );

  const modifiedCarryData = await trajectoryService.findClosestTrajectory(
    adjustedSpeed,
    adjustedSpin,
    modifiedVLA
  );

  if (!modifiedCarryData?.Carry) {
    return null;
  }

  const environmentModifiedCarryForClub = calculateEnvironmentModifiedCarry(
    modifiedCarryData.Carry,
    request.elevation,
    request.altitude,
    {
      speed: adjustedSpeed,
      spin: adjustedSpin,
      vla: modifiedVLA,
    }
  );

  const offlineDeviation = calculateOfflineDeviation(
    modifiedVLA,
    request.rightLeftLie,
    environmentModifiedCarryForClub
  );

  return {
    ...request,
    adjustedSpeed,
    adjustedSpin,
    adjustedVLA: modifiedVLA,
    carry: modifiedCarryData.Carry,
    envCarry: environmentModifiedCarryForClub,
    offlineDeviation,
    speedPenalty,
    spinPenalty,
    vlaPenalty,
  };
}

export function calculateEnvironmentModifiedCarry(
  carry: number,
  elevation: number,
  altitude: number,
  club?: Club | { spin: number; vla: number; speed: number }
) {
  const { ballSpeed, spin, vla } = getBallDataFromClub(club);
  const altitudeEffect = getAltitudeModifier(altitude);
  const elevationEffect = getElevationDistanceModifier(
    carry,
    elevation,
    ballSpeed,
    spin,
    vla
  );
  const result = (carry + elevationEffect) * altitudeEffect;
  /*console.log(
    "===> environmentModifiedCarry",
    result,
    "input carry",
    carry,
    "elevation",
    elevation,
    "altitude",
    altitude
  );*/
  return result;
}

export function calculateNeededEnvironmentModifiedCarry(
  carry: number,
  elevation: number,
  altitude: number,
  club?: Club | { spin: number; vla: number; speed: number }
) {
  const { ballSpeed, spin, vla } = getBallDataFromClub(club);
  const altitudeEffect = getAltitudeModifier(altitude);
  const elevationEffect = getElevationDistanceModifier(
    carry,
    elevation,
    ballSpeed,
    spin,
    vla
  );
  const result = (carry - elevationEffect) / altitudeEffect;
  return result;
}

function getBallDataFromClub(
  club?: Club | { spin: number; vla: number; speed: number }
) {
  let ballSpeed = 120;
  let spin = 5800;
  let vla = 18;
  if (club && "speedMin" in club) {
    ballSpeed = club.speedMin;
    spin = (club.spinMax + club.spinMin) / 2;
    vla = (club.vlaMax + club.vlaMin) / 2;
  } else if (club) {
    ballSpeed = club.speed;
    spin = club.spin;
    vla = club.vla;
  }
  return { ballSpeed, spin, vla };
}

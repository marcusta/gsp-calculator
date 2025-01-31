export interface ShotRequest {
  material: string;
  speed: number;
  vla: number;
  spin: number;
  upDownLie: number;
  rightLeftLie: number;
  elevation: number;
  altitude: number;
}

export interface ShotResult extends ShotRequest {
  adjustedSpeed: number;
  adjustedSpin: number;
  adjustedVLA: number;
  carry: number;
  envCarry: number;
  offlineDeviation: number;
  speedPenalty: number;
  spinPenalty: number;
  vlaPenalty: number;
}

export interface SuggestShotRequest {
  targetCarry: number;
  material: string;
  upDownLie?: number;
  rightLeftLie?: number;
  elevation?: number;
  altitude?: number;
}

export interface ShotSuggestion {
  ballSpeed: number; // The penalized/modified speed
  rawBallSpeed: number; // The original unmodified speed
  spin: number; // The penalized/modified spin
  rawSpin: number; // The original unmodified spin
  vla: number;
  rawCarry: number; // direct from DB
  estimatedCarry: number;
  clubName: string;
  offlineAimAdjustment: number; // Positive means aim right, negative means aim left (meters)
}

export interface CalculateCarryResponse {
  material: string;
  rawSpin: number;
  rawVLA: number;
  rawSpeed: number;
  carryRaw: number;
  carryModified: number;
  envCarry: number;
  offlineDeviation: number;
  speedModified: number;
  vlaModified: number;
  spinModified: number;
  speedPenalty: number;
  spinPenalty: number;
  vlaPenalty: number;
}

export interface ShotAnalyzerRequest {
  club: string;
  material: string;
  upDownLie: number;
  rightLeftLie: number;
  altitude: number;
  elevation: number;
  increments: number;
}

export interface ShotIncrementResult {
  power: number; // 0-1 representing percentage of max power
  ballSpeed: number;
  spin: number;
  vla: number;
  rawCarry: number;
  estimatedCarry: number;
  envCarry: number;
  offlineDeviation: number;
  modifiers: {
    speedPenalty: number;
    spinPenalty: number;
    vlaPenalty: number;
  };
}

export interface ShotAnalyzerResponse {
  request: ShotAnalyzerRequest;
  results: (ShotIncrementResult | null)[];
}

const urlBase =
  window.location.hostname === "app.swedenindoorgolf.se" ? "/gsp-calc" : "";

export interface CarryData {
  BallSpeed: number;
  VLA: number;
  HLA: number;
  BackSpin: number;
  SpinAxis: number;
  Carry: number;
  Offline: number;
}

export async function getCarryDataFromServer(
  ballSpeed: number,
  spin: number,
  vla: number
): Promise<CarryData> {
  try {
    const response = await fetch(
      `${urlBase}/trajectory?ballSpeed=${ballSpeed}&spin=${spin}&vla=${vla}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    throw error;
  }
}

export interface ShotSuggestion {
  ballSpeed: number;
  rawBallSpeed: number;
  spin: number;
  rawSpin: number;
  vla: number;
  rawCarry: number;
  estimatedCarry: number;
  clubName: string;
  offlineAimAdjustment: number;
}

export async function suggestShot(
  targetCarry: number,
  material: string,
  upDownLie: number = 0,
  rightLeftLie: number = 0,
  elevation: number = 0,
  altitude: number = 0
): Promise<ShotSuggestion> {
  try {
    const response = await fetch(`${urlBase}/suggestShot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetCarry,
        material,
        upDownLie,
        rightLeftLie,
        elevation,
        altitude,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get shot suggestion");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting shot suggestion:", error);
    throw error;
  }
}

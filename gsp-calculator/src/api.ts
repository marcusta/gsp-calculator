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
    console.log("urlBase", urlBase);
    const response = await fetch(
      `${urlBase}/trajectory?ballSpeed=${ballSpeed}&spin=${spin}&vla=${vla}`
    );
    const data = await response.json();
    console.log("data", data);
    return data;
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    throw error;
  }
}

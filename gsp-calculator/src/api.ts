const urlBase = window.location.hostname === "app.swedenindoorgolf.se";

export async function getCarryFromServer(
  ballSpeed: number,
  spin: number,
  vla: number
): Promise<number> {
  try {
    console.log("urlBase", urlBase);
    const response = await fetch(
      `${urlBase}/trajectory?ballSpeed=${ballSpeed}&spin=${spin}&vla=${vla}`
    );
    const data = await response.json();
    console.log("data", data);
    return data.Carry;
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    throw error;
  }
}

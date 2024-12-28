export async function getCarryFromServer(
  ballSpeed: number,
  spin: number,
  vla: number
): Promise<number> {
  try {
    let url = "/trajectory";
    if (window.location.hostname === "app.swedenindoorgolf.se") {
      url = "https://app.swedenindoorgolf.se/gsp-calc/trajectory";
    }
    const response = await fetch(
      `${url}?ballSpeed=${ballSpeed}&spin=${spin}&vla=${vla}`
    );
    const data = await response.json();
    console.log("data", data);
    return data.Carry;
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    throw error;
  }
}

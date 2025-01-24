// club-ranges.ts

export interface Club {
  name: string;
  spinMin: number;
  spinMax: number;
  speedMin: number;
  speedMax: number;
  vlaMin: number;
  vlaMax: number;
  carryMin: number;
  carryMax: number;
}

// Define the valid ranges for all clubs
export const clubs: Club[] = [
  // Driver
  {
    name: "Driver",
    spinMin: 1400,
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
    name: "3 Wood",
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
    name: "3 Hybrid",
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
    name: "3 Iron",
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
    name: "5 Iron",
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
    name: "6 Iron",
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
    name: "7 Iron",
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
    name: "8 Iron",
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
    name: "9 Iron",
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
    name: "PW",
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
    name: "48°",
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
    name: "50°",
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
    name: "54°",
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
    name: "60°",
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

export interface ClubRanges {
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
export const clubRanges: ClubRanges[] = [
  // 3 wood
  {
    name: "3 wood",
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
    name: "3 hybrid",
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
    name: "3 iron",
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
    name: "5 iron",
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
    name: "6 iron",
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
    name: "7 iron",
    spinMin: 5500,
    spinMax: 7200,
    speedMin: 117,
    speedMax: 125,
    vlaMin: 17,
    vlaMax: 21,
    carryMin: 150,
    carryMax: 170,
  },
  // 8 iron
  {
    name: "8 iron",
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
    name: "9 iron",
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
    name: "PW",
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
    name: "48 degree",
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
    name: "50 degree",
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
    name: "54 degree",
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
    name: "60 degree",
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

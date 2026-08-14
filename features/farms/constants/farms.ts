import type { Farm } from "@/features/farms/types/farms";

export const FARMS: Farm[] = [
  {
    id: "my-farm",
    name: "My Farm",
    location: "Qazvin, Iran",
    area: 40000,
    type: "farm",
    crop: {
      id: "forage-corn",
      name: "Forage Corn",
    },
    irrigationType: "Flood Irrigation",
  },
  {
    id: "my-garden",
    name: "My Garden",
    location: "Qazvin, Iran",
    area: 5000,
    type: "garden",
    plants: [
      {
        id: "walnut-1",
        name: "Improved Late-Blooming Persian Walnut",
        quantity: 500,
        spacing: 6,
        age: 3,
      },
    ],
  },
];
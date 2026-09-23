export const HELP_TOPICS = [
  {
    id: "start",
    name: "Getting started",
    questions: [
      [
        "How do I get started?",
        "Add a farm or garden, choose its location, then open its overview for weather and irrigation.",
        "/farms",
        "My Farms",
      ],
      [
        "What can I do from Home?",
        "Choose your active farm to see its weather, saved irrigation schedule and crop details together.",
        "/dashboard",
        "Home",
      ],
    ],
  },
  {
    id: "farms",
    name: "Farms",
    questions: [
      [
        "How do I edit a farm or garden?",
        "Open your farm, choose Edit, then save your changes. You can update its name, location, area, crop and irrigation method.",
        "/farms",
        "My Farms",
      ],
      [
        "Why can't I add another farm?",
        "Your plan sets the number of farms you can add. Check your subscription for the current limit.",
        "/account/subscription",
        "View subscription",
      ],
    ],
  },
  {
    id: "irrigation",
    name: "Irrigation",
    questions: [
      [
        "How do I plan irrigation?",
        "Open Irrigation from your farm and choose a date, start time and duration. Your saved schedule stays with that farm.",
        "/farms",
        "Choose a farm",
      ],
      [
        "Does a saved schedule control my pump?",
        "A saved schedule is a plan. Equipment control needs a connected controller; saving a schedule does not confirm that watering has started.",
        "/farms",
        "My Farms",
      ],
    ],
  },
  {
    id: "weather",
    name: "Weather",
    questions: [
      [
        "Why is my farm's weather unavailable?",
        "Check your internet connection and the farm's map location, then try refreshing the forecast.",
        "/farms",
        "My Farms",
      ],
      [
        "Why can rainfall readings differ?",
        "A current reading and a daily forecast cover different periods. Open the forecast details to check the time and source of each reading.",
        "/farms",
        "Choose a farm",
      ],
    ],
  },
  {
    id: "account",
    name: "Account & Security",
    questions: [
      [
        "How can I protect my account?",
        "Open Security to add an authenticator and an independent backup. Keep the backup on a separate device.",
        "/account/security",
        "Security",
      ],
      [
        "Where can I see my plan and usage?",
        "Subscription shows your plan and its limits. Usage shows your saved farms and schedules.",
        "/account/usage",
        "Usage",
      ],
    ],
  },
  {
    id: "settings",
    name: "Language & Settings",
    questions: [
      [
        "Where are my language and units?",
        "Preferences lets you choose language, region, measurement units, calendar and appearance.",
        "/settings",
        "Settings",
      ],
      [
        "Can I use the Persian calendar?",
        "Choose the Persian calendar in Settings. Dates change for display; your saved irrigation schedule stays the same.",
        "/settings",
        "Settings",
      ],
    ],
  },
] as const;

export const SUPPORT_CATEGORIES = [
  "Account",
  "Farm management",
  "Weather",
  "Irrigation",
  "Sensors",
  "Billing / Subscription",
  "Bug report",
  "Other",
] as const;

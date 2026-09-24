export type FarmVisualInput = {
  type: "farm" | "garden";
  crop?: { name?: string | null } | null;
};

export type CropVisual = {
  key: string;
  image: string;
  backgroundSize: string;
  backgroundPosition: string;
};

const ASSET = {
  headerFarm: "/dashboard/backgrounds/header-farm.webp",
  headerGarden: "/dashboard/backgrounds/header-garden.webp",
  gardenTree: "/dashboard/backgrounds/garden-tree.webp",
  cropSprite: "/dashboard/backgrounds/crop-sprite.webp",
} as const;

const SPRITE_COLUMNS = 7;
const SPRITE_ROWS = 11;

const CROP_CELLS: Readonly<Record<string, readonly [number, number]>> = {
  wheat: [0, 0],
  corn: [1, 0],
  cabbage: [2, 0],
  generic: [3, 0],
  barley: [4, 0],
  rice: [5, 0],
  sorghum: [6, 0],

  millet: [0, 1],
  chickpea: [1, 1],
  lentil: [2, 1],
  bean: [3, 1],
  "pinto-bean": [4, 1],
  "red-bean": [5, 1],
  "white-bean": [6, 1],

  "mung-bean": [0, 2],
  "fava-bean": [1, 2],
  "green-pea": [2, 2],
  soybean: [3, 2],
  canola: [4, 2],
  sunflower: [5, 2],
  sesame: [6, 2],

  safflower: [0, 3],
  cotton: [1, 3],
  "sugar-beet": [2, 3],
  sugarcane: [3, 3],
  potato: [4, 3],
  onion: [5, 3],
  garlic: [6, 3],

  tomato: [0, 4],
  cucumber: [1, 4],
  "field-vegetable": [2, 4],
  eggplant: [3, 4],
  pepper: [4, 4],
  "bell-pepper": [5, 4],

  cauliflower: [0, 5],
  broccoli: [1, 5],
  lettuce: [2, 5],
  spinach: [3, 5],
  carrot: [4, 5],
  turnip: [5, 5],
  radish: [6, 5],

  beet: [0, 6],
  celery: [1, 6],
  okra: [2, 6],
  pumpkin: [3, 6],
  zucchini: [4, 6],
  watermelon: [5, 6],
  cantaloupe: [6, 6],

  melon: [0, 7],
  alfalfa: [1, 7],
  clover: [2, 7],
  sainfoin: [3, 7],
  vetch: [4, 7],
  saffron: [5, 7],
  cumin: [6, 7],

  coriander: [0, 8],
  fennel: [1, 8],
  dill: [2, 8],
  fenugreek: [3, 8],
  "black-seed": [4, 8],
  parsley: [6, 8],

  basil: [0, 9],
  mint: [1, 9],
  thyme: [2, 9],
  savory: [3, 9],
  chamomile: [4, 9],
  "damask-rose": [5, 9],
  tobacco: [6, 9],

  tea: [0, 10],
};

function normalizeCropName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("fa")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإٱآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ی")
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[‌‏‎]/g, " ")
    .replace(/[۰-۹0-9]/g, " ")
    .replace(/[^a-z؀-ۿ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CROP_ALIASES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["bell-pepper", ["فلفل دلمه ای", "فلفل دلمه", "bell pepper", "sweet pepper", "capsicum"]],
  ["green-pea", ["نخود فرنگی", "نخود سبز", "green pea", "garden pea"]],
  ["pinto-bean", ["لوبیا چیتی", "pinto bean"]],
  ["red-bean", ["لوبیا قرمز", "kidney bean", "red bean"]],
  ["white-bean", ["لوبیا سفید", "white bean", "navy bean"]],
  ["mung-bean", ["ماش سبز", "ماش", "mung bean"]],
  ["fava-bean", ["باقلا", "باقالی", "fava bean", "broad bean"]],
  ["sugar-beet", ["چغندر قند", "چغندرقند", "sugar beet"]],
  ["damask-rose", ["گل محمدی", "گل سرخ", "damask rose"]],
  ["black-seed", ["سیاه دانه", "سیاهدانه", "black seed", "nigella"]],
  ["watermelon", ["هندوانه", "watermelon"]],
  ["cantaloupe", ["طالبی", "cantaloupe"]],
  ["cauliflower", ["گل کلم", "گلکلم", "cauliflower"]],
  ["broccoli", ["بروکلی", "broccoli"]],
  ["cabbage", ["کلم پیچ", "کلم سفید", "کلم قرمز", "کلم", "cabbage"]],
  ["sunflower", ["آفتابگردان", "آفتاب گردان", "sunflower"]],
  ["safflower", ["گلرنگ", "safflower"]],
  ["soybean", ["سویا", "soybean", "soya"]],
  ["canola", ["کلزا", "کانولا", "rapeseed", "canola"]],
  ["sesame", ["کنجد", "sesame"]],
  ["cotton", ["پنبه", "cotton"]],
  ["chickpea", ["نخود", "chickpea", "garbanzo"]],
  ["lentil", ["عدس", "lentil"]],
  ["bean", ["لوبیا", "bean"]],
  ["wheat", ["گندم دوروم", "گندم نان", "گندم", "wheat", "durum"]],
  ["barley", ["جو دوسر", "یولاف", "جو", "barley", "oat", "oats", "چاودار", "rye"]],
  ["rice", ["برنج", "شلتوک", "rice", "paddy"]],
  ["corn", ["ذرت علوفه ای", "ذرت شیرین", "بلال", "ذرت", "corn", "maize"]],
  ["sorghum", ["سورگوم", "sorghum"]],
  ["millet", ["ارزن", "millet"]],
  ["potato", ["سیب زمینی", "potato"]],
  ["onion", ["پیاز", "onion"]],
  ["garlic", ["سیر", "garlic"]],
  ["tomato", ["گوجه فرنگی", "گوجه", "tomato"]],
  ["cucumber", ["خیار", "cucumber"]],
  ["eggplant", ["بادمجان", "eggplant", "aubergine"]],
  ["pepper", ["فلفل تند", "فلفل سبز", "فلفل قرمز", "فلفل", "pepper", "chili", "chilli"]],
  ["lettuce", ["کاهو", "lettuce"]],
  ["spinach", ["اسفناج", "spinach"]],
  ["carrot", ["هویج", "carrot"]],
  ["turnip", ["شلغم", "turnip"]],
  ["radish", ["تربچه", "ترب سفید", "ترب", "radish"]],
  ["beet", ["چغندر", "beetroot", "beet"]],
  ["celery", ["کرفس", "celery"]],
  ["okra", ["بامیه", "okra"]],
  ["pumpkin", ["کدو حلوایی", "کدو تنبل", "pumpkin"]],
  ["zucchini", ["کدو سبز", "کدو", "zucchini", "courgette", "squash"]],
  ["melon", ["خربزه", "ملون", "melon", "muskmelon"]],
  ["alfalfa", ["یونجه", "alfalfa", "lucerne"]],
  ["clover", ["شبدر", "clover"]],
  ["sainfoin", ["اسپرس", "sainfoin"]],
  ["vetch", ["ماشک", "vetch"]],
  ["saffron", ["زعفران", "saffron"]],
  ["cumin", ["زیره سبز", "زیره سیاه", "زیره", "cumin", "caraway"]],
  ["coriander", ["گشنیز", "coriander", "cilantro"]],
  ["fennel", ["رازیانه", "انیسون", "بادیان", "fennel", "anise"]],
  ["dill", ["شوید", "dill"]],
  ["fenugreek", ["شنبلیله", "fenugreek"]],
  ["parsley", ["جعفری", "parsley"]],
  ["basil", ["ریحان", "basil"]],
  ["mint", ["نعناع", "نعنا", "mint"]],
  ["thyme", ["آویشن", "thyme"]],
  ["savory", ["مرزه", "savory"]],
  ["chamomile", ["بابونه", "chamomile"]],
  ["tobacco", ["تنباکو", "توتون", "tobacco"]],
  ["tea", ["چای", "tea"]],
  ["field-vegetable", ["سبزی خوردن", "سبزیجات", "سبزی", "تره", "leek", "vegetable"]],
  ["sugarcane", ["نیشکر", "sugar cane", "sugarcane"]],
];

export function resolveCropVisualKey(rawName?: string | null) {
  const name = normalizeCropName(rawName ?? "");
  if (!name) return "generic";

  for (const [key, aliases] of CROP_ALIASES) {
    if (aliases.some((alias) => name.includes(normalizeCropName(alias)))) {
      return key;
    }
  }

  return "generic";
}

function spritePosition([column, row]: readonly [number, number]) {
  const x = (column / (SPRITE_COLUMNS - 1)) * 100;
  const y = (row / (SPRITE_ROWS - 1)) * 100;
  return `${x}% ${y}%`;
}

export function resolveCropVisual(farm: FarmVisualInput): CropVisual {
  if (farm.type === "garden") {
    return {
      key: "garden-tree",
      image: ASSET.gardenTree,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  const key = resolveCropVisualKey(farm.crop?.name);
  const cell = CROP_CELLS[key] ?? CROP_CELLS.generic;

  return {
    key,
    image: ASSET.cropSprite,
    backgroundSize: `${SPRITE_COLUMNS * 100}% ${SPRITE_ROWS * 100}%`,
    backgroundPosition: spritePosition(cell),
  };
}

export function resolveFarmHeaderBackground(type: FarmVisualInput["type"]) {
  return type === "garden" ? ASSET.headerGarden : ASSET.headerFarm;
}

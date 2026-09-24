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

const PHOTO = {
  wheat:
    "https://images.unsplash.com/photo-1564584812691-eab58e10a7f0?auto=format&fit=crop&w=2200&q=84",
  corn:
    "https://images.unsplash.com/photo-1615129825073-c47c67bdec5b?auto=format&fit=crop&w=2200&q=84",
  leafy:
    "https://images.unsplash.com/photo-1768113802440-cb8b176a591c?auto=format&fit=crop&w=2200&q=84",
  field:
    "https://images.unsplash.com/photo-1725972281307-bc3da61c7575?auto=format&fit=crop&w=2200&q=84",
  orchard:
    "https://images.unsplash.com/photo-1635778528589-b5df9e10d7cd?auto=format&fit=crop&w=2200&q=84",
  tree:
    "https://images.unsplash.com/photo-1606911287703-31c506e2d96f?auto=format&fit=crop&w=1800&q=84",
} as const;

const ASSET = {
  headerFarm: PHOTO.wheat,
  headerGarden: PHOTO.orchard,
  gardenTree: PHOTO.tree,
} as const;

// Keep the crop resolver exhaustive, but group visually similar crops onto
// high-resolution photographic surfaces instead of magnifying a tiny sprite.
const CEREAL_KEYS = new Set([
  "wheat",
  "barley",
  "rice",
  "sorghum",
  "millet",
]);

const LEAFY_KEYS = new Set([
  "cabbage",
  "cauliflower",
  "broccoli",
  "lettuce",
  "spinach",
  "celery",
  "field-vegetable",
]);

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

function resolveCropPhoto(key: string) {
  if (key === "corn") return PHOTO.corn;
  if (CEREAL_KEYS.has(key)) return PHOTO.wheat;
  if (LEAFY_KEYS.has(key)) return PHOTO.leafy;
  return PHOTO.field;
}

export function resolveCropVisual(farm: FarmVisualInput): CropVisual {
  if (farm.type === "garden") {
    return {
      key: "garden-tree",
      image: ASSET.gardenTree,
      backgroundSize: "cover",
      backgroundPosition: "center 48%",
    };
  }

  const key = resolveCropVisualKey(farm.crop?.name);

  return {
    key,
    image: resolveCropPhoto(key),
    backgroundSize: "cover",
    backgroundPosition: key === "corn" ? "center 54%" : "center",
  };
}

export function resolveFarmHeaderBackground(type: FarmVisualInput["type"]) {
  return type === "garden" ? ASSET.headerGarden : ASSET.headerFarm;
}

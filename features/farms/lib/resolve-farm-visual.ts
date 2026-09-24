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

const IMAGE = {
  headerFarm:
    "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=1800&q=82",
  headerGarden:
    "https://images.unsplash.com/photo-1779188683829-9a700d14accd?auto=format&fit=crop&w=1800&q=82",
  gardenTree:
    "https://images.unsplash.com/photo-1759799944634-52786cc84c70?auto=format&fit=crop&w=1600&q=82",
  wheat:
    "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=1600&q=80",
  corn:
    "https://images.unsplash.com/photo-1695453200514-d9ee3c003772?auto=format&fit=crop&w=1600&q=80",
  cabbage:
    "https://images.unsplash.com/photo-1769441071410-40528743a0ac?auto=format&fit=crop&w=1600&q=80",
  rowCrop:
    "https://images.unsplash.com/photo-1647510173529-d91eb50bab8e?auto=format&fit=crop&w=1600&q=80",
} as const;

function normalizeCropName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("fa")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإٱآ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ی")
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[‌‏‎]/g, " ")
    .replace(/[۰-۹0-9]/g, " ")
    .replace(/[^a-z؀-ۿ]+/g, " ")
    .replace(/s+/g, " ")
    .trim();
}

const CROP_ALIASES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["bell-pepper", ["فلفل دلمه ای", "فلفل دلمه", "bell pepper", "sweet pepper", "capsicum"]],
  ["green-pea", ["نخود فرنگی", "نخود سبز", "green pea", "garden pea", "pea"]],
  ["pinto-bean", ["لوبیا چیتی", "pinto bean"]],
  ["red-bean", ["لوبیا قرمز", "kidney bean", "red bean"]],
  ["white-bean", ["لوبیا سفید", "white bean", "navy bean"]],
  ["mung-bean", ["ماش سبز", "ماش", "mung bean"]],
  ["fava-bean", ["باقلا", "باقالی", "fava bean", "broad bean"]],
  ["sugar-beet", ["چغندر قند", "چغندرقند", "sugar beet"]],
  ["sugarcane", ["نیشکر", "sugar cane", "sugarcane"]],
  ["damask-rose", ["گل محمدی", "گل سرخ", "damask rose", "rose"]],
  ["black-seed", ["سیاه دانه", "سیاهدانه", "black seed", "nigella"]],
  ["watermelon", ["هندوانه", "watermelon"]],
  ["cantaloupe", ["طالبی", "cantaloupe"]],
  ["melon", ["خربزه", "ملون", "melon", "muskmelon"]],
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
  ["soybean", ["بادام زمینی", "peanut", "groundnut"]],
  ["wheat", ["گندم دوروم", "گندم نان", "گندم", "wheat", "durum"]],
  ["barley", ["جو دوسر", "یولاف", "جو", "barley", "oat", "oats", "rye", "چاودار"]],
  ["rice", ["برنج", "شلتوک", "rice", "paddy"]],
  ["corn", ["ذرت علوفه ای", "ذرت شیرین", "بلال", "ذرت", "corn", "maize"]],
  ["sorghum", ["سورگوم", "sorghum"]],
  ["millet", ["ارزن", "کینوا", "millet", "quinoa"]],
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
  ["alfalfa", ["یونجه", "alfalfa", "lucerne"]],
  ["clover", ["شبدر", "اسپرس", "sainfoin", "clover"]],
  ["vetch", ["ماشک", "vetch"]],
  ["asparagus", ["مارچوبه", "asparagus"]],
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
  ["field-vegetable", ["سبزی", "سبزیجات", "تره", "تره فرنگی", "leek", "vegetable"]],
];

function stableCropLock(key: string) {
  let hash = 17;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) % 9973;
  return hash + 1;
}

export function resolveCropVisualKey(rawName?: string | null) {
  const name = normalizeCropName(rawName ?? "");
  if (!name) return "generic";

  for (const [key, aliases] of CROP_ALIASES) {
    if (aliases.some((alias) => name.includes(normalizeCropName(alias)))) return key;
  }

  return "generic";
}

function cropImageForKey(key: string) {
  if (key === "wheat") return IMAGE.wheat;
  if (key === "corn") return IMAGE.corn;
  if (key === "cabbage") return IMAGE.cabbage;
  if (key === "generic") return IMAGE.rowCrop;

  const query = key.replaceAll("-", ",");
  return `https://loremflickr.com/1200/800/${query},field,agriculture?lock=${stableCropLock(key)}`;
}

export function resolveCropVisual(farm: FarmVisualInput): CropVisual {
  if (farm.type === "garden") {
    return {
      key: "garden-tree",
      image: IMAGE.gardenTree,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  const key = resolveCropVisualKey(farm.crop?.name);
  return {
    key,
    image: cropImageForKey(key),
    backgroundSize: "cover",
    backgroundPosition: key === "corn" ? "center 56%" : "center",
  };
}

export function resolveFarmHeaderBackground(type: FarmVisualInput["type"]) {
  return type === "garden" ? IMAGE.headerGarden : IMAGE.headerFarm;
}

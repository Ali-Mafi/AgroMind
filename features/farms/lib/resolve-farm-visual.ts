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
  wheat: "/images/dashboard/crop-wheat.webp",
  corn: "/images/dashboard/crop-corn.webp",
  rice: "/images/dashboard/crop-rice.webp",
  tomato: "/images/dashboard/crop-tomato.webp",
  field: "/images/dashboard/crop-field.webp",
} as const;

const ASSET = {
  headerFarm: "/images/dashboard/header-field-v2.webp",
  headerGarden: "/images/dashboard/header-orchard-v2.webp",
  gardenTree: "/images/dashboard/garden-tree-v2.webp",
} as const;

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
  // A neutral cultivated landscape is more honest than assigning another species.
  // These are decorative illustrations, not photographs of the user's property.
  return Object.hasOwn(PHOTO, key) ? PHOTO[key as keyof typeof PHOTO] : PHOTO.field;
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

  return {
    key,
    image: resolveCropPhoto(key),
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function resolveFarmHeaderBackground(type: FarmVisualInput["type"]) {
  return type === "garden" ? ASSET.headerGarden : ASSET.headerFarm;
}

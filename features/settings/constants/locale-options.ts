import type { Calendar, Country, Language } from "../types/preferences";

export const COUNTRY_CODES: Country[] = (`AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CD CG CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW`).split(" ");

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  ["en","English"],["fa","فارسی"],["ar","العربية"],["es","Español"],["fr","Français"],["de","Deutsch"],["pt","Português"],["ru","Русский"],["zh","中文"],["hi","हिन्दी"],["bn","বাংলা"],["ur","اردو"],["id","Bahasa Indonesia"],["tr","Türkçe"],["ja","日本語"],["ko","한국어"],["vi","Tiếng Việt"],["th","ไทย"],["it","Italiano"],["nl","Nederlands"],["pl","Polski"],["uk","Українська"],["ro","Română"],["el","Ελληνικά"],["cs","Čeština"],["sv","Svenska"],["da","Dansk"],["no","Norsk"],["fi","Suomi"],["hu","Magyar"],["he","עברית"],["ps","پښتو"],["ku","Kurdî"],["az","Azərbaycanca"],["uz","Oʻzbekcha"],["kk","Қазақша"],["tg","Тоҷикӣ"],["tk","Türkmençe"],["hy","Հայերեն"],["ka","ქართული"],["ne","नेपाली"],["si","සිංහල"],["ta","தமிழ்"],["te","తెలుగు"],["ml","മലയാളം"],["mr","मराठी"],["gu","ગુજરાતી"],["pa","ਪੰਜਾਬੀ"],["sw","Kiswahili"],["am","አማርኛ"],["ha","Hausa"],["yo","Yorùbá"],["ig","Igbo"],["zu","isiZulu"],["af","Afrikaans"],["sq","Shqip"],["bg","Български"],["hr","Hrvatski"],["sr","Српски"],["sk","Slovenčina"],["sl","Slovenščina"],["lt","Lietuvių"],["lv","Latviešu"],["et","Eesti"],["is","Íslenska"],["ga","Gaeilge"],["mt","Malti"],["ms","Bahasa Melayu"],["fil","Filipino"],["km","ខ្មែរ"],["lo","ລາວ"],["my","မြန်မာ"],["mn","Монгол"],["mk","Македонски"],["bs","Bosanski"],["ca","Català"],["eu","Euskara"],["gl","Galego"]
].map(([value,label]) => ({ value, label }));

export const CALENDAR_OPTIONS: { value: Calendar; label: string }[] = [
  ["gregory","Gregorian"],["persian","Persian"],["islamic","Islamic"],["islamic-umalqura","Islamic (Umm al-Qura)"],["hebrew","Hebrew"],["buddhist","Buddhist"],["chinese","Chinese"],["japanese","Japanese"],["indian","Indian national"],["ethiopic","Ethiopic"],["coptic","Coptic"],["dangi","Dangi"],["roc","Minguo"],["iso8601","ISO 8601"]
].map(([value,label]) => ({ value, label }));

export const RTL_LANGUAGES = new Set(["ar", "dv", "fa", "he", "ku", "ps", "ur"]);

export function countryDisplayName(country: Country, locale: string) {
  try { return new Intl.DisplayNames([locale], { type: "region" }).of(country) ?? country; }
  catch { return country; }
}

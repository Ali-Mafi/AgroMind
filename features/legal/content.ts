export type LegalKind = "privacy" | "cookies" | "terms";
export type LegalLanguage = "en" | "fa";
type Doc = { heading: string; intro: string; sections: ReadonlyArray<readonly [string, readonly string[]]> };
export const LEGAL_UPDATED = "2026-10-25";
export const LEGAL_SUPPORT_EMAIL = "support@agromind.ir";
export const LEGAL_NAV = [
  ["privacy", "/privacy", "Privacy Policy", "حریم خصوصی"],
  ["cookies", "/cookies", "Cookie Policy", "سیاست کوکی‌ها"],
  ["terms", "/terms", "Terms of Service", "شرایط استفاده"],
] as const;
export const LEGAL_UI = {
  en: { home: "Back to AgroMind", updated: "Last updated", nav: "Legal information", note: "This notice describes the current product. Before commercial launch, the registered operator and data-retention details require verification.", signup: ["By registering, review our", "and", ". How we store information is explained in our", "."] },
  fa: { home: "بازگشت به AgroMind", updated: "آخرین به‌روزرسانی", nav: "اطلاعات حقوقی", note: "این اطلاعیه وضعیت فعلی محصول را شرح می‌دهد. هویت رسمی ارائه‌دهنده و مدت نگهداری داده پیش از عرضه تجاری باید تأیید شوند.", signup: ["پیش از ثبت‌نام،", "و", "را بخوانید. نحوه ذخیره اطلاعات در", "آمده است."] },
} as const;
export const LEGAL_DOCUMENTS: Record<LegalKind, Record<LegalLanguage, Doc>> = {
privacy: {
  en: { heading: "Privacy Policy", intro: "Your data, location, account and privacy rights in AgroMind.", sections: [
    ["Who we are", [
      "AgroMind is the product operated at agromind.ir. Its registered legal operator and official address have not yet been confirmed for publication. For privacy or operator-identity inquiries, contact support@agromind.ir. Do not infer a particular registered company or location from the brand name."
    ]],
    ["Information we collect", [
      "Account creation and security involve your email address, username, password authentication, verification factors, and optionally name, country, language and time zone. Account recovery and team invitations may require email addresses.",
      "Farm and garden features store records you enter, including farm names, land area, crops, plants, selected or precise location coordinates, irrigation schedules and information shared with authorized team members."
    ]],
    ["Purposes and services", [
      "We use this data to run sign-in and account protection, manage your farms and authorized collaborators, display maps and forecasts, and respond to help requests. Technical request data may be processed for security, debugging and service operation.",
      "When requested, farm coordinates are sent from the application server to weather providers WeatherAPI or Open-Meteo. Optional reverse geocoding may send device or chosen coordinates to BigDataCloud or OpenStreetMap Nominatim. Your device only provides its current location after browser permission; manual location entry is an alternative."
    ]],
    ["Third-party processing", [
      "The current stack uses Vercel for hosting, Supabase for account and farm data, and Resend for account emails. Username login may load Cloudflare Turnstile; selecting Google sign-in involves Google. The landing page embeds an image from the eNAMAD trust service.",
      "Providers receive the information relevant to each request and may process it in different regions. This notice does not claim that data stays in one country or that external services cannot use their own technical identifiers."
    ]],
    ["Storage, retention and choices", [
      "Essential authentication and pending-signup cookies maintain login and email verification. Display preferences are kept in a first-party cookie and device storage; the service worker caches public offline files, not private authenticated farm responses. Read the Cookie Policy for specifics.",
      "An automated whole-account deletion feature and a complete published retention schedule have not been verified. Clearing browser storage does not delete cloud farm records. To request access, correction or deletion, email support@agromind.ir from your registered address. We may verify your identity and handle the request under applicable law and technical backup requirements; no specific deletion deadline is promised."
    ]],
    ["Security and updates", [
      "Authenticated pages, access controls and multi-factor features reduce risk, but no software can promise perfect security. Do not disclose passwords or verification codes. This farm-management product is not designed specifically for children.",
      "We have not identified an independent optional advertising or analytics-cookie system in the audited application code. Material new data uses, advertising or optional analytics require review of this notice and any applicable consent controls before deployment."
    ]]
  ] },
  fa: { heading: "سیاست حفظ حریم خصوصی", intro: "داده‌های حساب، موقعیت مزرعه و راه‌های کنترل اطلاعات شما در AgroMind.", sections: [
    ["ارائه‌دهنده خدمات", [
      "AgroMind نام محصول فعال در agromind.ir است. نام حقوقی و نشانی رسمی مسئول خدمات هنوز برای انتشار تأیید نشده است. برای سؤال درباره هویت ارائه‌دهنده یا حریم خصوصی به support@agromind.ir پیام بدهید. از نام برند نباید هویت ثبتی مشخصی برداشت شود."
    ]],
    ["چه اطلاعاتی می‌گیریم", [
      "حساب کاربری شامل ایمیل، نام کاربری، اطلاعات ورود و تأیید هویت و در صورت تمایل نام، کشور، زبان و منطقه زمانی است. بازیابی حساب و دعوت اعضای تیم ممکن است از نشانی ایمیل استفاده کند.",
      "بخش مزرعه و باغ، اطلاعاتی که وارد می‌کنید مانند نام زمین، مساحت، محصول، گیاه، موقعیت انتخابی یا مختصات دقیق، برنامه آبیاری و داده‌های به‌اشتراک‌گذاشته‌شده با اعضای مجاز تیم را نگه می‌دارد."
    ]],
    ["چرا و چگونه پردازش می‌شوند", [
      "از اطلاعات برای ورود و امنیت حساب، مدیریت مزرعه، تعیین سطح دسترسی تیم، نمایش نقشه و هواشناسی و رسیدگی به درخواست‌های پشتیبانی استفاده می‌کنیم. داده فنی درخواست‌ها ممکن است برای نگهداری، عیب‌یابی و امنیت پردازش شود.",
      "مختصات مورددرخواست از طریق سرور برای پیش‌بینی هوا به WeatherAPI یا Open-Meteo فرستاده می‌شود. برای یافتن نام مکان ممکن است BigDataCloud یا OpenStreetMap Nominatim استفاده شود. موقعیت فعلی دستگاه فقط پس از مجوز مرورگر دریافت می‌شود و می‌توانید مکان را دستی وارد کنید."
    ]],
    ["سرویس‌های بیرونی", [
      "برنامه برای میزبانی از Vercel، برای داده و ورود از Supabase و برای ایمیل حساب از Resend استفاده می‌کند. ورود با نام کاربری ممکن است Cloudflare Turnstile را بارگیری کند؛ ورود گوگل در صورت انتخاب شما از Google استفاده می‌کند و در صفحه لندینگ تصویر نشان اینماد از سرویس بیرونی دریافت می‌شود.",
      "این ارائه‌دهندگان می‌توانند داده لازم را در مناطق مختلف پردازش کنند. ادعا نمی‌کنیم همه اطلاعات در یک کشور باقی می‌ماند یا سرویس‌های بیرونی هیچ شناسه فنی ندارند."
    ]],
    ["کوکی، نگهداری و حقوق کاربر", [
      "کوکی نشست و ثبت‌نام ناتمام برای ورود و تأیید ایمیل، کوکی نمایش و حافظه دستگاه برای ترجیحات و کش آفلاین برای فایل‌های عمومی استفاده می‌شوند؛ داده خصوصی مزرعه عمداً در کش PWA ذخیره نمی‌شود. جزئیات در سیاست کوکی‌ها آمده است.",
      "فرایند خودکار حذف کامل حساب و زمان‌بندی قطعی نگهداری هر نوع داده هنوز تأیید نشده است. پاک‌کردن کوکی داده مزرعه را از پایگاه ابری حذف نمی‌کند. برای دریافت، اصلاح یا درخواست حذف اطلاعات از ایمیل حساب به support@agromind.ir بنویسید. ممکن است احراز هویت و بررسی الزامات قانونی و چرخه پشتیبان لازم باشد؛ در این متن زمان قطعی حذف وعده نمی‌دهیم."
    ]],
    ["امنیت و تغییرات", [
      "ورود محافظت‌شده، کنترل دسترسی و امکانات احراز هویت دومرحله‌ای برای کاهش خطر به کار می‌روند ولی امنیت صددرصد تضمین‌شده نیست. رمز و کد تأیید را به کسی ندهید. این محصول ویژه کودکان طراحی نشده است.",
      "در کد فعلی سامانه مستقل کوکی تبلیغاتی یا آنالیتیکس اختیاری پیدا نکردیم. قبل از هر تغییر مهم در استفاده از داده، تبلیغات یا تحلیل اختیاری، این متن و کنترل‌های رضایت لازم باید بازبینی شوند."
    ]]
  ] },
},
cookies: {
  en: { heading: "Cookie & Storage Policy", intro: "What stays in your browser and what cookies currently do.", sections: [
    ["Essential cookies and sign-in", [
      "Supabase session cookies (often starting with sb-) enable authenticated access. In production the server config uses HttpOnly, Secure and SameSite=Lax. Exact provider-generated names and expiration may change. Blocking these cookies prevents account features from working.",
      "agromind_pending_email, agromind_pending_username, agromind_pending_verification and agromind_pending_next are temporary HttpOnly cookies used to continue email signup; their configured maximum age is 24 hours."
    ]],
    ["Display preferences", [
      "agromind_display_v1 is a first-party cookie containing display settings such as language, region and unit preferences, not passwords or private farm records. Its maximum age is 365 days and it uses SameSite=Lax and Secure when HTTPS is used."
    ]],
    ["Other device storage", [
      "LocalStorage can keep preferences, selected appearance and Agro Runner scores. CacheStorage allows the PWA to show the public offline game without a network connection. Authenticated pages, farm data responses and APIs are deliberately excluded from the offline cache."
    ]],
    ["Third parties and optional tracking", [
      "Cloudflare Turnstile may load for username sign-in; the eNAMAD badge is loaded from an external host on the landing page. Providers may use their own technical storage or identifiers according to their policies.",
      "An independent optional advertising/analytics tracker was not found in the application code during this review. We do not present an inactive accept-all banner. Any future nonessential tracking must wait for a working consent/denial/withdrawal choice wherever required by applicable law."
    ]],
    ["Managing storage", [
      "You can change display settings in AgroMind or clear site data in your browser. Clearing session cookies signs you out; clearing CacheStorage may remove offline functionality until reconnected. Removing device storage does not erase your cloud account or farm information. For questions contact support@agromind.ir."
    ]]
  ] },
  fa: { heading: "سیاست کوکی‌ها و حافظه مرورگر", intro: "کوکی‌ها و داده‌هایی که AgroMind در دستگاه شما نگه می‌دارد.", sections: [
    ["کوکی‌های ضروری حساب", [
      "کوکی‌های ورود Supabase (معمولاً با پیشوند sb-) برای دسترسی امن به حساب به کار می‌روند. تنظیمات محیط عملیاتی شامل HttpOnly و Secure و SameSite=Lax است. نام و زمان انقضای دقیق ممکن است با سرویس احراز هویت تغییر کند. مسدودکردن این کوکی‌ها ورود را مختل می‌کند.",
      "کوکی‌های agromind_pending_email و agromind_pending_username و agromind_pending_verification و agromind_pending_next به ادامه تأیید ایمیل هنگام ثبت‌نام کمک می‌کنند. این کوکی‌ها HttpOnly هستند و حداکثر ۲۴ ساعت اعتبار دارند."
    ]],
    ["کوکی تنظیمات نمایش", [
      "کوکی agromind_display_v1 برای زبان، منطقه و واحدهای اندازه‌گیری استفاده می‌شود و شامل رمز یا اطلاعات خصوصی مزرعه نیست. حداکثر عمر آن ۳۶۵ روز است و از SameSite=Lax و در اتصال HTTPS از Secure استفاده می‌کند."
    ]],
    ["حافظه‌های دیگر دستگاه", [
      "LocalStorage می‌تواند تنظیمات، تم و امتیاز Agro Runner را حفظ کند. CacheStorage نسخه آفلاین و فایل‌های عمومی PWA را نگه می‌دارد. صفحات حساب، پاسخ API و داده خصوصی مزرعه عمداً در کش آفلاین ذخیره نمی‌شوند."
    ]],
    ["سرویس‌های بیرونی و ردیابی اختیاری", [
      "Cloudflare Turnstile ممکن است هنگام ورود با نام کاربری بارگیری شود و تصویر اینماد از دامنه بیرونی در لندینگ نمایش داده می‌شود. این سرویس‌ها می‌توانند طبق سیاست خود از شناسه‌های فنی استفاده کنند.",
      "در بررسی فعلی کد، سامانه مستقل تبلیغات یا آنالیتیکس اختیاری پیدا نشده؛ بنابراین بنر نمایشی «قبول همه» نمی‌گذاریم. اگر بعدها ردیابی غیرضروری اضافه شود، پیش از فعال‌سازی و طبق قوانین قابل‌اعمال، انتخاب واقعی پذیرش، رد و پس‌گرفتن رضایت لازم است."
    ]],
    ["کنترل حافظه", [
      "از تنظیمات برنامه یا مرورگر می‌توانید ترجیحات و داده سایت را پاک کنید. پاک‌کردن نشست باعث خروج از حساب و حذف کش ممکن است باعث عدم دسترسی آفلاین تا اتصال مجدد شود. پاک‌کردن حافظه مرورگر، داده ابری حساب یا مزرعه را حذف نمی‌کند. پرسش‌ها: support@agromind.ir."
    ]]
  ] },
},
terms: {
  en: { heading: "Terms of Service", intro: "The current features, responsible use, and important limits.", sections: [
    ["Scope and availability", [
      "AgroMind currently offers farm and garden records, forecasts, irrigation scheduling, account security, display preferences and team collaboration. Experimental or coming-soon services (including live AI chat and sensor integration) should not be treated as active features.",
      "Maintenance, internet connectivity and external providers can affect availability. We do not promise uninterrupted service or zero defects."
    ]],
    ["Accounts and records", [
      "Keep account details accurate and authentication factors private. Manage your invited team members carefully. You are responsible for information you submit and must not submit someone else's confidential records without authorization.",
      "AgroMind uses submitted records to deliver the product; it does not claim ownership of your underlying farm data. Software, interface and branding remain subject to their applicable intellectual property rights."
    ]],
    ["Prohibited activity", [
      "Do not bypass authentication, RLS or access permissions, collect other users' data, disrupt the service, impersonate others, or use AgroMind for unlawful activity. Protective restrictions may apply to abusive behavior in accordance with applicable law."
    ]],
    ["Agricultural risk and forecasts", [
      "Weather forecasts, map data and irrigation suggestions can be delayed, incomplete or wrong; none guarantees crop yield, water availability or financial results. Check local conditions, equipment safety and specialist guidance before making critical decisions. Do not rely only on the app in situations affecting safety or property."
    ]],
    ["Payments and external providers", [
      "Subscription/entitlement code exists, but end-to-end commercial checkout has not been verified. No subscription price, renewal, billing, refund or cancellation commitment is invented here. Actual paid terms must be provided before paid purchase is enabled.",
      "Google, weather, maps and other service providers may have their own terms."
    ]],
    ["Privacy, changes and contact", [
      "Our Privacy and Cookie policies describe current data use. Material changes should be disclosed as applicable law requires. To contact the service, email support@agromind.ir.",
      "Registered legal-operator, governing-law and dispute-resolution details remain subject to confirmation before formal commercial launch. These terms do not exclude rights that applicable laws make non-waivable."
    ]]
  ] },
  fa: { heading: "شرایط استفاده از AgroMind", intro: "قواعد استفاده از خدمات فعلی و محدودیت‌های مهم.", sections: [
    ["خدمات و دسترس‌پذیری", [
      "AgroMind در وضعیت فعلی مدیریت مزرعه و باغ، نمایش هواشناسی، برنامه آبیاری، امنیت حساب، تنظیمات و همکاری تیمی را ارائه می‌دهد. امکانات آزمایشی یا «به‌زودی» مانند چت واقعی هوش مصنوعی و اتصال حسگرها را نباید فعال فرض کرد.",
      "نگهداری فنی، قطع اینترنت و اختلال سرویس بیرونی ممکن است دسترسی را محدود کند. سرویس کاملاً بدون خطا یا بی‌وقفه تضمین نمی‌شود."
    ]],
    ["حساب و داده", [
      "اطلاعات درست وارد کنید، رمز و کدها را محرمانه نگه دارید و سطح دسترسی اعضای دعوت‌شده را مدیریت کنید. مسئول اطلاعات ثبت‌شده هستید و نباید داده محرمانه دیگران را بدون اجازه وارد کنید.",
      "AgroMind از سوابق شما برای ارائه خدمات استفاده می‌کند و مالکیت داده اصلی مزرعه را ادعا نمی‌کند. حقوق نرم‌افزار، رابط کاربری و برند تابع قوانین مرتبط است."
    ]],
    ["استفاده غیرمجاز", [
      "دورزدن ورود، امنیت و سطح دسترسی، جمع‌آوری اطلاعات دیگران، اختلال در برنامه، جعل هویت یا فعالیت غیرقانونی ممنوع است. برای مقابله با سوءاستفاده می‌توان مطابق قوانین قابل‌اعمال محدودیت حفاظتی ایجاد کرد."
    ]],
    ["خطرات کشاورزی", [
      "پیش‌بینی هوا، داده نقشه و پیشنهاد آبیاری ممکن است با تأخیر، ناقص یا اشتباه باشد و تضمین محصول، تأمین آب یا سود نیست. پیش از اقدام مهم، شرایط محلی، ایمنی تجهیزات و نظر متخصص را بررسی کنید و فقط به برنامه تکیه نکنید."
    ]],
    ["پرداخت و خدمات بیرونی", [
      "زیرساخت پلن در کد وجود دارد اما کارکرد کامل خرید پولی هنوز تأیید نشده است. بنابراین قیمت، تمدید، لغو یا بازپرداخت ساختگی در این متن درج نشده؛ شرایط واقعی فروش باید پیش از فعال‌شدن پرداخت منتشر شود.",
      "سرویس‌های گوگل، هواشناسی، نقشه و دیگر ارائه‌دهندگان ممکن است شرایط جداگانه داشته باشند."
    ]],
    ["حریم خصوصی، تغییرات و ارتباط", [
      "سیاست حریم خصوصی و کوکی‌ها نحوه پردازش فعلی داده را توضیح می‌دهند. تغییر مهم باید در حدود قوانین قابل‌اعمال اطلاع‌رسانی شود. راه ارتباط: support@agromind.ir.",
      "هویت حقوقی ثبت‌شده، قانون حاکم و روش حل اختلاف هنوز باید پیش از عرضه تجاری نهایی شوند. این متن حقوق قانونیِ غیرقابل‌اسقاط کاربران را حذف نمی‌کند."
    ]]
  ] }
}
};

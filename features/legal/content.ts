// Public draft notices: based on source audit, not a compliance certification.
export type LegalKind = "privacy" | "cookies" | "terms";
export type LegalLanguage = "en" | "fa";
export const REVIEWED_ON = "2026-10-25";
export const LINKS = [["privacy","/privacy","Privacy Policy","حریم خصوصی"],["cookies","/cookies","Cookie Policy","سیاست کوکی‌ها"],["terms","/terms","Terms and Conditions","شرایط و مقررات"]] as const;
export const NOTICES = {
  "privacy": {
    "en": {
      "title": "Privacy Policy",
      "description": "This policy explains how AgroMind collects, uses, retains and safeguards information associated with its services.",
      "items": [
        [
          "Service provider and contact details",
          "AgroMind provides farm and garden management services through agromind.ir. The operating entity's final registered name and legal address have not yet been verified for publication and will be added once confirmed. Questions concerning the service provider or personal information may be directed to support@agromind.ir."
        ],
        [
          "Information processed",
          "Account administration involves email addresses, usernames, authentication and account-security information, together with profile details supplied voluntarily, such as name, language, country and time zone. Farm and garden records may include plot names, land area, crops, plants, geographical locations or precise coordinates, and irrigation plans and history. Collaboration features may also process invitees' email addresses and the access privileges assigned to members."
        ],
        [
          "Purposes and location information",
          "Information is processed to provide the service, administer accounts and farms, enforce access permissions, display weather information, respond to support inquiries and maintain operational security. Access to a device's current location requires permission through the browser; a location may instead be selected manually. When a weather or place-name lookup is requested, the selected coordinates may be transmitted to the relevant service provider for that purpose."
        ],
        [
          "External service providers",
          "AgroMind relies on Vercel for hosting, Supabase for authentication and cloud storage, and Resend for account-related email. Forecast data may be provided by WeatherAPI or Open-Meteo, and reverse geocoding by BigDataCloud or OpenStreetMap Nominatim. Cloudflare Turnstile may be used to reduce abuse during certain sign-in methods; selecting Google sign-in involves Google's services. An external eNAMAD trust badge is also displayed. Processing by these providers may take place outside the user's country of residence."
        ],
        [
          "Cookies, retention and user requests",
          "Session continuity, registration verification, display preferences and public offline features rely on cookies or other browser storage as described in the Cookie Policy. Removing the application or clearing browser data does not delete cloud-stored account records. A final retention schedule and an automated full-account deletion procedure have not yet been published. Requests to access, correct or delete personal information may be submitted from the registered email address to support@agromind.ir; identity verification, legal obligations and backup constraints may affect the handling of a request."
        ],
        [
          "Information security and amendments",
          "Authentication measures, access controls and available multi-factor features are used to reduce unauthorized access, although complete protection against every risk cannot be guaranteed. Account holders should keep their passwords and verification codes confidential. AgroMind is not specifically intended for children. Material changes to information processing, including the introduction of new analytics or advertising services, will be reflected in a revised notice."
        ]
      ]
    },
    "fa": {
      "title": "سیاست حفظ حریم خصوصی",
      "description": "این سند حدود گردآوری، استفاده، نگهداری و حفاظت از اطلاعات کاربران در خدمات AgroMind را بیان می‌کند.",
      "items": [
        [
          "معرفی خدمت و راه‌های ارتباطی",
          "AgroMind سامانه‌ای برای مدیریت اطلاعات مزرعه و باغ است که از طریق نشانی agromind.ir ارائه می‌شود. مشخصات ثبتی نهایی و نشانی قانونی شخص حقوقیِ بهره‌بردار هنوز برای درج در این سند تأیید نشده است و پس از احراز و نهایی‌شدن، اعلام خواهد شد. مکاتبات مربوط به حریم خصوصی و هویت ارائه‌دهنده از طریق support@agromind.ir قابل پیگیری است."
        ],
        [
          "اطلاعات مورد پردازش",
          "برای ایجاد و اداره حساب کاربری، اطلاعاتی نظیر نشانی ایمیل، نام کاربری، داده‌های مربوط به احراز هویت و امنیت حساب و مشخصات اختیاری پروفایل، از جمله نام، زبان، کشور و منطقه زمانی، پردازش می‌شود. اطلاعاتی که کاربر درباره مزارع و باغ‌های خود ثبت می‌کند نیز ممکن است شامل نام زمین، مساحت، نوع محصول، گیاهان، موقعیت جغرافیایی یا مختصات دقیق و سوابق و برنامه‌های آبیاری باشد. در قابلیت‌های اشتراک‌گذاری و همکاری گروهی، نشانی ایمیل دعوت‌شدگان و سطح دسترسی اعضا نیز مورد استفاده قرار می‌گیرد."
        ],
        [
          "اهداف پردازش و اطلاعات مکانی",
          "اطلاعات مذکور صرفاً در چارچوب ارائه امکانات سامانه، مدیریت حساب و مزارع، اعمال مجوزهای دسترسی، نمایش داده‌های هواشناسی، پشتیبانی و حفظ امنیت خدمات پردازش می‌شود. دریافت موقعیت فعلی دستگاه منوط به اجازه کاربر در مرورگر است و امکان انتخاب دستی مکان نیز وجود دارد. در صورت درخواست پیش‌بینی هوا یا شناسایی نام محل، مختصات انتخاب‌شده ممکن است برای انجام همان درخواست به ارائه‌دهندگان مربوط ارسال شود."
        ],
        [
          "ارائه‌دهندگان خدمات و انتقال اطلاعات",
          "زیرساخت میزبانی AgroMind بر خدمات Vercel، سامانه احراز هویت و ذخیره‌سازی اطلاعات بر Supabase و ارسال ایمیل‌های مربوط به حساب بر Resend متکی است. اطلاعات هواشناسی ممکن است از WeatherAPI و Open-Meteo و خدمات تبدیل مختصات به نام مکان از BigDataCloud یا OpenStreetMap Nominatim دریافت شود. در بعضی شیوه‌های ورود، Cloudflare Turnstile برای کنترل سوءاستفاده به کار می‌رود و انتخاب ورود با حساب Google مستلزم ارتباط با خدمات آن شرکت است. همچنین نشان اعتماد الکترونیکی از منبع خارجی بارگذاری می‌شود. پردازش اطلاعات توسط این ارائه‌دهندگان، با توجه به محل استقرار آن‌ها، ممکن است در خارج از کشور محل اقامت کاربر صورت گیرد."
        ],
        [
          "کوکی‌ها، مدت نگهداری و حقوق کاربران",
          "برای استمرار نشست کاربری، تکمیل فرایند ثبت‌نام، حفظ تنظیمات نمایش و ارائه امکانات عمومی آفلاین، از کوکی‌ها و سایر شیوه‌های ذخیره‌سازی مرورگر استفاده می‌شود که شرح آن در «سیاست کوکی‌ها» آمده است. حذف برنامه از دستگاه یا پاک‌کردن کوکی‌ها به‌منزله حذف اطلاعات ذخیره‌شده در حساب ابری نیست. در حال حاضر، جدول نهایی مدت نگهداری هر گروه از اطلاعات و سازوکار خودکار حذف کامل حساب منتشر نشده است. کاربران می‌توانند درخواست دسترسی، اصلاح یا حذف اطلاعات خود را از طریق ایمیل ثبت‌شده به support@agromind.ir ارسال کنند. رسیدگی به درخواست، حسب مورد، مستلزم احراز هویت و رعایت الزامات قانونی و محدودیت‌های فنی مربوط به نسخه‌های پشتیبان خواهد بود."
        ],
        [
          "امنیت اطلاعات و اصلاح سیاست",
          "برای کاهش مخاطرات دسترسی غیرمجاز، از سازوکارهای احراز هویت، کنترل سطح دسترسی و امکانات امنیتی چندمرحله‌ای استفاده می‌شود؛ بااین‌حال، مصونیت مطلق هیچ سامانه برخطی قابل تضمین نیست. مسئولیت حفظ محرمانگی رمز عبور و کدهای تأیید نیز بر عهده دارنده حساب است. AgroMind به‌طور خاص برای استفاده کودکان طراحی نشده است. در صورت تغییر اساسی در شیوه پردازش اطلاعات یا به‌کارگیری ابزارهای جدید تحلیل و تبلیغات، مفاد این سیاست متناسب با تغییرات بازنگری خواهد شد."
        ]
      ]
    }
  },
  "cookies": {
    "en": {
      "title": "Cookie and Browser Storage Policy",
      "description": "This notice describes the cookies, local storage and offline assets used by AgroMind, together with available user controls.",
      "items": [
        [
          "Purpose and necessity of storage",
          "AgroMind uses authentication cookies, temporary registration information and user-selected display preferences to deliver its principal services. The currently reviewed application code does not contain a separate optional advertising or behavioral analytics tracker; accordingly, no advertising-cookie consent interface is presented at this stage. Any future non-essential tracking will be subject to applicable requirements, including a genuine ability to grant, refuse and withdraw consent where required."
        ],
        [
          "Authentication and registration cookies",
          "Supabase maintains authenticated sessions through cookies whose names commonly begin with sb-. Current server-side settings include HttpOnly and SameSite=Lax, together with Secure in production; names and expiry periods may vary according to the provider's configuration. The temporary cookies agromind_pending_email, agromind_pending_username, agromind_pending_verification and agromind_pending_next preserve registration and email-verification state for approximately 24 hours."
        ],
        [
          "Preferences and offline resources",
          "The agromind_display_v1 cookie stores selected language, region and measurement preferences for up to 365 days; it is not intended to contain passwords or private farm records. Certain appearance preferences and game scores may also be retained in localStorage. The PWA uses CacheStorage for public assets required for offline access and deliberately excludes private account responses and farm records from that cache."
        ],
        [
          "External services and user controls",
          "Certain operations involve external services, including Cloudflare Turnstile for sign-in protection and the eNAMAD badge displayed on the website. Those providers may use technical identifiers in accordance with their own policies. Display choices may be changed within AgroMind, and browser site data may be cleared through device or browser settings. Clearing session cookies signs the user out, and clearing offline files may temporarily disable offline features; neither action deletes cloud-held account data. Inquiries may be addressed to support@agromind.ir."
        ]
      ]
    },
    "fa": {
      "title": "سیاست استفاده از کوکی‌ها",
      "description": "در این سند، نوع اطلاعات ذخیره‌شده در مرورگر، هدف استفاده و روش مدیریت آن تشریح شده است.",
      "items": [
        [
          "ماهیت و ضرورت ذخیره‌سازی",
          "AgroMind برای ارائه خدمات اصلی خود، از کوکی‌های ورود، اطلاعات موقت تکمیل ثبت‌نام و تنظیمات منتخب کاربر استفاده می‌کند. بررسی کد نسخه فعلی، استفاده از سامانه مستقل ردیابی تبلیغاتی یا تحلیل رفتاری اختیاری را نشان نداده است؛ ازاین‌رو، در وضعیت کنونی سازوکار پذیرش کوکی‌های تبلیغاتی عرضه نشده است. چنانچه در آینده ابزار غیرضروریِ ردیابی به سامانه افزوده شود، فعال‌سازی آن تابع الزامات قانونی قابل‌اعمال و، در موارد لازم، امکان انتخاب، رد و لغو رضایت کاربر خواهد بود."
        ],
        [
          "کوکی‌های احراز هویت و ثبت‌نام",
          "برای حفظ نشست ورود، Supabase از کوکی‌هایی استفاده می‌کند که نام آن‌ها عموماً با پیشوند sb- آغاز می‌شود. تنظیمات فعلیِ کوکی‌های سمت سرور شامل HttpOnly و SameSite=Lax و در محیط عملیاتی Secure است؛ نام دقیق و زمان انقضا می‌تواند بر اساس تنظیمات ارائه‌دهنده تغییر کند. افزون بر این، کوکی‌های agromind_pending_email، agromind_pending_username، agromind_pending_verification و agromind_pending_next برای نگهداری موقت وضعیت ثبت‌نام و تأیید ایمیل ایجاد می‌شوند و اعتبار آن‌ها حدود ۲۴ ساعت است."
        ],
        [
          "تنظیمات کاربر و فایل‌های آفلاین",
          "کوکی agromind_display_v1 حداکثر به‌مدت ۳۶۵ روز تنظیمات زبان، منطقه و واحدهای اندازه‌گیری را نگهداری می‌کند و برای ذخیره رمز عبور یا سوابق خصوصی مزرعه در نظر گرفته نشده است. برخی تنظیمات ظاهری و امتیاز بازی ممکن است در localStorage دستگاه باقی بمانند. همچنین CacheStorage برای نگهداری فایل‌های عمومی موردنیاز نسخه آفلاین PWA به کار می‌رود و پاسخ‌های خصوصی حساب و داده‌های مزرعه عمداً در این کش ذخیره نمی‌شوند."
        ],
        [
          "خدمات بیرونی و اختیار کاربر",
          "در جریان بعضی عملیات، از جمله کنترل امنیت ورود با Cloudflare Turnstile یا نمایش نشان eNAMAD، ارتباط با ارائه‌دهندگان بیرونی برقرار می‌شود. این سرویس‌ها ممکن است مطابق سیاست‌های خود از شناسه‌های فنی استفاده کنند. کاربر می‌تواند تنظیمات نمایش را در AgroMind تغییر دهد یا داده‌های ذخیره‌شده سایت را از بخش تنظیمات مرورگر پاک کند. حذف کوکی‌های نشست موجب خروج از حساب و پاک‌سازی فایل‌های آفلاین ممکن است موجب عدم دسترسی موقت به امکانات بدون اینترنت شود؛ هیچ‌یک به‌خودی‌خود موجب حذف داده‌های حساب در فضای ابری نخواهد شد. برای دریافت توضیحات بیشتر می‌توان با support@agromind.ir مکاتبه کرد."
        ]
      ]
    }
  },
  "terms": {
    "en": {
      "title": "Terms and Conditions of Service",
      "description": "Use of AgroMind is subject to these terms and the applicable policies published through the service.",
      "items": [
        [
          "Nature and scope of services",
          "AgroMind provides software facilities for recording and managing farm and garden information, reviewing weather data, planning irrigation, maintaining accounts and collaborating with authorized members. Features described as experimental or under development, including certain artificial-intelligence, sensor and commercial payment functions, do not constitute an available service commitment until formally launched. Technical maintenance, connectivity failures or external providers may interrupt access; continuous availability is not guaranteed."
        ],
        [
          "Account responsibilities and permissible use",
          "Users are responsible for providing accurate account information, protecting passwords and authentication factors, and assigning access to other individuals only within their authority. Accessing another person's account or farm without permission, circumventing safeguards, disrupting the service or submitting third-party confidential information without authorization is prohibited. Users retain their rights in the underlying agricultural records they provide; rights in the software, interface and brand remain governed by applicable intellectual-property law."
        ],
        [
          "Reliance on agricultural information",
          "Weather information, maps, proposed irrigation schedules and other material are intended to inform and support decisions. They may be incomplete, delayed or inaccurate because of source limitations, local conditions or technical incidents. No particular weather event, water supply, crop yield or financial outcome is guaranteed. Decisions affecting personal safety, equipment, property or crops should be based on actual local conditions and appropriate professional advice where necessary."
        ],
        [
          "Paid services and revisions",
          "The existence of subscription and entitlement infrastructure does not, of itself, establish that paid services are currently offered. Pricing, validity periods, renewal, cancellation and any refund arrangements will apply only when paid services are introduced and their actual terms are published. AgroMind may revise its functions and these conditions in accordance with applicable law, with appropriate notice of material changes."
        ],
        [
          "Legal particulars and correspondence",
          "The Privacy Policy and Cookie Policy supplement these terms by describing the handling of user information. The final registered operating entity, governing law and dispute-resolution arrangements remain to be confirmed and published before a formal commercial launch. Service and policy correspondence may be sent to support@agromind.ir. Nothing in these terms excludes statutory rights that cannot lawfully be waived."
        ]
      ]
    },
    "fa": {
      "title": "شرایط و مقررات استفاده از خدمات",
      "description": "استفاده از خدمات AgroMind تابع ضوابط این سند و سایر سیاست‌های اعلام‌شده در سامانه است.",
      "items": [
        [
          "موضوع و دامنه خدمات",
          "AgroMind بستری نرم‌افزاری برای ثبت و مدیریت اطلاعات مزرعه و باغ، مشاهده داده‌های هواشناسی، برنامه‌ریزی آبیاری، تنظیم حساب کاربری و همکاری میان اعضای مجاز فراهم می‌آورد. قابلیت‌هایی که به‌عنوان آزمایشی یا در دست توسعه معرفی شده‌اند، از جمله بعضی امکانات هوش مصنوعی، اتصال حسگرها و پرداخت تجاری، تا زمان اعلام رسمی جزو خدمات فعال و تعهدشده محسوب نمی‌شوند. دسترسی به سامانه ممکن است به دلایل فنی، اختلال ارتباطات یا عملکرد ارائه‌دهندگان بیرونی با وقفه روبه‌رو شود و استمرار بی‌وقفه خدمات تضمین نمی‌گردد."
        ],
        [
          "تعهدات کاربر و حدود استفاده مجاز",
          "کاربر موظف است اطلاعات موردنیاز حساب را به‌درستی ثبت کند، از نام کاربری، رمز عبور و عوامل احراز هویت خود محافظت نماید و در اعطای دسترسی به اشخاص دیگر، حدود اختیارات آنان را رعایت کند. ثبت یا پردازش اطلاعات متعلق به اشخاص ثالث بدون مجوز، دسترسی غیرمجاز به حساب یا مزارع دیگران، تلاش برای عبور از تدابیر امنیتی و هرگونه استفاده خلاف قوانین یا مخل عملکرد سامانه مجاز نیست. حقوق کاربر نسبت به محتوای اصلی سوابق کشاورزی او محفوظ است و حقوق مربوط به نرم‌افزار، طراحی و نشان تجاری تابع مقررات مالکیت فکری خواهد بود."
        ],
        [
          "اعتبار اطلاعات و مسئولیت تصمیم‌های کشاورزی",
          "داده‌های هواشناسی، نقشه‌ها، زمان‌بندی پیشنهادی آبیاری و سایر اطلاعات ارائه‌شده، ماهیت اطلاع‌رسانی و پشتیبانی از تصمیم دارند و ممکن است به‌دلیل محدودیت منابع داده، شرایط محلی یا اختلال فنی، ناقص یا نادقیق باشند. این اطلاعات به‌منزله تضمین وقوع وضعیت جوی معین، میزان آب در دسترس، عملکرد محصول یا نتیجه اقتصادی نیستند. اتخاذ تصمیم‌های مؤثر بر ایمنی اشخاص، تجهیزات، اموال و محصولات باید با بررسی شرایط واقعی محل و در صورت ضرورت، مشورت متخصص صورت گیرد."
        ],
        [
          "خدمات پولی و تغییر شرایط",
          "وجود زیرساخت فنی اشتراک و سطوح دسترسی در نرم‌افزار، به‌تنهایی به معنی آغاز ارائه خدمات پولی نیست. شرایط قیمت‌گذاری، دوره اعتبار، تمدید، لغو اشتراک و بازپرداخت احتمالی صرفاً در صورت فعال‌شدن فروش و اعلام رسمی ضوابط مربوط، قابل استناد خواهد بود. ارائه‌دهنده می‌تواند در حدود قوانین قابل‌اعمال، ویژگی‌ها و مقررات سامانه را بازنگری کند و تغییرات مؤثر را به شیوه مناسب اطلاع‌رسانی نماید."
        ],
        [
          "اطلاعات حقوقی و راه ارتباط",
          "سیاست حفظ حریم خصوصی و سیاست کوکی‌ها مکمل این سند در بیان شیوه استفاده از اطلاعات کاربران هستند. مشخصات نهایی شخصیت حقوقی بهره‌بردار، قانون حاکم و سازوکار رسیدگی به اختلافات، پیش از عرضه رسمی خدمات تجاری و پس از تأیید اطلاعات مربوط درج خواهند شد. مکاتبات مرتبط با خدمات و این مقررات از طریق support@agromind.ir پذیرفته می‌شود. هیچ‌یک از مفاد این سند به‌منزله سلب حقوقی نیست که مطابق قوانین لازم‌الاجرا قابل اسقاط نیستند."
        ]
      ]
    }
  }
} as const;

export const LEGAL_UI = {
  en: {
    back: "Return to AgroMind",
    navigation: "Legal and privacy documents",
    close: "Close",
    reviewed: "Last revised",
    support: "Inquiries",
    signupStart: "Before registering, please read the ",
    signupSeparator: ", ",
    signupAnd: " and ",
    signupEnd: " policies.",
  },
  fa: {
    back: "بازگشت به سامانه",
    navigation: "اسناد و مقررات حقوقی",
    close: "بستن",
    reviewed: "تاریخ آخرین بازنگری",
    support: "راه ارتباط و مکاتبه",
    signupStart: "پیش از ثبت‌نام، ",
    signupSeparator: "، ",
    signupAnd: " و ",
    signupEnd: " را مطالعه فرمایید.",
  },
} as const;

export const LEGAL_SUPPORT_EMAIL = "support@agromind.ir";

export const TERMS_REQUIRED_MESSAGE = "You must agree to the Terms of Service to create an account.";
export const LEGAL_SIGNUP_AGREEMENT = {
  en: {
    label: "I have read and accept the Terms and Conditions of Service.",
    details: "Related documents:",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    cookies: "Cookie Policy",
    hint: "Agreement is required to complete email registration.",
    error: "Acceptance of the Terms and Conditions is required to register.",
  },
  fa: {
    label: "شرایط و مقررات استفاده از خدمات را مطالعه کرده‌ام و مفاد آن را می‌پذیرم.",
    details: "اسناد مرتبط:",
    terms: "شرایط و مقررات استفاده",
    privacy: "سیاست حریم خصوصی",
    cookies: "سیاست کوکی‌ها",
    hint: "پذیرش شرایط استفاده برای تکمیل ثبت‌نام با ایمیل الزامی است.",
    error: "تکمیل ثبت‌نام منوط به پذیرش شرایط و مقررات استفاده است.",
  },
} as const;

export const GOOGLE_TERMS_GATE = {
  en: {
    title: "Confirmation of Terms",
    description: "To complete registration and access AgroMind, please review and accept the Terms and Conditions of Service.",
    label: "I have read and accept the Terms and Conditions of Service.",
    privacy: "Privacy Policy",
    cookies: "Cookie Policy",
    terms: "Terms of Service",
    continue: "Accept and continue",
    loading: "Recording acceptance…",
    decline: "Decline and sign out",
    error: "Acceptance of the Terms and Conditions is required to proceed.",
    unavailable: "Your acceptance could not be recorded. Please try again.",
  },
  fa: {
    title: "تأیید شرایط و مقررات استفاده",
    description: "به‌منظور تکمیل فرایند ثبت‌نام و ورود به سامانه، مطالعه و پذیرش شرایط استفاده الزامی است.",
    label: "شرایط و مقررات استفاده از خدمات را مطالعه کرده‌ام و مفاد آن را می‌پذیرم.",
    privacy: "حریم خصوصی",
    cookies: "سیاست کوکی‌ها",
    terms: "شرایط و مقررات",
    continue: "پذیرش و ادامه",
    loading: "در حال ثبت پذیرش…",
    decline: "عدم پذیرش و خروج از حساب",
    error: "ادامه فرایند منوط به پذیرش شرایط و مقررات استفاده است.",
    unavailable: "ثبت پذیرش با مشکل مواجه شد. لطفاً مجدداً تلاش کنید.",
  },
} as const;

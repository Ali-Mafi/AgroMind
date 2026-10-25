// Public draft notices: based on source audit, not a compliance certification.
export type LegalKind = "privacy" | "cookies" | "terms";
export type LegalLanguage = "en" | "fa";
export const REVIEWED_ON = "2026-10-25";
export const LINKS = [["privacy","/privacy","Privacy Policy","حریم خصوصی"],["cookies","/cookies","Cookie Policy","سیاست کوکی‌ها"],["terms","/terms","Terms of Service","شرایط استفاده"]] as const;
export const NOTICES = {
  "privacy": {
    "en": {
      "title": "Privacy Policy",
      "description": "What information AgroMind handles, why it is used and how to contact us.",
      "items": [
        [
          "Service operator",
          "AgroMind operates at agromind.ir. Its final registered company name and legal address are not yet confirmed for publication. Contact support@agromind.ir for operator and privacy inquiries. This notice must be updated with verified legal details."
        ],
        [
          "Account and farm records",
          "Account information includes email, username, authentication and security factors, and optional profile details such as name, language, country and time zone. Farm and garden records may include names, precise coordinates, areas, crops, plants and irrigation schedules. Team features may use invitation email addresses and member access roles."
        ],
        [
          "Purposes and location",
          "We use information to authenticate accounts, manage farms, apply permissions, provide weather and irrigation features, and address security/support issues. Browser location requires permission and can be declined; users can select a location manually. Weather or reverse-geocoding requests transmit selected coordinates to the relevant providers."
        ],
        [
          "Third-party services",
          "The app uses Vercel for hosting, Supabase for authentication and cloud data, and Resend for account emails. WeatherAPI and Open-Meteo supply weather; BigDataCloud or OpenStreetMap Nominatim handle optional reverse geocoding. Cloudflare Turnstile may load for username login, and Google is involved only if you choose Google sign-in. The landing page embeds an eNAMAD trust badge. Provider processing may occur outside your country."
        ],
        [
          "Cookies, retention and rights",
          "Essential auth cookies, temporary signup cookies, preference storage and public offline caches support the app. Details are in our Cookie Policy. Removing the app or clearing browser data does not erase cloud farm records. A verified retention schedule and self-service full account deletion are not yet published. Email support@agromind.ir from your account address for data access, correction or deletion requests; identity verification, legal duties and backups may affect handling."
        ],
        [
          "Security and revisions",
          "Access controls and multifactor options reduce risks but cannot guarantee a completely secure service. Do not share your password or verification codes. This farm-management product is not designed specifically for children. Notices will be revised for material new uses of information, analytics or advertising."
        ]
      ]
    },
    "fa": {
      "title": "سیاست حفظ حریم خصوصی",
      "description": "چه اطلاعاتی در AgroMind پردازش می‌شود، چرا استفاده می‌شود و راه ارتباط چیست.",
      "items": [
        [
          "مسئول ارائه خدمات",
          "AgroMind نام سرویس در agromind.ir است. نام ثبتی نهایی و نشانی رسمی شرکت هنوز برای انتشار تأیید نشده است. برای پرسش هویتی یا حریم خصوصی به support@agromind.ir ایمیل بزنید. بعد از تأیید اطلاعات قانونی، این متن به‌روزرسانی می‌شود."
        ],
        [
          "اطلاعات حساب و مزرعه",
          "داده حساب شامل ایمیل، نام کاربری، اطلاعات ورود و امنیت و مشخصات اختیاری مانند نام، زبان، کشور و منطقه زمانی است. رکوردهای باغ و مزرعه ممکن است نام، مختصات دقیق، مساحت، محصول، گیاه و زمان‌بندی آبیاری داشته باشند. قابلیت‌های تیمی می‌توانند ایمیل دعوت‌شونده و نقش دسترسی را پردازش کنند."
        ],
        [
          "هدف و موقعیت مکانی",
          "از داده برای ورود امن، مدیریت مزرعه، اعمال سطح دسترسی، هواشناسی و آبیاری و رسیدگی به پشتیبانی استفاده می‌شود. مکان‌یابی دستگاه نیاز به اجازه مرورگر دارد و قابل ردکردن است؛ می‌توانید مکان را دستی انتخاب کنید. در درخواست هواشناسی یا یافتن نام محل، مختصات انتخابی به ارائه‌دهندگان مربوط ارسال می‌شود."
        ],
        [
          "خدمات بیرونی",
          "میزبانی با Vercel، احراز هویت و داده ابری با Supabase و ایمیل حساب با Resend انجام می‌شود. WeatherAPI و Open-Meteo هواشناسی را فراهم می‌کنند؛ BigDataCloud یا OpenStreetMap Nominatim برای یافتن نام مکان استفاده می‌شوند. Cloudflare Turnstile ممکن است برای ورود با نام کاربری بارگیری شود و در صورت انتخاب ورود گوگل، Google دخیل است. نشان اینماد در لندینگ از بیرون بارگیری می‌شود. پردازش طرف‌های ثالث ممکن است بیرون از کشور شما باشد."
        ],
        [
          "کوکی، نگهداری و حقوق کاربر",
          "کوکی‌های ورود، کوکی موقت ثبت‌نام، ذخیره تنظیمات و کش عمومی آفلاین برای عملکرد اپ استفاده می‌شوند. جزئیات در سیاست کوکی آمده است. پاک‌کردن کوکی یا حذف اپ اطلاعات ابری مزرعه را حذف نمی‌کند. برنامه نگهداری قطعی و حذف کامل خودکار حساب هنوز منتشر نشده است. برای دسترسی، اصلاح یا درخواست حذف داده، از ایمیل حساب به support@agromind.ir پیام بدهید؛ احراز هویت، قوانین و پشتیبان‌گیری می‌توانند در رسیدگی مؤثر باشند."
        ],
        [
          "امنیت و تغییرات",
          "کنترل دسترسی و ورود چندمرحله‌ای خطر را کاهش می‌دهند ولی امنیت مطلق تضمین‌شدنی نیست. رمز و کد تأیید را به دیگران ندهید. سرویس مخصوص کودکان طراحی نشده و هنگام استفاده جدید و مهم از داده‌ها یا اضافه‌شدن تبلیغات و آنالیتیکس، متن بازبینی می‌شود."
        ]
      ]
    }
  },
  "cookies": {
    "en": {
      "title": "Cookie & Storage Policy",
      "description": "An inventory of the browser and offline storage used by AgroMind.",
      "items": [
        [
          "Why there is no accept-all banner",
          "At this audit, no first-party optional advertising or analytics tracker was found in the application source. The existing storage serves sign-in, signup continuation, display choices and offline use. We have not installed a fictional consent banner. If nonessential trackers are added, they must be blocked pending valid permission where required, with real reject and withdraw choices."
        ],
        [
          "Essential authentication and signup",
          "Supabase auth uses session cookies, typically named with an sb- prefix. Server cookie options are HttpOnly, SameSite=Lax and Secure in production; exact cookie names and expiry depend on the provider. agromind_pending_email, agromind_pending_username, agromind_pending_verification and agromind_pending_next store temporary signup state for about 24 hours."
        ],
        [
          "Display choices and offline content",
          "agromind_display_v1 is a first-party preference cookie lasting at most 365 days; it contains language, region and units, not passwords or farm details. Browser localStorage also remembers preferences, themes or game scores. The PWA CacheStorage holds public app assets and an offline game, not private farm API responses."
        ],
        [
          "External services and controls",
          "Cloudflare Turnstile may load for username login and the landing trust badge is served by eNAMAD. External providers may have their own technical identifiers. You can change display settings in the app and clear cookies/site data through the browser. Clearing session cookies signs you out; it does not erase cloud data. For questions write to support@agromind.ir."
        ]
      ]
    },
    "fa": {
      "title": "سیاست کوکی‌ها و ذخیره‌سازی",
      "description": "فهرست کوکی‌ها، حافظه مرورگر و فایل‌های آفلاین AgroMind.",
      "items": [
        [
          "چرا بنر پذیرش همه نداریم",
          "در بررسی کد فعلی، ردیاب مستقل تبلیغاتی یا آنالیتیکس اختیاری پیدا نشد. ذخیره‌سازی موجود برای ورود، ادامه ثبت‌نام، تنظیمات و حالت آفلاین است. بنر نمایشی با گزینه‌های بی‌اثر اضافه نکردیم. اگر ردیابی غیرضروری اضافه شود، در موارد لازم باید تا رضایت واقعی غیرفعال بماند و پذیرش، رد و لغو رضایت به‌درستی کار کنند."
        ],
        [
          "کوکی‌های ورود و ثبت‌نام",
          "نشست ورود Supabase معمولاً از کوکی با پیشوند sb- استفاده می‌کند. تنظیمات سمت سرور HttpOnly و SameSite=Lax و در Production گزینه Secure است؛ نام دقیق و انقضا ممکن است تغییر کند. کوکی‌های agromind_pending_email، agromind_pending_username، agromind_pending_verification و agromind_pending_next اطلاعات موقت ثبت‌نام را تقریباً تا ۲۴ ساعت نگه می‌دارند."
        ],
        [
          "انتخاب‌های نمایش و حالت آفلاین",
          "کوکی داخلی agromind_display_v1 حداکثر تا ۳۶۵ روز زبان، منطقه و واحدها را نگه می‌دارد، نه رمز یا داده مزرعه. localStorage ممکن است تنظیمات، تم یا امتیاز بازی را ذخیره کند. CacheStorage اپ PWA فایل‌های عمومی و بازی آفلاین را نگه می‌دارد و برای ذخیره پاسخ‌های خصوصی API مزرعه طراحی نشده است."
        ],
        [
          "خدمات بیرونی و کنترل‌ها",
          "Cloudflare Turnstile ممکن است برای ورود با نام کاربری اجرا شود و نشان اینماد از سرویس بیرونی دریافت می‌شود. این ارائه‌دهندگان می‌توانند شناسه فنی خود را داشته باشند. تنظیمات نمایش از داخل اپ قابل تغییر است و کوکی و داده سایت از مرورگر پاک می‌شود. حذف کوکی ورود از حساب خارجتان می‌کند ولی داده‌های ابری را پاک نمی‌کند. پشتیبانی: support@agromind.ir."
        ]
      ]
    }
  },
  "terms": {
    "en": {
      "title": "Terms of Service",
      "description": "Terms for using the current AgroMind farm-management service.",
      "items": [
        [
          "Scope and availability",
          "AgroMind currently supports farm and garden records, weather, irrigation planning, account preferences and collaboration features. Live AI advice, sensors and paid checkout are not confirmed available. Connectivity, maintenance and providers can interrupt service; perfect uptime and zero bugs cannot be guaranteed."
        ],
        [
          "Accounts and permitted use",
          "Keep credentials private and enter only information you are authorized to handle. Do not access others' farms, bypass authentication or misuse the service. You retain your rights to underlying farm records; our software and brand are protected under applicable law."
        ],
        [
          "Weather and agricultural decisions",
          "Weather forecasts, mapping and irrigation information may be delayed or inaccurate. They are decision-support tools, not guarantees of safety, yield, water availability or financial results. Check real field conditions and professional guidance before critical decisions."
        ],
        [
          "Payments and changes",
          "Subscription entitlements exist but an end-to-end payment system has not been verified for launch. Prices, renewals, refunds and cancellation policies must be added before any paid offering. We may update features and terms with appropriate notice where required."
        ],
        [
          "Operator and contact",
          "Questions: support@agromind.ir. The operator's final registered identity, governing-law/dispute process and commercial policies must be verified for the actual selling jurisdiction before formal launch. Mandatory rights are not waived by this draft."
        ]
      ]
    },
    "fa": {
      "title": "شرایط استفاده از AgroMind",
      "description": "شرایط استفاده از امکانات فعلی مدیریت مزرعه و باغ.",
      "items": [
        [
          "خدمات و دسترس‌پذیری",
          "AgroMind در وضعیت فعلی مدیریت باغ و مزرعه، هواشناسی، برنامه آبیاری، تنظیمات حساب و همکاری تیمی دارد. مشاوره فعال هوش مصنوعی، حسگر و پرداخت پولی هنوز تأیید نشده‌اند. اینترنت، نگهداری فنی و سرویس‌های بیرونی می‌توانند موجب اختلال شوند و تضمین نبود هرگونه خطا ممکن نیست."
        ],
        [
          "حساب و استفاده مجاز",
          "رمزها را محرمانه نگه دارید و فقط اطلاعاتی را ثبت کنید که اجازه پردازش آن را دارید. ورود بدون مجوز به مزرعه دیگران، دورزدن احراز هویت یا سوءاستفاده از سامانه ممنوع است. حقوق مربوط به داده اصلی مزرعه برای شما محفوظ است و نرم‌افزار و برند تابع حقوق مالکیت فکری قابل‌اعمال هستند."
        ],
        [
          "هواشناسی و تصمیم کشاورزی",
          "پیش‌بینی هوا، نقشه و اطلاعات آبیاری ممکن است با تأخیر یا نادرست باشند و تضمین ایمنی، برداشت، آب یا نتیجه اقتصادی نیستند. پیش از تصمیم حیاتی شرایط واقعی زمین و نظر متخصص را بررسی کنید."
        ],
        [
          "پرداخت و تغییرات",
          "زیرساخت اشتراک در کد موجود است ولی مسیر پرداخت کامل برای عرضه تأیید نشده است. پیش از هر فروش پولی باید قیمت، تمدید، لغو و بازگشت وجه واقعی منتشر شود. امکانات و شرایط با اطلاع مناسب در موارد لازم می‌توانند تغییر کنند."
        ],
        [
          "مسئول و ارتباط",
          "پرسش‌ها: support@agromind.ir. نام رسمی متصدی، حقوق حاکم، فرایند اختلاف و سیاست فروش باید قبل از عرضه رسمی در حوزه فعالیت موردنظر تأیید شوند. این پیش‌نویس حقوق الزامی کاربران را ساقط نمی‌کند."
        ]
      ]
    }
  }
} as const;

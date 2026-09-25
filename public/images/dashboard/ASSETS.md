# Dashboard photography

The `*-v2.webp` and `crop-*.webp` assets were generated for AgroMind with the built-in image-generation tool on 2026-09-24. They are decorative representative imagery, not photographs or observations of a user's farm. No external image host is required. They live under `/images/dashboard`, outside protected application route prefixes, so public images do not invoke authentication or return sign-in HTML.

- Headers: 1672 × 941, unscaled WebP quality 86. Field and orchard variants use centered compositions that survive portrait cropping.
- Crop/tree images: 1254 × 1254, unscaled WebP quality 86. All now use `cover` across the full product card, with a directional readability overlay; no separate side panel or letterboxing.
- Species-specific images: corn, wheat, rice and tomato. Other/unknown crops use a neutral cultivated-field view, never another species' close-up. Crop aliases and user data remain unchanged.
- Existing Weather backgrounds/resolver are reused unchanged. The old dashboard sprite and low-resolution images are not used by the active resolver.

## Generation briefs

All assets: crisp photorealistic editorial agriculture, evergreen shadows, restrained warm morning light, natural botanical detail, no interface, text, logos, people, cartoon or plastic rendering.

- `header-field-v2.webp`: wide healthy golden-green wheat fields, gently rolling hills and hedgerows; horizon upper third, detailed foreground, center-square mobile composition.
- `header-orchard-v2.webp`: wide mature fruit orchard in orderly rows, green valley and distant hills; detailed leaves, centered vanishing point, dark foreground for white headings.
- `garden-tree-v2.webp`: whole single fruit tree, natural rounded crown and slender trunk, grass and deep green background; centered with breathing room.
- `crop-corn.webp`: living maize with a single natural cob partly revealed in its husk, broad green leaves; explicitly no tomatoes.
- `crop-wheat.webp`: botanically accurate ripe wheat heads with fine awns, green-gold stems and a calm field behind.
- `crop-rice.webp`: living rice with drooping panicles, slender leaves and unhulled grains in a paddy; explicitly rice, not wheat.
- `crop-tomato.webp`: living vine with ripe red tomatoes, serrated green leaves and fine droplets.
- `crop-field.webp`: elevated view of parallel cultivated soil rows and young seedlings; no identifiable fruits or grain heads.
# Delivery and caching

Dashboard renders these originals through `FarmPhoto` using static Next.js image
imports. Content-hashed URLs, responsive `sizes`, inline previews and automatic
WebP optimization keep mobile downloads small without replacing the source
artwork. Only the active header uses eager/high-priority loading; the hero reuses
the same source and size selection, and crop photographs are lazy loaded.

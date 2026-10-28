# Signature Premium reference-matched artwork

Final polish, 2026-10-28. These new paths leave previously versioned assets unchanged.

- `landscape.jpg`: photorealistic reference-derived artwork, reconstructed with the built-in image-generation tool from the user-supplied approved Signature Premium reference. It preserves agricultural rows, hazy hills, sunrise, olive foliage and thin gold arcs; baked-in wording/logos were removed. A second edit darkened the center so live ivory text remains readable. This is generated scenery, not evidence of a real customer's farm. Export: 1200 × 600 JPEG, quality 82, 103667 bytes.
- `signature-leaf.png`: code-native gold leaf mark matching the reference's email identity, with a separate live serif AgroMind wordmark. It does not replace the application's existing icon.
- `highlight-1/2/3.png`, `shield.png`: original gold outline SVG shapes rendered as raster PNGs for email compatibility. The chart highlight replaces the prior lightbulb; all meaningful labels remain text.
- `footer-curve.png`: transparent asymmetric green wave and gold line, 1200 × 116, displayed at 600 × 58.
- `footer-leaves.png`: subtle code-native botanical decoration over the solid green footer. Clients without background support keep the same readable green fallback.
- Corresponding SVG files are retained as editable source; **email markup requests only JPEG/PNG**, never SVG.
- Existing Instagram/Telegram outline assets remain under `signature-v1`.

Generation prompt: extract only the approved header's landscape, remove all lettering/logo, retain hills/agricultural rows/gold sunrise/olive foliage/gold arcs, then darken the central field for centered live ivory text. Built-in tool; no external generation API or credentials. Source attachment: `F8FE5947-75F0-4DED-8362-C8DF825190A6.jpeg`.

No tracking pixels, remote fonts or third-party image services. Every final JPEG/PNG is below 150 KB and served from `https://agromind.ir/email/signature-v2/` after release.

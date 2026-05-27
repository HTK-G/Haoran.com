# Maintenance Notes

## Quick Update Workflow

1. Edit content in `js/site-data.js` only.
2. Keep page structure and styles unchanged unless needed.
3. Review in browser after each update.

## Boilerplate And Source Of Truth

- Boilerplate layout lives in `index.html`, `gallery.html`, and `project.html`.
- Shared rendering logic lives in `js/script.js`.
- All editable site content lives in `js/site-data.js`.
- Shared look and feel lives in `CSS/style.css`.
- If you want to update text, links, or image paths, `js/site-data.js` is the source of truth.

## Hints You Should Update Soon

- `meta.siteUrl` in `js/site-data.js` is a placeholder (`https://your-domain.com`).
- One project link appears to be a placeholder test URL:
  - `https://www.nyu.edu/about/news-publications/news/2024/october/test.html`
- Keep your short bio to 2-3 lines max for business-card style.

## Image Optimization You Can Run Locally

These commands use macOS `sips` and produce resized files in `assets/images/optimized/`.

```bash
mkdir -p assets/images/optimized

# Example: create 1280px webp-like alternative using jpeg fallback quality
# (sips cannot export webp directly)
sips -Z 1280 assets/images/highlights/meetingSmile.jpg --setProperty format jpeg --setProperty formatOptions 70 --out assets/images/optimized/meetingSmile-1280.jpg
```

If you install ImageMagick, use this instead for true WebP:

```bash
magick assets/images/highlights/meetingSmile.jpg -resize 1280x -quality 72 assets/images/optimized/meetingSmile-1280.webp
```

Recommended target sizes:

- Hero/profile images: up to 1600px wide
- Card images: 900-1200px wide
- Gallery detail images: 1400-1800px wide

## Optional Next Step

When optimized images are ready, replace image paths in `js/site-data.js` with `assets/images/optimized/...`.

// Turns downloaded logo candidates into small square PNGs the app can show.
// Each image is scaled to fit a 128x128 square with a little padding, keeps
// its transparency, and is trimmed of plain white margins first so the mark
// fills the tile. Also reports the logo's main colour (for the cover).
//
// Usage: node tools/brands/raster_logos.mjs <base URL serving the files> <jobs.json> <out dir>
//   jobs.json: [{ "src": "<file name under base URL>", "out": "<name>.png" }, ...]
// Needs Playwright with Chromium.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [base, jobsFile, outDir] = process.argv.slice(2);
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
// WebP keeps transparency at about a third of PNG's size; Safari 14+ shows it.
const FORMAT = /\.webp$/.test((jobs[0] || {}).out || '') ? 'image/webp' : 'image/png';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage();
await page.goto(base);
const report = {};
for (const j of jobs) {
  const r = await page.evaluate(async ({ url, size, fmt }) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('load')); img.src = url; });
    let w = img.naturalWidth || 512, h = img.naturalHeight || 512;
    if (/\.svg($|\?)/i.test(url) && Math.max(w, h) < 1024) { const k = 1024 / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
    const big = document.createElement('canvas'); big.width = w; big.height = h;
    const g = big.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    // trim margins that are transparent or near-white
    let x0 = w, y0 = h, x1 = -1, y1 = -1, rs = 0, gs = 0, bs = 0, n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = d[i + 3], white = d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245;
      if (a > 24 && !white) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
        if (mx - mn > 40) { rs += d[i]; gs += d[i + 1]; bs += d[i + 2]; n++; }
      }
    }
    if (x1 < 0) return { err: 'blank' };
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, pad = Math.round(size * 0.06), k = (size - pad * 2) / Math.max(cw, ch);
    const out = document.createElement('canvas'); out.width = size; out.height = size;
    const o = out.getContext('2d'); o.imageSmoothingQuality = 'high';
    o.drawImage(big, x0, y0, cw, ch, (size - cw * k) / 2, (size - ch * k) / 2, cw * k, ch * k);
    const hex = n ? [rs, gs, bs].map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join('').toUpperCase() : '';
    return { png: out.toDataURL(fmt, 0.9), color: hex, aspect: +(cw / ch).toFixed(2) };
  }, { url: base.replace(/\/?$/, '/') + encodeURIComponent(j.src), size: j.size || 128, fmt: FORMAT }).catch((e) => ({ err: String(e.message || e) }));
  if (r.png) fs.writeFileSync(path.join(outDir, j.out), Buffer.from(r.png.split(',')[1], 'base64'));
  report[j.out] = { color: r.color, aspect: r.aspect, err: r.err };
}
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
await browser.close();
console.log('done', Object.keys(report).length, 'errors', Object.values(report).filter((x) => x.err).length);

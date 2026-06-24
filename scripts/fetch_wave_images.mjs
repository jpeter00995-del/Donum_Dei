// === Welle-1 Bilder holen + zu webp (Haupt 1000px/q78 + Thumb 700px/q62) ===
// Aufruf: node scripts/fetch_wave_images.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const imgDir = join(here, '..', 'public', 'images', 'plants');
const thumbDir = join(imgDir, 'thumbs');
mkdirSync(imgDir, { recursive: true });
mkdirSync(thumbDir, { recursive: true });

// Wikimedia verlangt einen beschreibenden User-Agent, sonst 403.
const UA = 'DonumDeiBot/1.0 (plant database; contact maikelganske913@gmail.com)';

const items = [
  ['digitalis-purpurea', 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Digitalis_purpurea_-_Rennes.jpg'],
  ['artemisia-absinthium', 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Artemisia_absinthium_001.jpg'],
  ['chelidonium-majus', 'https://upload.wikimedia.org/wikipedia/commons/2/24/Chelidonium_majus_bgiu.jpg'],
  ['pleurotus-ostreatus', 'https://upload.wikimedia.org/wikipedia/commons/8/87/Austern-Seitling_Austernpilz_Pleurotus_ostreatus.JPG'],
  ['amanita-phalloides', 'https://upload.wikimedia.org/wikipedia/commons/8/82/Amanita_phalloides_2011_G3.jpg'],
];

for (const [slug, url] of items) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.log(`[FAIL] ${slug}: HTTP ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());

    const main = await sharp(buf).rotate().resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 78 }).toBuffer();
    writeFileSync(join(imgDir, `${slug}.webp`), main);

    const thumb = await sharp(buf).rotate().resize({ width: 700, withoutEnlargement: true })
      .webp({ quality: 62 }).toBuffer();
    writeFileSync(join(thumbDir, `${slug}.webp`), thumb);

    console.log(`[OK] ${slug}: main ${(main.length/1024).toFixed(0)}KB, thumb ${(thumb.length/1024).toFixed(0)}KB`);
  } catch (e) {
    console.log(`[ERR] ${slug}: ${e.message}`);
  }
}

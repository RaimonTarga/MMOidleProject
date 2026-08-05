const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../server/node_modules/sharp');

const sourceRoot = path.resolve('art/candidates/openai-icons');
const outputRoot = path.resolve('client/public/assets/concept-icons');
const groups = [
  ['classes', 96, 80],
  ['frames', 96, 54],
  ['ranges', 96, 54],
  ['abilities', 64, 44],
  ['stances', 64, 22],
  ['rites', 64, 22],
  ['runes/conditions', 48, 32],
  ['runes/actions', 48, 32],
  ['statuses/buffs', 48, 48],
  ['statuses/debuffs', 48, 48],
];

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]);
}

async function renderReviewSheet(entries) {
  const columns = 6;
  const cellWidth = 150;
  const sectionGap = 20;
  const titleHeight = 24;
  let height = 20;

  for (const entry of entries) {
    height += titleHeight + Math.ceil(entry.filenames.length / columns) * (entry.displaySize + 30) + sectionGap;
  }

  const width = columns * cellWidth + 24;
  const composites = [];
  const labels = [];
  let top = 18;

  for (const entry of entries) {
    labels.push(`<text x="12" y="${top + 14}" class="section">${escapeXml(entry.title ?? entry.directory)} · ${entry.displaySize}px in game</text>`);
    top += titleHeight;

    for (let index = 0; index < entry.filenames.length; index += 1) {
      const filename = entry.filenames[index];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const left = 12 + column * cellWidth + Math.floor((cellWidth - entry.displaySize) / 2);
      const iconTop = top + row * (entry.displaySize + 30);
      const buffer = await sharp(path.join(outputRoot, entry.directory, filename))
        .resize(entry.displaySize, entry.displaySize, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
      composites.push({ input: buffer, left, top: iconTop });
      labels.push(`<text x="${12 + column * cellWidth + cellWidth / 2}" y="${iconTop + entry.displaySize + 13}" class="label">${escapeXml(path.basename(filename, '.png'))}</text>`);
    }

    top += Math.ceil(entry.filenames.length / columns) * (entry.displaySize + 30) + sectionGap;
  }

  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .section { fill: #f2d47a; font: 700 13px sans-serif; }
      .label { fill: #d8d5e8; font: 9px sans-serif; text-anchor: middle; }
    </style>
    ${labels.join('\n')}
  </svg>`);

  const reviewPath = path.join(sourceRoot, 'contact-sheets', 'downscale-review.png');
  await sharp({
    create: { width, height, channels: 4, background: '#0d0b18' },
  }).composite([...composites, { input: svg, left: 0, top: 0 }]).png().toFile(reviewPath);
  return reviewPath;
}

async function main() {
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Missing candidate source directory: ${sourceRoot}`);
  }

  let prepared = 0;
  const reviewEntries = [];
  for (const [directory, size, displaySize] of groups) {
    const sourceDirectory = path.join(sourceRoot, directory);
    const outputDirectory = path.join(outputRoot, directory);
    fs.mkdirSync(outputDirectory, { recursive: true });

    const filenames = fs.readdirSync(sourceDirectory)
      .filter((filename) => filename.endsWith('.png'))
      .sort();

    for (const filename of filenames) {
      await sharp(path.join(sourceDirectory, filename))
        .resize(size, size, {
          fit: 'cover',
          kernel: sharp.kernel.lanczos3,
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true,
          quality: 100,
          colours: 256,
        })
        .toFile(path.join(outputDirectory, filename));
      prepared += 1;
    }
    reviewEntries.push({ directory, displaySize, filenames });
  }

  const statusBuffs = reviewEntries.find((entry) => entry.directory === 'statuses/buffs');
  if (statusBuffs) {
    reviewEntries.push({
      ...statusBuffs,
      title: 'statuses/target-frame aliases',
      displaySize: 22,
    });
  }

  const reviewPath = await renderReviewSheet(reviewEntries);
  console.log(`Prepared ${prepared} preview icons in ${outputRoot}`);
  console.log(`Rendered exact-size review sheet at ${reviewPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

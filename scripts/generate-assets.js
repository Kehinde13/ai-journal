#!/usr/bin/env node
/**
 * Generates app icon and splash screen assets using sharp + inline SVG.
 * Run: npm run generate-assets
 */

const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('sharp is not installed. Run: npm install --save-dev sharp');
  process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const BG = '#1a1a2e';

// ---------------------------------------------------------------------------
// Icon — 1024×1024
// ---------------------------------------------------------------------------
async function generateIcon() {
  const S = 1024;
  const cx = S / 2;
  const cy = S / 2;

  const svg = `<svg
    width="${S}" height="${S}"
    viewBox="0 0 ${S} ${S}"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Deep background gradient -->
      <radialGradient id="bgGrad" cx="50%" cy="44%" r="62%">
        <stop offset="0%"   stop-color="#272760"/>
        <stop offset="100%" stop-color="${BG}"/>
      </radialGradient>
      <!-- Soft glow around the letter -->
      <radialGradient id="glow" cx="50%" cy="48%" r="36%">
        <stop offset="0%"   stop-color="#6666cc" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#6666cc" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="${S}" height="${S}" fill="url(#bgGrad)"/>
    <!-- Glow layer -->
    <rect width="${S}" height="${S}" fill="url(#glow)"/>

    <!-- Decorative ring behind the letter -->
    <circle
      cx="${cx}" cy="${cy - 10}"
      r="310"
      fill="none"
      stroke="#3a3a80"
      stroke-width="2"
      opacity="0.5"
    />

    <!-- Stylised "J" -->
    <text
      x="${cx}"
      y="${cy + 15}"
      font-size="580"
      font-weight="700"
      font-family="Georgia, 'Times New Roman', serif"
      fill="#ffffff"
      text-anchor="middle"
      dominant-baseline="middle"
      opacity="0.97"
    >J</text>

    <!-- Accent bar beneath the J -->
    <rect
      x="${cx - 110}" y="${cy + 215}"
      width="220" height="10"
      rx="5"
      fill="#6666cc"
      opacity="0.75"
    />
    <!-- Thinner secondary bar -->
    <rect
      x="${cx - 60}" y="${cy + 238}"
      width="120" height="4"
      rx="2"
      fill="#6666cc"
      opacity="0.35"
    />
  </svg>`;

  const dest = path.join(ASSETS_DIR, 'icon.png');
  await sharp(Buffer.from(svg)).png().toFile(dest);
  console.log(`✓  icon.png          (${S}×${S})`);
}

// ---------------------------------------------------------------------------
// Splash — 1284×2778
// ---------------------------------------------------------------------------
async function generateSplash() {
  const W = 1284;
  const H = 2778;
  const cx = W / 2;

  // Vertical positions — group sits just above true centre
  const EMBLEM_CY  = 1020;   // centre of the "J" circle
  const EMBLEM_R   = 115;
  const TITLE_Y    = 1230;   // "AI Journal"
  const DIVIDER_Y  = 1310;
  const SUBTITLE_Y = 1360;   // "Your thoughts, understood"

  const svg = `<svg
    width="${W}" height="${H}"
    viewBox="0 0 ${W} ${H}"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="37%" r="55%">
        <stop offset="0%"   stop-color="#222258"/>
        <stop offset="100%" stop-color="${BG}"/>
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="37%" r="30%">
        <stop offset="0%"   stop-color="#5555aa" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#5555aa" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>

    <!-- Emblem: outer ring -->
    <circle
      cx="${cx}" cy="${EMBLEM_CY}"
      r="${EMBLEM_R + 18}"
      fill="none"
      stroke="#3a3a80"
      stroke-width="2"
      opacity="0.5"
    />
    <!-- Emblem: filled circle -->
    <circle
      cx="${cx}" cy="${EMBLEM_CY}"
      r="${EMBLEM_R}"
      fill="#252560"
      stroke="#5050aa"
      stroke-width="3"
    />
    <!-- Emblem: "J" letter -->
    <text
      x="${cx}"
      y="${EMBLEM_CY + 10}"
      font-size="${Math.round(EMBLEM_R * 1.35)}"
      font-weight="700"
      font-family="Georgia, 'Times New Roman', serif"
      fill="#ffffff"
      text-anchor="middle"
      dominant-baseline="middle"
    >J</text>

    <!-- App name -->
    <text
      x="${cx}"
      y="${TITLE_Y}"
      font-size="108"
      font-weight="700"
      font-family="Arial, Helvetica, sans-serif"
      fill="#ffffff"
      text-anchor="middle"
      dominant-baseline="middle"
      letter-spacing="3"
    >AI Journal</text>

    <!-- Divider -->
    <rect
      x="${cx - 48}" y="${DIVIDER_Y}"
      width="96" height="3"
      rx="2"
      fill="#5555aa"
      opacity="0.65"
    />

    <!-- Subtitle -->
    <text
      x="${cx}"
      y="${SUBTITLE_Y}"
      font-size="52"
      font-family="Arial, Helvetica, sans-serif"
      fill="#8888bb"
      text-anchor="middle"
      dominant-baseline="middle"
      letter-spacing="0.5"
    >Your thoughts, understood</text>
  </svg>`;

  const dest = path.join(ASSETS_DIR, 'splash.png');
  await sharp(Buffer.from(svg)).png().toFile(dest);
  console.log(`✓  splash.png        (${W}×${H})`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
(async () => {
  console.log('Generating app assets...\n');
  try {
    await generateIcon();
    await generateSplash();
    console.log('\nAll assets written to ./assets/');
  } catch (err) {
    console.error('\nFailed to generate assets:', err.message);
    process.exit(1);
  }
})();

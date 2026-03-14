const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "..", "assets", "images");

// App color palette
const PRIMARY = "#4A90D9";
const PRIMARY_DARK = "#3A7BC8";
const BG_LIGHT = "#E6F4FE";
const SUCCESS = "#4CAF50";

// Main icon SVG: Beer glass with a friendly diagonal slash
// Design: clean, modern, recognizable at small sizes
function createMainIconSvg(size = 1024) {
  const p = size / 1024; // scale factor
  return `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5BA3E8"/>
      <stop offset="100%" stop-color="#3A7BC8"/>
    </linearGradient>
    <linearGradient id="glass-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#E8F0FE" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD54F" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#FFA726" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="slash-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#66BB6A"/>
      <stop offset="100%" stop-color="#43A047"/>
    </linearGradient>
    <!-- Clip to rounded rect for iOS -->
    <clipPath id="icon-clip">
      <rect x="0" y="0" width="1024" height="1024" rx="224" ry="224"/>
    </clipPath>
  </defs>

  <g clip-path="url(#icon-clip)">
    <!-- Background gradient -->
    <rect width="1024" height="1024" fill="url(#bg)"/>

    <!-- Subtle radial glow -->
    <circle cx="512" cy="480" r="380" fill="white" opacity="0.06"/>

    <!-- Beer glass - simple tumbler shape -->
    <!-- Glass body (slightly tapered) -->
    <path d="
      M 360 280
      L 380 720
      Q 385 760 420 770
      L 604 770
      Q 639 760 644 720
      L 664 280
      Z
    " fill="url(#glass-fill)" stroke="white" stroke-width="6" stroke-opacity="0.3"/>

    <!-- Beer liquid inside glass -->
    <path d="
      M 372 440
      L 384 720
      Q 389 755 420 764
      L 604 764
      Q 635 755 640 720
      L 652 440
      Z
    " fill="url(#liquid)"/>

    <!-- Foam on top of beer -->
    <ellipse cx="512" cy="440" rx="140" ry="24" fill="white" opacity="0.5"/>

    <!-- Glass highlight (reflection) -->
    <path d="
      M 390 300
      L 396 600
      Q 398 610 404 610
      L 414 610
      Q 420 610 419 600
      L 407 300
      Z
    " fill="white" opacity="0.25"/>

    <!-- Handle on right side -->
    <path d="
      M 664 360
      Q 740 370 745 480
      Q 750 590 664 600
    " fill="none" stroke="white" stroke-width="36" stroke-linecap="round" stroke-opacity="0.9"/>

    <!-- Diagonal slash - friendly, rounded, green = positive -->
    <line x1="280" y1="200" x2="744" y2="824"
      stroke="url(#slash-grad)" stroke-width="64" stroke-linecap="round"/>

    <!-- White border on slash for contrast -->
    <line x1="280" y1="200" x2="744" y2="824"
      stroke="white" stroke-width="72" stroke-linecap="round" opacity="0.2"/>
    <line x1="280" y1="200" x2="744" y2="824"
      stroke="url(#slash-grad)" stroke-width="56" stroke-linecap="round"/>
  </g>
</svg>`;
}

// Android adaptive icon foreground (no background, centered with safe zone padding)
function createAdaptiveForegroundSvg() {
  // Adaptive icons use 108dp canvas with 72dp safe zone (centered)
  // In pixels at our scale: 1024px canvas, ~682px safe zone
  // We offset to center the content
  return `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glass-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#E8F0FE" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD54F" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#FFA726" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="slash-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#66BB6A"/>
      <stop offset="100%" stop-color="#43A047"/>
    </linearGradient>
  </defs>

  <!-- Beer glass -->
  <path d="
    M 360 280
    L 380 720
    Q 385 760 420 770
    L 604 770
    Q 639 760 644 720
    L 664 280
    Z
  " fill="url(#glass-fill)" stroke="white" stroke-width="6" stroke-opacity="0.3"/>

  <path d="
    M 372 440
    L 384 720
    Q 389 755 420 764
    L 604 764
    Q 635 755 640 720
    L 652 440
    Z
  " fill="url(#liquid)"/>

  <ellipse cx="512" cy="440" rx="140" ry="24" fill="white" opacity="0.5"/>

  <path d="
    M 390 300
    L 396 600
    Q 398 610 404 610
    L 414 610
    Q 420 610 419 600
    L 407 300
    Z
  " fill="white" opacity="0.25"/>

  <path d="
    M 664 360
    Q 740 370 745 480
    Q 750 590 664 600
  " fill="none" stroke="white" stroke-width="36" stroke-linecap="round" stroke-opacity="0.9"/>

  <!-- Slash -->
  <line x1="280" y1="200" x2="744" y2="824"
    stroke="white" stroke-width="72" stroke-linecap="round" opacity="0.2"/>
  <line x1="280" y1="200" x2="744" y2="824"
    stroke="url(#slash-grad)" stroke-width="56" stroke-linecap="round"/>
</svg>`;
}

// Android adaptive icon background
function createAdaptiveBackgroundSvg() {
  return `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5BA3E8"/>
      <stop offset="100%" stop-color="#3A7BC8"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="480" r="380" fill="white" opacity="0.06"/>
</svg>`;
}

// Monochrome icon (single color silhouette for Android themed icons)
function createMonochromeSvg() {
  return `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Beer glass silhouette -->
  <path d="
    M 360 280
    L 380 720
    Q 385 760 420 770
    L 604 770
    Q 639 760 644 720
    L 664 280
    Z
  " fill="black"/>

  <!-- Handle -->
  <path d="
    M 664 360
    Q 740 370 745 480
    Q 750 590 664 600
  " fill="none" stroke="black" stroke-width="36" stroke-linecap="round"/>

  <!-- Slash -->
  <line x1="280" y1="200" x2="744" y2="824"
    stroke="black" stroke-width="56" stroke-linecap="round"/>
</svg>`;
}

// Favicon - simpler version for small sizes
function createFaviconSvg() {
  return createMainIconSvg(1024);
}

// Splash icon - just the glass without background
function createSplashSvg() {
  return `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glass-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5BA3E8"/>
      <stop offset="100%" stop-color="#3A7BC8"/>
    </linearGradient>
    <linearGradient id="liquid-splash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD54F" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#FFA726" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="slash-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#66BB6A"/>
      <stop offset="100%" stop-color="#43A047"/>
    </linearGradient>
  </defs>

  <!-- Glass body -->
  <path d="
    M 360 280
    L 380 720
    Q 385 760 420 770
    L 604 770
    Q 639 760 644 720
    L 664 280
    Z
  " fill="url(#glass-body)" opacity="0.9"/>

  <!-- Beer liquid -->
  <path d="
    M 372 440
    L 384 720
    Q 389 755 420 764
    L 604 764
    Q 635 755 640 720
    L 652 440
    Z
  " fill="url(#liquid-splash)"/>

  <!-- Foam -->
  <ellipse cx="512" cy="440" rx="140" ry="24" fill="white" opacity="0.4"/>

  <!-- Handle -->
  <path d="
    M 664 360
    Q 740 370 745 480
    Q 750 590 664 600
  " fill="none" stroke="#3A7BC8" stroke-width="36" stroke-linecap="round" opacity="0.9"/>

  <!-- Slash -->
  <line x1="280" y1="200" x2="744" y2="824"
    stroke="url(#slash-grad)" stroke-width="56" stroke-linecap="round"/>
</svg>`;
}

async function generatePng(svgString, outputPath, size = 1024) {
  await sharp(Buffer.from(svgString))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`Generated: ${path.basename(outputPath)} (${size}x${size})`);
}

async function main() {
  // Main icon (1024x1024)
  await generatePng(createMainIconSvg(), path.join(OUTPUT_DIR, "icon.png"), 1024);

  // Android adaptive icons
  await generatePng(
    createAdaptiveForegroundSvg(),
    path.join(OUTPUT_DIR, "android-icon-foreground.png"),
    1024
  );
  await generatePng(
    createAdaptiveBackgroundSvg(),
    path.join(OUTPUT_DIR, "android-icon-background.png"),
    1024
  );
  await generatePng(
    createMonochromeSvg(),
    path.join(OUTPUT_DIR, "android-icon-monochrome.png"),
    1024
  );

  // Favicon (48x48 for web)
  await generatePng(createFaviconSvg(), path.join(OUTPUT_DIR, "favicon.png"), 48);

  // Splash icon
  await generatePng(createSplashSvg(), path.join(OUTPUT_DIR, "splash-icon.png"), 1024);

  console.log("\nAll icons generated successfully!");
}

main().catch(console.error);

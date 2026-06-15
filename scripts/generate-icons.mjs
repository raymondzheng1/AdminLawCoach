// @ts-check
/**
 * generate-icons.mjs — one square SVG mark → the full favicon / app-icon / PWA set (§19.1).
 * Run: npm run icons   (commit the generated app/icon.svg, app/apple-icon.png,
 * app/favicon.ico, public/icon-192.png, public/icon-512.png).
 *
 * §19.1 gotchas handled here:
 *  - favicon.ico must embed an RGBA PNG (ensureAlpha) — a flattened RGB PNG fails the Next build.
 *  - apple-touch + maskable icons must be OPAQUE (flatten) — a transparent bg renders black on iOS/Android.
 *  - maskable = full-bleed square (rx=0) with content in the inner ~80% safe zone.
 *  - sharp has no .ico encoder — produce the RGBA PNG, then hand-wrap a minimal ICO container.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NAVY = "#1f3a5f";
const PAPER = "#fbfaf7";
const TEAL = "#0f766e";

// The mark: a bold "A" (peak) in paper on navy, with a teal cross-beam. Font-free
// (paths only, so it rasterizes identically everywhere) and legible at 16px.
const MARK = `
  <rect width="512" height="512" fill="${NAVY}"/>
  <path d="M180 372 L256 150 L332 372" fill="none" stroke="${PAPER}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M214 300 L298 300" fill="none" stroke="${TEAL}" stroke-width="30" stroke-linecap="round"/>`;

const squareSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">${MARK}</svg>`;
const roundedSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><clipPath id="r"><rect width="512" height="512" rx="96"/></clipPath><g clip-path="url(#r)">${MARK}</g></svg>`;

/** Wrap a 32-bit PNG in a single-image ICO container (sharp can't encode .ico). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const dir = Buffer.alloc(16);
  dir.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
  dir.writeUInt8(size >= 256 ? 0 : size, 1); // height
  dir.writeUInt8(0, 2); // palette
  dir.writeUInt8(0, 3); // reserved
  dir.writeUInt16LE(1, 4); // color planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(png.length, 8); // image size
  dir.writeUInt32LE(6 + 16, 12); // offset
  return Buffer.concat([header, dir, png]);
}

async function main() {
  const sq = Buffer.from(squareSvg);

  // Crisp SVG favicon (primary).
  writeFileSync(resolve(ROOT, "app/icon.svg"), roundedSvg + "\n", "utf8");

  // favicon.ico — RGBA payload (NOT flattened), 32×32.
  const faviconPng = await sharp(sq).resize(32, 32).ensureAlpha().png().toBuffer();
  writeFileSync(resolve(ROOT, "app/favicon.ico"), pngToIco(faviconPng, 32));

  // apple-touch — 180×180, OPAQUE.
  await sharp(sq).resize(180, 180).flatten({ background: NAVY }).png().toFile(resolve(ROOT, "app/apple-icon.png"));

  // maskable PWA icons — full-bleed, OPAQUE.
  await sharp(sq).resize(192, 192).flatten({ background: NAVY }).png().toFile(resolve(ROOT, "public/icon-192.png"));
  await sharp(sq).resize(512, 512).flatten({ background: NAVY }).png().toFile(resolve(ROOT, "public/icon-512.png"));

  console.error("icons written: app/icon.svg, app/favicon.ico, app/apple-icon.png, public/icon-192.png, public/icon-512.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

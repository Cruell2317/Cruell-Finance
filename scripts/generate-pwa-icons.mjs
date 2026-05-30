import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "public/icons/app-icon-source.png");
const iconsDir = path.join(root, "public/icons");
const appDir = path.join(root, "src/app");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-128.png", size: 128 },
];

await mkdir(iconsDir, { recursive: true });

for (const { name, size } of sizes) {
  const out = path.join(iconsDir, name);
  await sharp(source)
    .resize(size, size, { fit: "contain", background: "#FFFFFF" })
    .png()
    .toFile(out);
  console.log(`Wrote ${name}`);
}

await sharp(source)
  .resize(512, 512, { fit: "contain", background: "#FFFFFF" })
  .png()
  .toFile(path.join(appDir, "icon.png"));

await sharp(source)
  .resize(180, 180, { fit: "contain", background: "#FFFFFF" })
  .png()
  .toFile(path.join(appDir, "apple-icon.png"));

console.log("Wrote src/app/icon.png and apple-icon.png");

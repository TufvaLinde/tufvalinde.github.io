import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputRoot = "./assets";

async function walkAndConvert(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkAndConvert(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".png")) continue;

    const webpPath = fullPath.replace(/\.png$/i, ".webp");

    try {
      console.log(`converting ${fullPath}`);
      await sharp(fullPath)
        .webp({ quality: 85 })
        .toFile(webpPath);

      if (fs.existsSync(webpPath)) {
        fs.unlinkSync(fullPath);
        console.log(`deleted original PNG: ${fullPath}`);
      }
    } catch (err) {
      console.error(`error converting ${fullPath}:`, err.message);
    }
  }

  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0 && dir !== inputRoot) {
    fs.rmdirSync(dir);
    console.log(`removed empty directory: ${dir}`);
  }
}


function updateReferences(baseDir = ".") {
  const exts = [".html", ".md", ".markdown", ".scss"];
  const files = [];

  function walk(folder) {
    for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
      const fullPath = path.join(folder, item.name);
      if (item.isDirectory()) walk(fullPath);
      else if (exts.includes(path.extname(fullPath))) files.push(fullPath);
    }
  }

  walk(baseDir);

  for (const file of files) {
    let content = fs.readFileSync(file, "utf-8");
    if (content.includes(".png")) {
      const replaced = content.replace(/(\.png)(['")])/g, ".webp$2");
      if (replaced !== content) {
        fs.writeFileSync(file, replaced);
        console.log(`🪄 Updated .png → .webp refs in: ${file}`);
      }
    }
  }
}


console.log("starting global PNG → WebP conversion...");
await walkAndConvert(inputRoot);

console.log("updating file references (.png → .webp)...");
updateReferences();

console.log("all conversions and replacements complete!");
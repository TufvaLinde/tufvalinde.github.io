import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputRoot = "./assets";
const skipFolders = ["static-pngs"];
const convertibleExts = [".png", ".jpg", ".jpeg", ".heic"];

async function walkAndConvert(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const webpFrames = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (skipFolders.some(f => fullPath.includes(f))) {
        console.log("skipping folder:", fullPath);
        continue;
      }

      await walkAndConvert(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();

    if (entry.isFile() && convertibleExts.includes(ext)) {
      if (skipFolders.some(f => fullPath.includes(f))) continue;

      const webpPath = fullPath.replace(/\.(png|jpe?g|heic)$/i, ".webp");

      try {
        console.log("converting", fullPath);
        await sharp(fullPath).webp({ quality: 85 }).toFile(webpPath);

        if (fs.existsSync(webpPath)) {
          fs.unlinkSync(fullPath);
          console.log(`deleted original ${ext}:`, fullPath);
        }

        webpFrames.push(path.basename(webpPath));
      } catch (err) {
        console.error("error converting", fullPath, ":", err.message);
      }
    }
  }

  if (webpFrames.length && dir.includes("/stopmotion/")) {
    writeFramesJson(dir, webpFrames);
  }
}

function writeFramesJson(folder, frames) {
  const jsonPath = path.join(folder, "frames.json");
  const data = { frames: frames.sort() };
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log("wrote", jsonPath);
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
    const replaced = content.replace(
      /(["'(/])([^"'()]+\.(png|jpe?g|heic))(['")])/gi,
      (match, prefix, pathPart, suffix) => {
        if (skipFolders.some(f => pathPart.includes(f))) return match;
        return `${prefix}${pathPart.replace(/\.(png|jpe?g|heic)$/i, ".webp")}${suffix}`;
      }
    );

    if (replaced !== content) {
      fs.writeFileSync(file, replaced);
      console.log("updated image refs → .webp in:", file);
    }
  }
}

console.log("starting global image → webp conversion...");
await walkAndConvert(inputRoot);

console.log("updating file references (.png/.jpg/.jpeg/.heic → .webp)...");
updateReferences();

console.log("done")

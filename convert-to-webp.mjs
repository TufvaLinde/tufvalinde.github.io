import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputRoot = "./assets";

// folders that should NOT be converted or renamed
const skipFolders = [
  "static-png",
  "post images"
];

async function walkAndConvert(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const webpFrames = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // skip safe folders
      if (skipFolders.some(f => fullPath.includes(f))) {
        console.log("skipping folder:", fullPath);
        continue;
      }

      const subFrames = await walkAndConvert(fullPath);
      if (subFrames.length && dir.includes("/stopmotion/")) {
        writeFramesJson(dir, subFrames);
      }
      continue;
    }

    // only convert pngs not in skip folders
    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".png") &&
      !skipFolders.some(f => fullPath.includes(f))
    ) {
      const webpPath = fullPath.replace(/\.png$/i, ".webp");

      try {
        console.log("converting", fullPath);
        await sharp(fullPath).webp({ quality: 85 }).toFile(webpPath);

        if (fs.existsSync(webpPath)) {
          fs.unlinkSync(fullPath);
          console.log("deleted original png:", fullPath);
        }

        webpFrames.push(path.basename(webpPath));
      } catch (err) {
        console.error("error converting", fullPath, ":", err.message);
      }
    }
  }

  return webpFrames;
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

    // only replace png → webp for references NOT in skipFolders
    const replaced = content.replace(
      /(["'(/])([^"'()]+\.png)(['")])/g,
      (match, prefix, pathPart, suffix) => {
        if (skipFolders.some(f => pathPart.includes(f))) {
          return match; // leave untouched
        }
        return `${prefix}${pathPart.replace(/\.png$/, ".webp")}${suffix}`;
      }
    );

    if (replaced !== content) {
      fs.writeFileSync(file, replaced);
      console.log("updated .png → .webp refs in:", file);
    }
  }
}

console.log("starting global png → webp conversion...");
await walkAndConvert(inputRoot);

console.log("updating file references (.png → .webp)...");
updateReferences();

console.log("done");
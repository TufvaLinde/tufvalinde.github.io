import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputRoot = "./assets/stopmotion";
const outputRoot = "./assets/stopmotion-webp";

async function walkAndConvert(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let convertedFiles = [];

  for (const entry of entries) {
    const inputPath = path.join(dir, entry.name);
    const relPath = path.relative(inputRoot, inputPath);
    const outputPath = path.join(outputRoot, relPath);

    if (entry.isDirectory()) {
      if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
      await walkAndConvert(inputPath);
    } else if (entry.isFile() && entry.name.endsWith(".png")) {
      const webpPath = outputPath.replace(/\.png$/, ".webp");
      const relWebpPath = relPath.replace(/\.png$/, ".webp");
      const outputDir = path.dirname(outputPath);

      const pngMtime = fs.statSync(inputPath).mtimeMs;
      if (fs.existsSync(webpPath)) {
        const webpMtime = fs.statSync(webpPath).mtimeMs;
        if (webpMtime >= pngMtime) {
          convertedFiles.push(path.basename(webpPath));
          continue;
        }
      }

      console.log(`converting ${relPath}????`);
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(webpPath);

      convertedFiles.push(path.basename(webpPath));
    }
  }

  if (convertedFiles.length > 0) {
    const relFolder = path.relative(inputRoot, dir);
    const outputFolder = path.join(outputRoot, relFolder);
    const jsonPath = path.join(outputFolder, "frames.json");
    convertedFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    fs.writeFileSync(
      jsonPath,
      JSON.stringify({ frames: convertedFiles }, null, 2)
    );
    console.log(`wrote frames.json for ${relFolder || "(root)"}`);
  }
}

if (!fs.existsSync(outputRoot)) fs.mkdirSync(outputRoot, { recursive: true });

console.log("starting recursive WebP conversion...");
await walkAndConvert(inputRoot);
console.log("all conversions complete");
import { bundle } from "@remotion/bundler";
import { renderFrames, getCompositions } from "@remotion/renderer";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compositionId = "SoccerTactical";
const frameDir = `out/frames`;
const silentMp4 = `out/soccer-tactical-silent.mp4`;
const finalMp4 = `out/soccer-tactical.mp4`;

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.join(__dirname, "src", "index.ts"),
  webpackOverride: (c) => c,
});

const compositions = await getCompositions(bundled);
const comp = compositions.find((c) => c.id === compositionId);
if (!comp) { console.error("Composition not found"); process.exit(1); }

console.log(`Rendering ${comp.durationInFrames} frames at ${comp.fps}fps...`);
fs.mkdirSync(frameDir, { recursive: true });

await renderFrames({
  composition: comp,
  serveUrl: bundled,
  outputDir: frameDir,
  imageFormat: "jpeg",
  jpegQuality: 92,
  concurrency: 2,
  onFrameUpdate(n) { if (n % 30 === 0) process.stdout.write(`  ${n}/${comp.durationInFrames}\r`); },
});
console.log("\nFrames done.");

execSync(
  `ffmpeg -y -framerate ${comp.fps} -i "${frameDir}/element-%03d.jpeg" -c:v libx264 -pix_fmt yuv420p -crf 18 "${silentMp4}"`,
  { stdio: "inherit" }
);

// Mix in voiceover if it exists
if (fs.existsSync("public/voiceover.mp3")) {
  execSync(
    `ffmpeg -y -i "${silentMp4}" -i public/voiceover.mp3 -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${finalMp4}"`,
    { stdio: "inherit" }
  );
  console.log(`Done with audio: ${finalMp4}`);
} else {
  console.log(`Done (no audio): ${silentMp4}`);
}

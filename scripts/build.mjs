import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import AdmZip from "adm-zip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const projectName = "logrief";
const behaviorPackDir = path.join(rootDir, "behavior_packs", projectName);
const distDir = path.join(rootDir, "dist");
const packageDir = path.join(distDir, "packages");
const scriptsDir = path.join(distDir, "scripts");
const stageDir = path.join(distDir, "staging", projectName);
const bundleEntry = path.join(rootDir, "scripts", "main.ts");
const outputBundle = path.join(scriptsDir, "main.js");
const outputMap = `${outputBundle}.map`;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function deleteDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function copyDir(source, target) {
  ensureDir(target);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function createZipFromFolder(folderPath, zipPath) {
  const zip = new AdmZip();

  const walk = (currentPath, relativeRoot = "") => {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const absolutePath = path.join(currentPath, entry.name);
      const relativePath = path.join(relativeRoot, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath, relativePath);
      } else {
        zip.addLocalFile(absolutePath, path.dirname(relativePath), path.basename(relativePath));
      }
    }
  };

  walk(folderPath);
  zip.writeZip(zipPath);
}

async function buildBundle({ watch = false } = {}) {
  ensureDir(scriptsDir);

  const config = {
    entryPoints: [bundleEntry],
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "browser",
    outfile: outputBundle,
    sourcemap: true,
    legalComments: "none",
    external: ["@minecraft/server", "@minecraft/server-ui"],
    logLevel: "info",
  };

  if (watch) {
    const context = await import("esbuild").then((esbuild) => esbuild.context(config));
    await context.watch();
    console.log(`Watching ${bundleEntry} for changes...`);
    return context;
  }

  await build(config);
  return null;
}

function stageBehaviorPack() {
  deleteDir(stageDir);
  copyDir(behaviorPackDir, stageDir);

  const scriptsTargetDir = path.join(stageDir, "scripts");
  ensureDir(scriptsTargetDir);

  fs.copyFileSync(outputBundle, path.join(scriptsTargetDir, "main.js"));
  if (fs.existsSync(outputMap)) {
    fs.copyFileSync(outputMap, path.join(scriptsTargetDir, "main.js.map"));
  }
}

function packageMcaddon() {
  ensureDir(packageDir);

  const behaviorPackZip = path.join(packageDir, `${projectName}_bp.mcpack`);
  const addonZip = path.join(packageDir, `${projectName}.mcaddon`);

  createZipFromFolder(stageDir, behaviorPackZip);

  const finalZip = new AdmZip();
  finalZip.addLocalFile(behaviorPackZip, "", `${projectName}_bp.mcpack`);
  finalZip.writeZip(addonZip);

  console.log(`Created ${addonZip}`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const watchMode = args.has("--watch");

  deleteDir(distDir);
  ensureDir(distDir);

  const buildContext = await buildBundle({ watch: watchMode });

  if (watchMode) {
    console.log("Watching for source changes. Press Ctrl+C to stop.");
    return;
  }

  if (args.has("--package")) {
    stageBehaviorPack();
    packageMcaddon();
    return;
  }

  console.log(`Built bundle to ${outputBundle}`);

  if (buildContext) {
    await buildContext.dispose();
  }
}

main().catch((error) => {
  console.error("Build failed");
  console.error(error);
  process.exit(1);
});

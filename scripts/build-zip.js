import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

const excludedDirectories = new Set([
  ".git",
  ".github",
  ".commandcode",
  "node_modules",
  "dist",
  "test",
  "scripts"
]);

const excludedFiles = new Set([
  ".DS_Store",
  "TECHNICAL_SPEC.md"
]);

const allowedExtensions = new Set([
  ".js",
  ".json",
  ".html",
  ".css",
  ".png",
  ".md",
  ".txt",
  ".svg"
]);

function getExtension(fileName) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

function shouldIncludeFile(path) {
  const name = basename(path);

  if (excludedFiles.has(name)) {
    return false;
  }

  return allowedExtensions.has(getExtension(name));
}

async function collectFiles(directory, result = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    const relPath = relative(rootDir, fullPath);
    const firstSegment = relPath.split(sep)[0];

    if (entry.isDirectory()) {
      if (excludedDirectories.has(firstSegment) || excludedDirectories.has(entry.name)) {
        continue;
      }

      await collectFiles(fullPath, result);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (shouldIncludeFile(fullPath)) {
      result.push(relPath);
    }
  }

  return result;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "inherit",
      ...options
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function readPackageVersion() {
  const packageJson = JSON.parse(await import("node:fs/promises").then(({ readFile }) => readFile(join(rootDir, "package.json"), "utf8")));
  return packageJson.version || "0.0.0";
}

async function createManifest(files) {
  const lines = [
    "# Release archive manifest",
    "",
    "The ZIP archive contains the following files:",
    "",
    ...files.map((file) => `- ${file.replaceAll(sep, "/")}`),
    ""
  ];

  await writeFile(join(distDir, "release-manifest.md"), lines.join("\n"), "utf8");
}

async function buildZipWithPowerShell(zipPath, files) {
  const listPath = join(distDir, "zip-file-list.txt");
  await writeFile(listPath, files.join("\n"), "utf8");

  const script = `
$ErrorActionPreference = 'Stop'
$root = ${JSON.stringify(rootDir)}
$zip = ${JSON.stringify(zipPath)}
$list = ${JSON.stringify(listPath)}
$temp = Join-Path ${JSON.stringify(distDir)} 'zip-stage'
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
New-Item -ItemType Directory -Force -Path $temp | Out-Null
Get-Content $list | ForEach-Object {
  $src = Join-Path $root $_
  $dst = Join-Path $temp $_
  $dstDir = Split-Path -Parent $dst
  if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
  Copy-Item -Path $src -Destination $dst -Force
}
if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $zip -Force
Remove-Item -Recurse -Force $temp
`;

  const encodedCommand = Buffer.from(script, "utf16le").toString("base64");

  await runCommand("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encodedCommand]);
}

async function buildZipWithSystemZip(zipPath, files) {
  await runCommand("zip", ["-r", zipPath, ...files]);
}

async function commandExists(command) {
  return new Promise((resolve) => {
    const child = spawn(command, ["--version"], {
      cwd: rootDir,
      stdio: "ignore",
      shell: process.platform === "win32"
    });

    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

async function main() {
  const manifestPath = join(rootDir, "manifest.json");
  await stat(manifestPath);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const version = await readPackageVersion();
  const zipPath = join(distDir, `send-to-ai-extension-v${version}.zip`);
  const files = (await collectFiles(rootDir)).sort();

  if (files.length === 0) {
    throw new Error("No files selected for release archive");
  }

  await createManifest(files);

  if (process.platform === "win32") {
    await buildZipWithPowerShell(zipPath, files);
  } else if (await commandExists("zip")) {
    await buildZipWithSystemZip(zipPath, files);
  } else {
    throw new Error("ZIP build requires either PowerShell on Windows or the `zip` command on Unix-like systems");
  }

  console.log(`Created ${relative(rootDir, zipPath)}`);
  console.log(`Included ${files.length} files`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

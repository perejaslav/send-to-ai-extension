import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Bundles the extension service worker into a single classic script
// (background.bundle.js). Required because Yandex Browser does not support
// ES-module service workers ("background": { "type": "module" }) and fails
// with "Service worker registration failed. Status code: 2". Chrome, Edge
// and other Chromium browsers accept the bundled classic script as well.

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const entryFile = "background.js";
const outputFile = "background.bundle.js";

const importStatementRegex = /^import[\s\S]*?from\s*["'][^"']+["'];?\s*$/gm;
const bareImportRegex = /^import\s*["'][^"']+["'];?\s*$/gm;
const exportDeclarationRegex = /^export\s+(?=(async\s+function|function|const|let|var|class)\b)/gm;
const exportBlockRegex = /^export\s*\{[\s\S]*?\}\s*;?\s*$/gm;
const functionDeclarationRegex = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm;
const classDeclarationRegex = /^class\s+([A-Za-z_$][\w$]*)/gm;
const variableDeclarationRegex = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;

function collectImportPaths(source) {
  const paths = new Set();
  const specifierRegex = /(?:from|import)\s*["'](\.[^"']+)["']/g;
  let match;

  while ((match = specifierRegex.exec(source)) !== null) {
    paths.add(match[1]);
  }

  return [...paths];
}

function stripModuleSyntax(source) {
  let result = source;

  result = result.replace(bareImportRegex, "");
  result = result.replace(importStatementRegex, "");
  result = result.replace(exportBlockRegex, "");
  result = result.replace(exportDeclarationRegex, "");

  return result.trim();
}

function collectDeclaredNames(source) {
  const names = new Set();
  const regexes = [functionDeclarationRegex, classDeclarationRegex, variableDeclarationRegex];

  for (const regex of regexes) {
    let match;

    while ((match = regex.exec(source)) !== null) {
      names.add(match[1]);
    }
  }

  return names;
}

async function resolveModule(fileName, resolved = new Map(), visiting = new Set()) {
  const absolutePath = resolve(rootDir, fileName);

  if (resolved.has(fileName)) {
    return resolved;
  }

  if (visiting.has(fileName)) {
    throw new Error(`Circular import detected: ${fileName}`);
  }

  visiting.add(fileName);

  const source = await readFile(absolutePath, "utf8");
  const dependencies = collectImportPaths(source);

  for (const dependency of dependencies) {
    const dependencyName = dependency.replace(/^\.\//, "");
    await resolveModule(dependencyName, resolved, visiting);
  }

  visiting.delete(fileName);
  resolved.set(fileName, source);

  return resolved;
}

async function main() {
  const modules = await resolveModule(entryFile);
  const declaredNamesByModule = new Map();
  const ownerByName = new Map();

  for (const [fileName, source] of modules) {
    const stripped = stripModuleSyntax(source);

    for (const name of collectDeclaredNames(stripped)) {
      if (ownerByName.has(name)) {
        throw new Error(`Duplicate top-level declaration "${name}" in ${fileName} (already declared in ${ownerByName.get(name)})`);
      }

      ownerByName.set(name, fileName);
    }

    declaredNamesByModule.set(fileName, stripped);
  }

  const header = [
    "// GENERATED FILE — do not edit by hand.",
    `// Built from ${entryFile} by scripts/build-background.js via "npm run build:background".`,
    "// Kept as a single classic script because Yandex Browser does not support",
    '// ES-module service workers ("type": "module") and fails registration with',
    '// "Service worker registration failed. Status code: 2".',
    ""
  ].join("\n");

  const body = [...declaredNamesByModule.entries()]
    .map(([fileName, source]) => `// === ${fileName} ===\n${source}`)
    .join("\n\n");

  const bundle = `${header}${body}\n`;

  await writeFile(join(rootDir, outputFile), bundle, "utf8");

  const moduleCount = modules.size;

  console.log(`Built ${outputFile} from ${moduleCount} module(s): ${[...modules.keys()].join(", ")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

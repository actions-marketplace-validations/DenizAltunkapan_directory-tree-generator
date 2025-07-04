import * as fs from "fs";
import * as path from "path";

let core: typeof import("@actions/core") | null = null;
try {
  core = require("@actions/core");
} catch {}

// ---------- Argument Parsers ----------

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index !== -1 && index + 1 < process.argv.length
    ? process.argv[index + 1]
    : undefined;
}

function getBooleanArg(flag: string, defaultValue: boolean): boolean {
  const value = getArgValue(flag);
  return value === undefined ? defaultValue : value.toLowerCase() === "true";
}

function getInputOrArg(key: string, cliFlag: string, fallback: string): string {
  if (core) {
    const input = core.getInput(key);
    if (input !== "") return input;
  }
  const arg = getArgValue(cliFlag);
  return arg !== undefined ? arg : fallback;
}

function getBooleanInputOrArg(
  key: string,
  cliFlag: string,
  fallback: boolean,
): boolean {
  if (core) {
    const input = core.getInput(key);
    if (input !== "") return parseBoolean(input, fallback);
  }
  return getBooleanArg(cliFlag, fallback);
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (!value) return defaultValue;
  const val = value.trim().toLowerCase();
  if (val === "true") return true;
  if (val === "false") return false;
  return defaultValue;
}

// ---------- Config ----------
const scanPathInput = getInputOrArg("path", "--path", ".");
const scanPaths = scanPathInput
  .split(",")
  .map((p) => p.trim())
  .filter((p) => p !== "");
const extInput = getInputOrArg("extensions", "--extensions", ".");
const showExtensions = getBooleanInputOrArg(
  "show-extensions",
  "--show-extensions",
  false,
);

let VALID_EXTENSIONS: string[] = [];
if (extInput.trim() === ".") {
  VALID_EXTENSIONS = [];
} else {
  VALID_EXTENSIONS = extInput
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .map((ext) => (ext.startsWith(".") ? ext : "." + ext));
}

// ---------- Tree Generator ----------

function listFiles(dir: string, prefix = ""): string[] {
  const localEntries: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subTree = listFiles(fullPath, prefix + "  ");
      if (subTree.length > 0) {
        localEntries.push(`${prefix}- 📁 **${item}**`);
        localEntries.push(...subTree);
      }
    } else {
      const ext = path.extname(item).toLowerCase();
      if (VALID_EXTENSIONS.length === 0 || VALID_EXTENSIONS.includes(ext)) {
        const relativePath = path.relative(process.cwd(), fullPath);
        const displayName = showExtensions ? item : path.basename(item, ext);
        localEntries.push(`${prefix}- 📄 [${displayName}](${relativePath})`);
      }
    }
  }

  return localEntries;
}

// ---------- Execution ----------

try {
  const markdown: string[] = ["# Project Structure", ""];
  for (const relPath of scanPaths) {
    const absPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) {
      console.warn(`⚠️  Skipping invalid directory: ${relPath}`);
      continue;
    }
    const tree = listFiles(absPath);
    if (tree.length > 0) {
      markdown.push(`## ${relPath}`, "", ...tree, "");
    }
  }

  if (markdown.length <= 2) {
    throw new Error("No valid files found in provided paths.");
  }

  const outputPath = path.join(process.cwd(), "DIRECTORY.md");
  fs.writeFileSync(outputPath, markdown.join("\n"));
  console.log(`✅ DIRECTORY.md generated at ${outputPath}`);
} catch (err) {
  console.error("❌ Error:", err);
  if (core) core.setFailed((err as Error).message);
  process.exit(1);
}

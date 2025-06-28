import * as fs from "fs";
import * as path from "path";

let core: typeof import("@actions/core") | null = null;
try {
  core = require("@actions/core");
} catch {
  // Not running in GitHub Actions, ignore
}

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
  if (core && core.getInput(key)) return core.getInput(key);
  const arg = getArgValue(cliFlag);
  return arg !== undefined ? arg : fallback;
}

function getBooleanInputOrArg(
  key: string,
  cliFlag: string,
  fallback: boolean,
): boolean {
  if (core && core.getInput(key)) {
    return parseBoolean(core.getInput(key), fallback);
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
const scanPathInput = getInputOrArg("path", "--path", "src");
const extInput = getInputOrArg("extensions", "--extensions", ".");
const showExtensions = getBooleanInputOrArg(
  "show-extensions",
  "--show-extensions",
  false,
);

const absoluteScanPath = path.resolve(process.cwd(), scanPathInput);

let VALID_EXTENSIONS: string[] = [];
if (extInput.trim() === ".") {
  VALID_EXTENSIONS = []; // Accept all files
} else {
  VALID_EXTENSIONS = extInput.split(",").map((e) => e.trim().toLowerCase());
}

// ---------- Tree Generator ----------

function listFiles(dir: string, prefix = ""): string[] {
  const output: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      output.push(`${prefix}- 📁 **${item}**`);
      output.push(...listFiles(fullPath, prefix + "  "));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (VALID_EXTENSIONS.length === 0 || VALID_EXTENSIONS.includes(ext)) {
        const relativePath = path.relative(process.cwd(), fullPath);
        const displayName = showExtensions ? item : path.basename(item, ext);
        output.push(`${prefix}- 📄 [${displayName}](${relativePath})`);
      }
    }
  }

  return output;
}

// ---------- Execution ----------

try {
  if (
    !fs.existsSync(absoluteScanPath) ||
    !fs.statSync(absoluteScanPath).isDirectory()
  ) {
    throw new Error(
      `Path "${absoluteScanPath}" does not exist or is not a directory.`,
    );
  }

  const tree = listFiles(absoluteScanPath);
  const outputPath = path.join(path.dirname(absoluteScanPath), "DIRECTORY.md");
  fs.writeFileSync(outputPath, ["# Project Structure", "", ...tree].join("\n"));

  console.log(`✅ DIRECTORY.md generated at ${outputPath}`);
} catch (err) {
  console.error("❌ Error:", err);
  if (core) core.setFailed((err as Error).message);
  process.exit(1);
}

import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";

const IS_ACTION = !!process.env.GITHUB_ACTIONS;

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index !== -1 && index + 1 < process.argv.length
    ? process.argv[index + 1]
    : undefined;
}

function getInput(key: string, cliFlag: string, fallback: string): string {
  if (IS_ACTION) {
    const input = core.getInput(key);
    if (input !== "") return input;
  }
  const arg = getArgValue(cliFlag);
  return arg !== undefined ? arg : fallback;
}

function getBooleanInput(
  key: string,
  cliFlag: string,
  fallback: boolean,
): boolean {
  const value = getInput(key, cliFlag, fallback.toString());
  return value.toLowerCase() === "true";
}

const scanPaths = getInput("path", "--path", ".")
  .split(",")
  .map((p) => p.trim())
  .filter((p) => p !== "");

const extInput = getInput("extensions", "--extensions", ".");
const showExtensions = getBooleanInput(
  "show-extensions",
  "--show-extensions",
  false,
);

const VALID_EXTENSIONS =
  extInput.trim() === "."
    ? []
    : extInput
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));

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
        const relativePath = path
          .relative(process.cwd(), fullPath)
          .replace(/\\/g, "/");
        const displayName = showExtensions ? item : path.basename(item, ext);
        localEntries.push(`${prefix}- 📄 [${displayName}](${relativePath})`);
      }
    }
  }

  return localEntries;
}

try {
  const markdown: string[] = ["# Project Structure", ""];

  for (const relPath of scanPaths) {
    const absPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(absPath)) continue;
    if (!fs.statSync(absPath).isDirectory()) continue;

    const tree = listFiles(absPath);
    if (tree.length > 0) {
      markdown.push(`## ${relPath}`, "", ...tree, "");
    }
  }

  if (markdown.length > 2) {
    const outputPath = path.join(process.cwd(), "DIRECTORY.md");
    fs.writeFileSync(outputPath, markdown.join("\n"));
    console.log(`✅ DIRECTORY.md generated at ${outputPath}`);
  } else if (IS_ACTION) {
    core.setFailed("No valid files found in provided paths.");
  }
} catch (err) {
  console.error("❌ Error:", err);
  if (IS_ACTION) core.setFailed((err as Error).message);
  process.exit(1);
}

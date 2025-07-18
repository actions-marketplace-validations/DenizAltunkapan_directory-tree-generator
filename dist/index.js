"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const IS_ACTION = !!process.env.GITHUB_ACTIONS;
function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  return index !== -1 && index + 1 < process.argv.length
    ? process.argv[index + 1]
    : undefined;
}
function getInput(key, cliFlag, fallback) {
  if (IS_ACTION) {
    const input = core.getInput(key);
    if (input !== "") return input;
  }
  const arg = getArgValue(cliFlag);
  return arg !== undefined ? arg : fallback;
}
function getBooleanInput(key, cliFlag, fallback) {
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
function listFiles(dir, prefix = "") {
  const localEntries = [];
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
  const markdown = ["# Project Structure", ""];
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
  if (IS_ACTION) core.setFailed(err.message);
  process.exit(1);
}

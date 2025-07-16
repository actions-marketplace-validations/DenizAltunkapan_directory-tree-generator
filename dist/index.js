"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let core = null;
try {
    core = require("@actions/core");
}
catch { }
// ---------- Argument Parsers ----------
function getArgValue(flag) {
    const index = process.argv.indexOf(flag);
    return index !== -1 && index + 1 < process.argv.length
        ? process.argv[index + 1]
        : undefined;
}
function getBooleanArg(flag, defaultValue) {
    const value = getArgValue(flag);
    return value === undefined ? defaultValue : value.toLowerCase() === "true";
}
function getInputOrArg(key, cliFlag, fallback) {
    if (core) {
        const input = core.getInput(key);
        if (input !== "")
            return input;
    }
    const arg = getArgValue(cliFlag);
    return arg !== undefined ? arg : fallback;
}
function getBooleanInputOrArg(key, cliFlag, fallback) {
    if (core) {
        const input = core.getInput(key);
        if (input !== "")
            return parseBoolean(input, fallback);
    }
    return getBooleanArg(cliFlag, fallback);
}
function parseBoolean(value, defaultValue) {
    if (!value)
        return defaultValue;
    const val = value.trim().toLowerCase();
    if (val === "true")
        return true;
    if (val === "false")
        return false;
    return defaultValue;
}
// ---------- Config ----------
const scanPathInput = getInputOrArg("path", "--path", ".");
const scanPaths = scanPathInput
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
const extInput = getInputOrArg("extensions", "--extensions", ".");
const showExtensions = getBooleanInputOrArg("show-extensions", "--show-extensions", false);
let VALID_EXTENSIONS = [];
if (extInput.trim() === ".") {
    VALID_EXTENSIONS = [];
}
else {
    VALID_EXTENSIONS = extInput
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .map((ext) => (ext.startsWith(".") ? ext : "." + ext));
}
// ---------- Tree Generator ----------
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
        }
        else {
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
    const markdown = ["# Project Structure", ""];
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
}
catch (err) {
    console.error("❌ Error:", err);
    if (core)
        core.setFailed(err.message);
    process.exit(1);
}

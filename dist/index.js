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
catch {
    // Not running in GitHub Actions, ignore
}
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
    if (core && core.getInput(key))
        return core.getInput(key);
    const arg = getArgValue(cliFlag);
    return arg !== undefined ? arg : fallback;
}
function getBooleanInputOrArg(key, cliFlag, fallback) {
    if (core && core.getInput(key)) {
        return parseBoolean(core.getInput(key), fallback);
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
const extInput = getInputOrArg("extensions", "--extensions", ".");
const showExtensions = getBooleanInputOrArg("show-extensions", "--show-extensions", false);
const absoluteScanPath = path.resolve(process.cwd(), scanPathInput);
let VALID_EXTENSIONS = [];
if (extInput.trim() === ".") {
    VALID_EXTENSIONS = []; // Accept all files
}
else {
    VALID_EXTENSIONS = extInput.split(",").map((e) => e.trim().toLowerCase());
}
// ---------- Tree Generator ----------
function listFiles(dir, prefix = "") {
    const output = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            output.push(`${prefix}- 📁 **${item}**`);
            output.push(...listFiles(fullPath, prefix + "  "));
        }
        else {
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
    if (!fs.existsSync(absoluteScanPath) ||
        !fs.statSync(absoluteScanPath).isDirectory()) {
        throw new Error(`Path "${absoluteScanPath}" does not exist or is not a directory.`);
    }
    const tree = listFiles(absoluteScanPath);
    const outputPath = path.join(process.cwd(), "DIRECTORY.md");
    fs.writeFileSync(outputPath, ["# Project Structure", "", ...tree].join("\n"));
    console.log(`✅ DIRECTORY.md generated at ${outputPath}`);
}
catch (err) {
    console.error("❌ Error:", err);
    if (core)
        core.setFailed(err.message);
    process.exit(1);
}

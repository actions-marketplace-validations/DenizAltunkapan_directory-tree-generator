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
// Parse CLI argument value by flag, e.g. --path or --extensions
function getArgValue(flag) {
    const index = process.argv.indexOf(flag);
    if (index !== -1 && process.argv.length > index + 1) {
        return process.argv[index + 1];
    }
    return undefined;
}
// Parse CLI flag as boolean (e.g. --show-extensions false)
function getBooleanFlag(flag, defaultValue) {
    const value = getArgValue(flag);
    if (value === undefined)
        return defaultValue;
    return value.toLowerCase() === "true";
}
const scanPathInput = getArgValue("--path") || "src";
const extInput = getArgValue("--extensions") || ".java";
const showExtensions = getBooleanFlag("--show-extensions", true);
// Resolve absolute path of the directory to scan
const absoluteScanPath = path.resolve(process.cwd(), scanPathInput);
let VALID_EXTENSIONS = [];
if (extInput.trim() === ".") {
    VALID_EXTENSIONS = []; // empty means accept all files
}
else {
    VALID_EXTENSIONS = extInput.split(",").map((e) => e.trim().toLowerCase());
}
// Recursively list directory contents with markdown formatting
function listFiles(dir, prefix = "") {
    let output = [];
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
                const relativePath = fullPath.replace(process.cwd() + path.sep, "");
                const displayName = showExtensions ? item : path.basename(item, ext);
                output.push(`${prefix}- 📄 [${displayName}](${relativePath})`);
            }
        }
    }
    return output;
}
try {
    if (!fs.existsSync(absoluteScanPath) ||
        !fs.statSync(absoluteScanPath).isDirectory()) {
        console.error(`Path "${absoluteScanPath}" does not exist or is not a directory.`);
        process.exit(1);
    }
    const tree = listFiles(absoluteScanPath);
    // Write DIRECTORY.md to the parent folder of the scan directory
    const outputPath = path.join(path.dirname(absoluteScanPath), "DIRECTORY.md");
    fs.writeFileSync(outputPath, ["# Project Structure", "", ...tree].join("\n"));
    console.log(`✅ DIRECTORY.md generated at ${outputPath}`);
}
catch (error) {
    console.error("Error generating DIRECTORY.md:", error);
    process.exit(1);
}

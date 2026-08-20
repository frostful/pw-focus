import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "LICENSE",
  "PRIVACY.md",
  "README.md",
  "SECURITY.md",
  "content.css",
  "content.js",
  "manifest.json",
  "package.json",
  "popup.css",
  "popup.html",
  "popup.js"
];
const iconFiles = ["assets/icon-16.png", "assets/icon-32.png", "assets/icon-48.png", "assets/icon-128.png", "assets/icon.svg"];

const files = new Map();
for (const name of requiredFiles) files.set(name, await readFile(resolve(root, name), "utf8"));
for (const name of iconFiles) await access(resolve(root, name));
files.set("assets/icon.svg", await readFile(resolve(root, "assets/icon.svg"), "utf8"));
await access(resolve(root, "scripts/check.mjs"));

const manifest = JSON.parse(files.get("manifest.json"));
const packageData = JSON.parse(files.get("package.json"));

if (manifest.manifest_version !== 3) throw new Error("manifest.json must use Manifest V3.");
if (manifest.version !== packageData.version) throw new Error("Manifest and package versions must match.");
if (manifest.name !== "PW Focus") throw new Error("Unexpected extension name.");
if (manifest.permissions.join(",") !== "storage") throw new Error("Unexpected extension permissions.");
if (manifest.host_permissions.join(",") !== "https://www.pw.live/study-v2/*") throw new Error("Unexpected host permissions.");
if (manifest.icons["128"] !== "assets/icon-128.png") throw new Error("The store icon is missing from the manifest.");

new Function(files.get("content.js"));
new Function(files.get("popup.js"));

for (const name of ["content.css", "popup.css"]) {
  const source = files.get(name);
  if ((source.match(/{/g) || []).length !== (source.match(/}/g) || []).length) {
    throw new Error(`${name} contains unbalanced blocks.`);
  }
}

const publicSources = [...files.values()].join("\n");
const privatePathPattern = /(?:\/Users\/|\/home\/|\/var\/home\/|[A-Z]:\\Users\\)/;
const credentialPattern = /(?:api[_-]?key|authorization:\s*bearer|client[_-]?secret|private[_-]?key)\s*[=:]/i;
const abandonedCodePattern = /(?:console\.(?:log|debug)|\bdebugger\b|\b(?:TODO|FIXME|HACK)\b)/;

if (privatePathPattern.test(publicSources)) throw new Error("A private filesystem path was found.");
if (credentialPattern.test(publicSources)) throw new Error("A possible credential was found.");
if (abandonedCodePattern.test(publicSources)) throw new Error("Debug or placeholder code was found.");

console.log("PW Focus release checks passed.");

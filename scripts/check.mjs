import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "CHANGELOG.md",
  "LICENSE",
  "PRIVACY.md",
  "README.md",
  "SECURITY.md",
  "content.css",
  "content.js",
  "manifest.json",
  "manifest.firefox.json",
  "package.json",
  "popup.css",
  "popup.html",
  "popup.js"
];
const iconFiles = ["assets/icon-16.png", "assets/icon-32.png", "assets/icon-48.png", "assets/icon-128.png"];

const files = new Map();
for (const name of requiredFiles) files.set(name, await readFile(resolve(root, name), "utf8"));
for (const name of iconFiles) await access(resolve(root, name));
await access(resolve(root, "scripts/check.mjs"));
files.set("scripts/build.mjs", await readFile(resolve(root, "scripts/build.mjs"), "utf8"));

const manifest = JSON.parse(files.get("manifest.json"));
const firefoxManifest = JSON.parse(files.get("manifest.firefox.json"));
const packageData = JSON.parse(files.get("package.json"));

if (manifest.manifest_version !== 3) throw new Error("manifest.json must use Manifest V3.");
if (manifest.version !== packageData.version) throw new Error("Manifest and package versions must match.");
if (manifest.name !== "PW Focus") throw new Error("Unexpected extension name.");
if (manifest.permissions.join(",") !== "storage") throw new Error("Unexpected extension permissions.");
if (manifest.host_permissions.join(",") !== "https://www.pw.live/study-v2/*") throw new Error("Unexpected host permissions.");
if (manifest.icons["128"] !== "assets/icon-128.png") throw new Error("The store icon is missing from the manifest.");
if (firefoxManifest.manifest_version !== 3) throw new Error("The Firefox manifest must use Manifest V3.");
if (firefoxManifest.version !== manifest.version) throw new Error("Browser manifest versions must match.");
if (firefoxManifest.minimum_chrome_version) throw new Error("The Firefox manifest contains a Chrome-only key.");
if (firefoxManifest.browser_specific_settings?.gecko?.id !== "pw-focus@frostful.github.io") {
  throw new Error("The Firefox add-on ID is missing or unexpected.");
}
if (Number.parseInt(firefoxManifest.browser_specific_settings.gecko.strict_min_version, 10) < 109) {
  throw new Error("Firefox 109 or newer is required for Manifest V3.");
}
const firefoxDataPermissions = firefoxManifest.browser_specific_settings.gecko.data_collection_permissions;
if (firefoxDataPermissions?.required?.join(",") !== "none" || firefoxDataPermissions.optional) {
  throw new Error("The Firefox manifest must explicitly declare that PW Focus collects no data.");
}
if (firefoxManifest.permissions.join(",") !== manifest.permissions.join(",")) {
  throw new Error("Browser permissions do not match.");
}
if (firefoxManifest.host_permissions.join(",") !== manifest.host_permissions.join(",")) {
  throw new Error("Browser host permissions do not match.");
}
if (packageData.scripts["build:chrome"] !== "node scripts/build.mjs chrome") throw new Error("The Chrome build command is missing.");
if (packageData.scripts["build:firefox"] !== "node scripts/build.mjs firefox") throw new Error("The Firefox build command is missing.");

new Function(files.get("content.js"));
new Function(files.get("popup.js"));
if (/\bchrome\./.test(files.get("content.js")) || /\bchrome\./.test(files.get("popup.js"))) {
  throw new Error("Direct Chrome API usage prevents cross-browser support.");
}

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

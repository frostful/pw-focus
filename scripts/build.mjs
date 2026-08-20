import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
if (!new Set(["chrome", "firefox"]).has(target)) {
  throw new Error("Choose either chrome or firefox.");
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist", target);
const manifestName = target === "firefox" ? "manifest.firefox.json" : "manifest.json";
const runtimeFiles = [
  "content.css",
  "content.js",
  "LICENSE",
  "popup.css",
  "popup.html",
  "popup.js",
  "PRIVACY.md"
];
const iconFiles = ["icon-16.png", "icon-32.png", "icon-48.png", "icon-128.png"];

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "assets"), { recursive: true });
await Promise.all(runtimeFiles.map((name) => copyFile(resolve(root, name), resolve(output, name))));
await Promise.all(iconFiles.map((name) => copyFile(resolve(root, "assets", name), resolve(output, "assets", name))));
await copyFile(resolve(root, manifestName), resolve(output, "manifest.json"));

const manifest = JSON.parse(await readFile(resolve(output, "manifest.json"), "utf8"));
process.stdout.write(`Built PW Focus ${manifest.version} for ${target}: ${output}\n`);

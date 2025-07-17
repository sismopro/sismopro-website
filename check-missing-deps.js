const fs = require("fs");
const path = require("path");

const exts = [".ts", ".tsx", ".js", ".jsx"];
const importRegex = /(?:import|require)\s*(?:.*?\sfrom\s*)?["']([^"']+)["']/g;

const readAllFiles = (dir) =>
  fs.readdirSync(dir).flatMap((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    return stat.isDirectory() ? readAllFiles(fullPath) : [fullPath];
  });

const getTopLevelModule = (name) => {
  if (name.startsWith("@")) return name.split("/").slice(0, 2).join("/");
  return name.split("/")[0];
};

const isExternal = (name) =>
  !name.startsWith(".") && !name.startsWith("/") && !name.startsWith("@/");

const used = new Set();
const projectRoot = process.cwd();

const files = readAllFiles(projectRoot).filter((f) =>
  exts.includes(path.extname(f))
);

for (const file of files) {
  const code = fs.readFileSync(file, "utf-8");
  const matches = code.matchAll(importRegex);
  for (const match of matches) {
    const dep = match[1];
    if (isExternal(dep)) {
      used.add(getTopLevelModule(dep));
    }
  }
}

const pkgJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json")));
const allDeps = Object.keys(pkgJson.dependencies || {}).concat(
  Object.keys(pkgJson.devDependencies || {})
);

const missing = [...used].filter((pkg) => !allDeps.includes(pkg));

console.log("\n📦 Pacotes usados mas não instalados:");
if (missing.length === 0) {
  console.log("✅ Nenhum! Tudo certo.");
} else {
  missing.forEach((m) => console.log(" -", m));
  console.log("\n💡 Instale com:");
  console.log(`yarn add ${missing.join(" ")}`);
}
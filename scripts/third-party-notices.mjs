import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const root = process.cwd();
const nextVersion = readJson("node_modules/next/package.json").version;

function originalTexts(sources) {
  return sources.flatMap((source) => {
    const text = readFileSync(path.join("scripts/licenses", source.file), "utf8");
    if (createHash("sha256").update(text).digest("hex") !== source.sha256) throw new Error(`Text de llicència modificat: ${source.file}`);
    return [`\n--- Font original: ${source.url} ---\n`, text];
  });
}

function walk(directory, predicate, skipPackages = false) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && skipPackages && (entry.name === "node_modules" || existsSync(path.join(file, "package.json")))) return [];
    return entry.isDirectory() ? walk(file, predicate, skipPackages) : predicate(file) ? [file] : [];
  });
}

export function licenseFiles(directory) {
  // Keep every applicable LICENSE/COPYING/NOTICE, including nested bundled notices.
  return walk(directory, (file) => /^(licen[cs]e|copying|notice)([.-]|$)|\.LEGAL\.txt$/i.test(path.basename(file)), true)
    .filter((file) => !path.relative(directory, file).split(path.sep).includes("node_modules"))
    .filter((file) => !/\.(?:js|ts|map|json)$/i.test(file))
    .sort();
}

export function componentVersion(directory, metadata) {
  if (metadata.version) return metadata.version;
  const name = path.basename(directory);
  if (/^(?:react|react-dom|react-server-dom-(?:webpack|turbopack))(?:-experimental)?$/.test(name)) {
    const production = walk(directory, (file) => /\.production\.js$/.test(file));
    for (const file of production) {
      const match = readFileSync(file, "utf8").match(/exports\.version\s*=\s*"([^"]+)"/);
      if (match) return match[1];
    }
    if (metadata.peerDependencies?.react) return metadata.peerDependencies.react;
    throw new Error(`No es pot determinar la versió de ${directory}`);
  }
  if (name === "scheduler") return readJson(path.join(directory, "../react-dom/package.json")).dependencies.scheduler;
  // Next does not publish upstream versions for many vendored packages.
  // Identify the exact distributing artifact rather than guessing a lockfile version.
  return `incorporat a Next.js ${nextVersion} (versió upstream no publicada)`;
}

function owner(file) {
  let directory = path.dirname(file);
  while (directory.startsWith(path.join(root, "node_modules"))) {
    if (existsSync(path.join(directory, "package.json")) && readJson(path.join(directory, "package.json")).name) return directory;
    directory = path.dirname(directory);
  }
  throw new Error(`Paquet no identificat: ${path.relative(root, file)}`);
}

export function generateNotices({ strict = false } = {}) {
  const inventory = ".next/third-party";
  if (!existsSync(`${inventory}/client.json`)) throw new Error("Cal compilar amb npm run build abans de generar els avisos.");
  const files = new Set(readdirSync(inventory).flatMap((file) => readJson(path.join(inventory, file))).map((file) => path.resolve(file)));
  const clientFiles = new Set(readJson(`${inventory}/client.json`).map((file) => path.resolve(file)));
  for (const trace of walk(".next", (file) => file.endsWith(".nft.json"))) {
    for (const file of readJson(trace).files) {
      const resolved = path.resolve(path.dirname(trace), file);
      if (resolved.includes(`${path.sep}node_modules${path.sep}`)) files.add(resolved);
    }
  }
  // Next's precompiled server runtime embeds other packages. Follow its shipped
  // source maps too, so these components do not disappear behind the Next owner.
  for (const file of files) {
    if (!file.includes("/next/dist/compiled/") || !existsSync(`${file}.map`)) continue;
    for (const source of readJson(`${file}.map`).sources) {
      const match = source.match(/(?:\.\/)?dist\/compiled\/(.+)/);
      if (match) {
        const embedded = path.resolve("node_modules/next/dist/compiled", match[1]);
        if (existsSync(embedded)) files.add(embedded);
        else throw new Error(`Font incorporada no localitzada: ${source}`);
      }
    }
  }
  const components = new Map();
  for (const file of files) {
    const directory = owner(file);
    const entry = components.get(directory) ?? { client: false };
    entry.client ||= clientFiles.has(file);
    components.set(directory, entry);
  }
  const sections = [];
  const missing = [];
  const supplements = readJson("scripts/licenses/sources.json");
  for (const [directory, scope] of [...components].sort(([a], [b]) => a.localeCompare(b, "en"))) {
    const metadata = readJson(path.join(directory, "package.json"));
    const version = componentVersion(directory, metadata);
    const notices = licenseFiles(directory);
    const supplement = supplements[metadata.name];
    if (supplement && supplement.version !== version) throw new Error(`Cal revisar la llicència complementària de ${metadata.name}: ${version} != ${supplement.version}`);
    const extra = originalTexts(supplement?.sources ?? []);
    if (!extra.length && !notices.some((file) => /licen[cs]e|copying/i.test(path.basename(file)) && readFileSync(file, "utf8").trim().length > 100)) {
      const description = `${metadata.name} — ${version} (${path.relative(root, directory)})`;
      if (scope.client) throw new Error(`Falta llicència de component del navegador: ${description}`);
      missing.push(description);
      continue;
    }
    sections.push([
      "=".repeat(78),
      `Component: ${metadata.name}`,
      `Versió: ${version}`,
      `Origen: ${path.relative(root, directory)}`,
      `Àmbit: ${scope.client ? "navegador i/o servidor" : "servidor / traça de producció"}`,
      ...notices.flatMap((file) => [`\n--- ${path.relative(directory, file)} ---\n`, readFileSync(file, "utf8")]),
      ...extra,
    ].join("\n"));
  }
  // Next emits the nomodule polyfill as a copied asset, outside webpack's
  // module graph. Pin the exact reviewed bytes and its original source manifest.
  for (const bundle of readJson("scripts/licenses/bundled.json")) {
    if (bundle.nextVersion !== nextVersion) throw new Error("Cal revisar els polyfills incorporats a la nova versió de Next.js.");
    const original = readFileSync(bundle.source);
    const hash = createHash("sha256").update(original).digest("hex");
    if (hash !== bundle.sha256) throw new Error(`Bundle de tercers modificat: ${bundle.source}`);
    const emitted = walk(".next/static", (file) => /^polyfills-.*\.js$/.test(path.basename(file)));
    if (emitted.length !== 1 || !original.equals(readFileSync(emitted[0]))) throw new Error("El chunk de polyfills emès no coincideix amb el bundle revisat.");
    for (const component of bundle.components) {
      if (!component.sources.length) throw new Error(`Falta llicència de component incorporat: ${component.name}`);
      sections.push([
        "=".repeat(78),
        `Component: ${component.name} (polyfills de Next.js)`,
        `Versió: ${component.version}`,
        `Origen: ${bundle.source}; ${bundle.provenance}`,
        "Àmbit: navegador (chunk nomodule emès)",
        ...(component.attributions ?? []),
        ...originalTexts(component.sources),
      ].join("\n"));
    }
  }
  if (missing.length && strict) throw new Error(`PUBLICACIÓ BLOQUEJADA: falta el text complet de llicència dels components del servidor:\n${missing.join("\n")}`);
  if (missing.length) console.warn(`AVÍS: ${missing.length} llicències del servidor pendents. npm run notices:check bloquejarà la publicació.`);
  return [
    "Diagnosi IA — Avisos de tercers",
    "",
    "Diagnosi IA conserva la llicència Apache 2.0 del projecte (LICENSE).",
    "Els components de tercers conserven les seves pròpies llicències, reproduïdes a continuació sense traduir.",
    "Generat a partir dels mòduls empaquetats per webpack i les traces de producció de Next.js.",
    "Les traces poden incloure components conservadorament encara que no s'executin en totes les rutes.",
    "Per a paquets incorporats sense versió upstream publicada, s'identifica la versió exacta de Next.js que els distribueix.",
    ...(missing.length ? ["", "REVISIÓ PENDENT — AQUEST INVENTARI NO ACREDITA COMPLIMENT COMPLET.", "Els següents components del servidor no publiquen aquí un text complet verificat; la comprovació de publicació falla fins a resoldre'ls:", ...missing] : []),
    "",
    ...sections,
    "",
  ].join("\n").replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n+$/, "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--clean")) {
    rmSync(".next/third-party", { recursive: true, force: true });
    process.exit(0);
  }
  const content = generateNotices({ strict: process.argv.includes("--check") });
  const target = "public/THIRD_PARTY_NOTICES.txt";
  if (process.argv.includes("--check")) {
    if (!existsSync(target) || readFileSync(target, "utf8") !== content) throw new Error("THIRD_PARTY_NOTICES.txt està desactualitzat; executa npm run notices:generate.");
  } else {
    mkdirSync("public", { recursive: true });
    writeFileSync(target, content);
  }
  console.log(`Avisos amb text complet: ${(content.match(/^Component:/gm) ?? []).length} components.`);
}

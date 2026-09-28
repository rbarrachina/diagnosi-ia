import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const script = fileURLToPath(new URL("./third-party-notices.mjs", import.meta.url));
const temporary = [];
const license = readFileSync("node_modules/react/LICENSE", "utf8");
function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), "diagnosi-notices-"));
  temporary.push(directory);
  const write = (file, content) => {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    writeFileSync(path.join(directory, file), content);
  };
  write("node_modules/next/package.json", JSON.stringify({ name: "next", version: "16.3.6" }));
  write("node_modules/react/package.json", JSON.stringify({ name: "react", version: "19.2.0" }));
  write("node_modules/react/LICENSE", license);
  write("node_modules/react/index.js", "");
  write(".next/third-party/client.json", JSON.stringify(["node_modules/react/index.js"]));
  write("scripts/licenses/sources.json", "{}");
  write("scripts/licenses/bundled.json", "[]");
  write("scripts/licenses/resources.json", "[]");
  mkdirSync(path.join(directory, ".next/static"), { recursive: true });
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: "utf8" });
  return { directory, write, run };
}
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });

test("copies the complete original permission text and every notice deterministically", () => {
  const { directory, write, run } = fixture();
  write("node_modules/react/NOTICE", "An original attribution\n");
  assert.equal(run().status, 0);
  const content = readFileSync(path.join(directory, "public/THIRD_PARTY_NOTICES.txt"), "utf8");
  assert.ok(content.includes(license));
  assert.ok(content.includes("An original attribution"));
  assert.ok(content.includes("Versió: 19.2.0"));
  assert.equal(run("--check").status, 0);
  assert.equal(run().status, 0);
  assert.equal(readFileSync(path.join(directory, "public/THIRD_PARTY_NOTICES.txt"), "utf8"), content);
});

test("fails explicitly if a browser component has no license", () => {
  const { directory, run } = fixture();
  rmSync(path.join(directory, "node_modules/react/LICENSE"));
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Falta llicència de component del navegador: react/);
});

test("keeps server-only packages out of web notices but blocks server redistribution", () => {
  const { directory, write, run } = fixture();
  write("node_modules/example/package.json", JSON.stringify({ name: "example", version: "1.2.3", license: "MIT" }));
  write("node_modules/example/index.js", "");
  write(".next/server/route.js.nft.json", JSON.stringify({ files: ["../../node_modules/example/index.js"] }));
  assert.equal(run().status, 0);
  assert.doesNotMatch(readFileSync(path.join(directory, "public/THIRD_PARTY_NOTICES.txt"), "utf8"), /example/);
  assert.equal(run("--check").status, 0);
  assert.equal(run("--server").status, 0);
  assert.match(readFileSync(path.join(directory, ".next/third-party/SERVER_NOTICES.txt"), "utf8"), /example — 1\.2\.3/);
  const check = run("--server", "--check");
  assert.notEqual(check.status, 0);
  assert.match(check.stderr, /PUBLICACIÓ BLOQUEJADA/);
});

test("does not guess the bundled React version from the top-level package", () => {
  const { directory, write, run } = fixture();
  write("node_modules/next/dist/compiled/react/package.json", JSON.stringify({ name: "react-builtin" }));
  write("node_modules/next/dist/compiled/react/LICENSE", license);
  write("node_modules/next/dist/compiled/react/cjs/react.production.js", 'exports.version = "19.3.0-canary-example";');
  write(".next/third-party/client.json", JSON.stringify(["node_modules/next/dist/compiled/react/cjs/react.production.js"]));
  assert.equal(run().status, 0);
  assert.match(readFileSync(path.join(directory, "public/THIRD_PARTY_NOTICES.txt"), "utf8"), /Versió: 19\.3\.0-canary-example/);
});

test("rejects stale notices, changed supplement text and unreviewed versions", () => {
  const { write, run } = fixture();
  assert.equal(run().status, 0);
  write("public/THIRD_PARTY_NOTICES.txt", "stale");
  assert.match(run("--check").stderr, /desactualitzat/);
  write("scripts/licenses/sources.json", JSON.stringify({ react: { version: "19.1.0", sources: [] } }));
  assert.match(run().stderr, /Cal revisar la llicència complementària/);
  write("scripts/licenses/sources.json", JSON.stringify({ react: { version: "19.2.0", sources: [{ file: "react.txt", url: "original", sha256: "wrong" }] } }));
  write("scripts/licenses/react.txt", license);
  assert.match(run().stderr, /Text de llicència modificat/);
});

test("requires an actual production inventory", () => {
  const { directory, run } = fixture();
  rmSync(path.join(directory, ".next/third-party/client.json"));
  assert.match(run().stderr, /Cal compilar/);
});

test("blocks unreviewed precompiled polyfills outside the module graph", () => {
  const { write, run } = fixture();
  write("scripts/licenses/bundled.json", JSON.stringify([{ nextVersion: "16.0.0" }]));
  assert.match(run().stderr, /Cal revisar els polyfills/);
  write("scripts/licenses/bundled.json", JSON.stringify([{ nextVersion: "16.3.6", source: "node_modules/next/polyfill.js", sha256: "wrong" }]));
  write("node_modules/next/polyfill.js", "an updated bundle");
  assert.match(run().stderr, /Bundle de tercers modificat/);
});

test("includes notices for a copied chunk and requires byte identity with the reviewed source", () => {
  const { directory, write, run } = fixture();
  const code = "reviewed fixture bundle";
  write("node_modules/next/polyfill.js", code);
  write("scripts/licenses/fixture.txt", license);
  write("scripts/licenses/bundled.json", JSON.stringify([{
    nextVersion: "16.3.6", source: "node_modules/next/polyfill.js",
    sha256: createHash("sha256").update(code).digest("hex"), provenance: "fixture",
    components: [{ name: "fixture", version: "1.0.0", sources: [{
      file: "fixture.txt", url: "fixture", sha256: createHash("sha256").update(license).digest("hex"),
    }] }],
  }]));
  write(".next/static/chunks/polyfills-example.js", "unexpected bytes");
  assert.match(run().stderr, /no coincideix amb el bundle revisat/);
  write(".next/static/chunks/polyfills-example.js", code);
  assert.equal(run().status, 0);
  const text = readFileSync(path.join(directory, "public/THIRD_PARTY_NOTICES.txt"), "utf8");
  assert.ok(text.includes("Component: fixture (polyfills de Next.js)"));
  assert.ok(text.includes(license));
});

test("requires review when a third-party source resource changes", () => {
  const { write, run } = fixture();
  write("icon.tsx", "modified SVG");
  write("scripts/licenses/resources.json", JSON.stringify([{
    name: "icon", version: "1.0.0", file: "icon.tsx", sha256: "original", sources: [],
  }]));
  assert.match(run().stderr, /Recurs de tercers modificat/);
});

test("includes the synthesized webpack runtime and reads its bundled version", () => {
  const { directory, write, run } = fixture();
  write("node_modules/next/dist/compiled/webpack/package.json", JSON.stringify({ name: "webpack", main: "bundle5.js" }));
  write("node_modules/next/dist/compiled/webpack/bundle5.js", 'module.exports = () => ({ webpack: { version: "5.98.0" } });');
  write("node_modules/next/dist/compiled/webpack/LICENSE", license);
  write(".next/static/chunks/webpack-example.js", "generated runtime");
  assert.equal(run().status, 0);
  const content = readFileSync(path.join(directory, "public/THIRD_PARTY_NOTICES.txt"), "utf8");
  assert.match(content, /Component: webpack\nVersió: 5\.98\.0/);
  rmSync(path.join(directory, "node_modules/next/dist/compiled/webpack/LICENSE"));
  assert.match(run().stderr, /Falta llicència de component del navegador: webpack/);
});

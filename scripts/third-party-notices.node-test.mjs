import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

test("records missing server texts and blocks the publication check", () => {
  const { directory, write, run } = fixture();
  write("node_modules/example/package.json", JSON.stringify({ name: "example", version: "1.2.3", license: "MIT" }));
  write("node_modules/example/index.js", "");
  write(".next/server/route.js.nft.json", JSON.stringify({ files: ["../../node_modules/example/index.js"] }));
  assert.equal(run().status, 0);
  assert.match(readFileSync(path.join(directory, "public/THIRD_PARTY_NOTICES.txt"), "utf8"), /example — 1\.2\.3/);
  const check = run("--check");
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

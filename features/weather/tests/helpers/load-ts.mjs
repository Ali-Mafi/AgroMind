import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

export const root = path.resolve(import.meta.dirname, "../../../..");
export const localRequire = createRequire(path.join(root, "package.json"));

// Use the project's installed TypeScript compiler; no test runner dependency.
// server-only is a Next.js build marker, replaced only in this Node test loader.
export function loadTs(relative, mocks = {}, cache = new Map()) {
  let filename = path.resolve(root, relative);
  if (existsSync(filename) && statSync(filename).isDirectory()) filename = path.join(filename, "index.tsx");
  if (!existsSync(filename)) filename = [filename + ".ts", filename + ".tsx"].find(existsSync) ?? filename + ".ts";
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const result = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  function requireModule(id) {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.endsWith(".module.css")) return { default: new Proxy({}, { get: (_target, key) => key }) };
    if (id === "server-only") return {};
    if (id.startsWith("@/")) return loadTs(id.slice(2), mocks, cache);
    if (id.startsWith(".")) return loadTs(path.resolve(path.dirname(filename), id), mocks, cache);
    return localRequire(id);
  }
  new Function("require", "module", "exports", result.outputText)(requireModule, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

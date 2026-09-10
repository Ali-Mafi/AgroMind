import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { loadTs, root } from "../features/weather/tests/helpers/load-ts.mjs";

const SOURCE_ROOTS = ["app", "components", "features"];
const TRANSLATED_ATTRIBUTES = new Set(["aria-label", "alt", "placeholder", "title"]);
const INTENTIONAL_UI = new Set(["AgroMind", "Open-Meteo", "WeatherAPI", "GPS", "ISO 8601"]);
const USER_FACING_PROPERTIES = new Set(["label", "title", "description", "message", "placeholder", "emptyText", "error", "helperText"]);
const TECHNICAL_VALUES = /^(?:°[CF]|hPa|mm|cm|m|km|km\/h|m\/s|mph|L|L\/min|gal \(US\)|gal \(US\)\/min|ha|ac|m²|ft²|in|%|—|GMT[+-]?\d*)$/u;

function filesUnder(directory) {
  const absolute = path.join(root, directory);
  if (!statSync(absolute).isDirectory()) return [absolute];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(relative) : /\.tsx?$/.test(entry.name) ? [path.join(root, relative)] : [];
  });
}

const files = SOURCE_ROOTS.flatMap(filesUnder);
const translationKeys = new Set();
const hardcoded = [];

function lineOf(source, node) {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function recordHardcoded(source, node, value) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!/[A-Za-z]{2}/.test(clean) || INTENTIONAL_UI.has(clean) || TECHNICAL_VALUES.test(clean) || /^[a-z][a-z0-9_]*$/.test(clean)) return;
  hardcoded.push(`${path.relative(root, source.fileName)}:${lineOf(source, node)} ${JSON.stringify(clean)}`);
}

function recordStringDescendants(source, node) {
  if (ts.isStringLiteralLike(node)) return recordHardcoded(source, node, node.text);
  if (ts.isConditionalExpression(node)) {
    recordStringDescendants(source, node.whenTrue);
    recordStringDescendants(source, node.whenFalse);
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    recordStringDescendants(source, node.left);
    recordStringDescendants(source, node.right);
  }
  if (ts.isTemplateExpression(node)) {
    recordHardcoded(source, node.head, node.head.text);
    for (const span of node.templateSpans) recordHardcoded(source, span.literal, span.literal.text);
  }
}

for (const filename of files) {
  const source = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, filename.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t") {
      const [argument] = node.arguments;
      if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) translationKeys.add(argument.text);
    }
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      if (node.tagName.getText(source) === "T") {
        const text = node.attributes.properties.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "text");
        if (text && ts.isJsxAttribute(text) && text.initializer) {
          if (ts.isStringLiteral(text.initializer)) translationKeys.add(text.initializer.text);
          if (ts.isJsxExpression(text.initializer) && text.initializer.expression && (ts.isStringLiteral(text.initializer.expression) || ts.isNoSubstitutionTemplateLiteral(text.initializer.expression))) translationKeys.add(text.initializer.expression.text);
        }
      }
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute) || !TRANSLATED_ATTRIBUTES.has(attribute.name.getText(source)) || !attribute.initializer) continue;
        if (ts.isStringLiteral(attribute.initializer)) recordHardcoded(source, attribute, attribute.initializer.text);
        if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) recordStringDescendants(source, attribute.initializer.expression);
      }
    }
    if (ts.isPropertyAssignment(node) && USER_FACING_PROPERTIES.has(node.name.getText(source).replace(/["']/g, "")) && ts.isStringLiteralLike(node.initializer)) {
      recordHardcoded(source, node, node.initializer.text);
    }
    if (ts.isJsxText(node)) recordHardcoded(source, node, node.text);
    if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) recordStringDescendants(source, node.expression);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

const { LANGUAGE_OPTIONS } = loadTs("features/settings/constants/locale-options.ts");
const { CANONICAL_KEYS, LOCALE_CATALOGS } = loadTs("features/settings/constants/catalogs.ts");
const localeCodes = LANGUAGE_OPTIONS.map(({ value }) => value);
const catalogCodes = Object.keys(LOCALE_CATALOGS);
const canonical = new Set(CANONICAL_KEYS);
const failures = [];
const missingByLocale = {};
const extraByLocale = {};

if (new Set(localeCodes).size !== localeCodes.length) failures.push("duplicate supported locale codes");
if (localeCodes.join("|") !== catalogCodes.join("|")) failures.push(`selector/catalog mismatch: ${localeCodes.join(",")} vs ${catalogCodes.join(",")}`);

for (const locale of localeCodes) {
  const keys = new Set(Object.keys(LOCALE_CATALOGS[locale] ?? {}));
  missingByLocale[locale] = CANONICAL_KEYS.filter((key) => !keys.has(key));
  extraByLocale[locale] = [...keys].filter((key) => !canonical.has(key));
  if (missingByLocale[locale].length) failures.push(`${locale} missing: ${missingByLocale[locale].join(" | ")}`);
  if (extraByLocale[locale].length) failures.push(`${locale} extra: ${extraByLocale[locale].join(" | ")}`);
}

const missingUsages = [...translationKeys].filter((key) => !canonical.has(key) && !canonical.has(key.trim().toLowerCase()));
if (missingUsages.length) failures.push(`translation usages missing from catalog: ${missingUsages.join(" | ")}`);

const suspiciousIdentical = [];
for (const locale of localeCodes.filter((value) => value !== "en")) {
  for (const key of CANONICAL_KEYS) {
    const value = LOCALE_CATALOGS[locale][key];
    if (value === key && !INTENTIONAL_UI.has(value) && !TECHNICAL_VALUES.test(value) && /[A-Za-z]{2}/.test(value)) suspiciousIdentical.push(`${locale}:${key}`);
  }
}
if (suspiciousIdentical.length) failures.push(`suspicious untranslated values: ${suspiciousIdentical.join(" | ")}`);
const uncataloguedHardcoded = [...new Set(hardcoded)].filter((entry) => {
  const value = JSON.parse(entry.slice(entry.indexOf('"')));
  return !canonical.has(value) && !canonical.has(value.trim().toLowerCase());
});
if (uncataloguedHardcoded.length) failures.push(`hardcoded UI strings:\n${uncataloguedHardcoded.join("\n")}`);

const weatherHardcoded = uncataloguedHardcoded.filter((entry) => entry.startsWith("features/weather/") || entry.startsWith("app/weather/"));
console.log(`Supported locales: ${localeCodes.length} (${localeCodes.join(", ")})`);
console.log(`Canonical translation keys: ${CANONICAL_KEYS.length}`);
console.log(`Missing keys per locale: ${localeCodes.map((locale) => `${locale}=${missingByLocale[locale].length}`).join(", ")}`);
console.log(`Extra keys per locale: ${localeCodes.map((locale) => `${locale}=${extraByLocale[locale].length}`).join(", ")}`);
console.log(`Missing translation usages: ${missingUsages.length}`);
console.log(`Suspicious untranslated values: ${suspiciousIdentical.length}`);
console.log(`Hardcoded user-facing strings: ${uncataloguedHardcoded.length}`);
console.log(`Weather hardcoded user-facing strings: ${weatherHardcoded.length}`);

if (failures.length) {
  console.error(`\nLocalization validation failed:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Localization validation passed");
}

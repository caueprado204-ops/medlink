import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const outputs = [
  ["demo source", new URL("../../demo/src/ui-shell.js", import.meta.url)],
  ["demo build input", new URL("../../demo/.build/content.html", import.meta.url)],
  ["demo standalone output", new URL("../../demo/medlink-demo.html", import.meta.url)],
  ["GitHub Pages output", new URL("../../docs/index.html", import.meta.url)],
  ["Vercel public output", new URL("../../public/demo.html", import.meta.url)],
] as const;

test("landing hero omits floating cards that cover the headline", () => {
  for (const [label, url] of outputs) {
    const source = readFileSync(url, "utf8");
    const start = source.indexOf("function Landing(){");
    const end = source.indexOf("const PROFILES=", start);
    assert.ok(start >= 0 && end > start, `${label} must contain the landing component`);
    assert.doesNotMatch(source.slice(start, end), /className="floaty glass/,
      `${label} must not render status cards over the hero title`);
  }
});

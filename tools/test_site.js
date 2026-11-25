// Render site/manual.md through the real renderer from site.js, headlessly.
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "site");

global.localStorage = { getItem: () => null, setItem: () => {} };
global.navigator = { language: "zh-CN" };
global.document = {
  documentElement: {},
  querySelectorAll: () => [],
  getElementById: () => null,
};

const src = fs.readFileSync(path.join(dir, "site.js"), "utf8");
eval(src);

const md = fs.readFileSync(path.join(dir, "manual.md"), "utf8");
const html = renderMarkdown(md);

const h1 = (html.match(/<h1>/g) || []).length;
const h2 = (html.match(/<h2>/g) || []).length;
const h3 = (html.match(/<h3>/g) || []).length;
const pre = (html.match(/<pre>/g) || []).length;
const ul = (html.match(/<ul>/g) || []).length;
const li = (html.match(/<li>/g) || []).length;

console.log("h1:", h1, "h2:", h2, "h3:", h3, "pre:", pre, "ul:", ul, "li:", li);
console.log("raw fence leftovers:", (html.match(/```/g) || []).length);
console.log("unbalanced <p>:", (html.match(/<p>/g) || []).length - (html.match(/<\/p>/g) || []).length);
console.log("unbalanced <ul>:", ul - (html.match(/<\/ul>/g) || []).length);
console.log("has Chinese section:", html.includes("中文"));
console.log("has English section:", html.includes("English"));
console.log("code block sample:", (html.match(/<pre><code>[^<]{0,40}/) || [""])[0].replace(/\n/g, " "));
console.log("bold rendered:", html.includes("<strong>"));
console.log("inline code rendered:", html.includes("<code>"));

const problems = [];
if (h1 < 2) problems.push("missing top-level headings");
if (h2 < 10) problems.push("too few section headings");
if (pre < 2) problems.push("code fences not rendered");
if ((html.match(/```/g) || []).length) problems.push("leftover fences");
if (ul !== (html.match(/<\/ul>/g) || []).length) problems.push("unbalanced lists");
if ((html.match(/<p>/g) || []).length !== (html.match(/<\/p>/g) || []).length) problems.push("unbalanced paragraphs");

console.log(problems.length ? "\nFAIL: " + problems.join("; ") : "\nOK: manual renders cleanly");
process.exit(problems.length ? 1 : 0);

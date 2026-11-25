// Reproduce the reported "Dear Bari" case: what does the salutation do with different CSVs?
const fs = require("fs");
const path = require("path");

const site = path.join(__dirname, "..", "site");
const src = fs.readFileSync(path.join(site, "app.js"), "utf8");
const cut = src.indexOf("/* ================================================================ boot */");

global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { querySelector: () => null, querySelectorAll: () => [] };
global.fetch = async () => ({ ok: true, json: async () => ({}) });
global.navigator = { language: "zh-CN" };
eval(src.slice(0, cut) + `\nglobalThis.X = { state, parseCsv, buildProfs, salutationOf, surnameOf };`);
const X = globalThis.X;

const cases = [
  ["Name,Title,Email,Research", "Zhang Yuan,Professor,zy@x.edu,Control Science"],
  ["Name,Title,Email,Research", "Jianhua FENG,Professor,f@x.edu,Database Systems"],
  ["Name,Title,Email,Research", "Md Miftahul Bari,Professor,mb@x.edu,Computer Vision"],
];
for (const [head, row] of cases) {
  const profs = X.buildProfs(X.parseCsv(head + "\n" + row));
  const p = profs[0];
  console.log(`name="${p.name}"  title="${p.title}"  ->  en: ${p.sal.en}   zh: ${p.sal.zh}`);
}

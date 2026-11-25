// Print the deterministic letter so the wording can be judged.
const fs = require("fs");
const path = require("path");

const site = path.join(__dirname, "..", "site");
const src = fs.readFileSync(path.join(site, "app.js"), "utf8");
const cut = src.indexOf("/* ================================================================ boot */");

global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { querySelector: () => null, querySelectorAll: () => [] };
global.fetch = async () => ({ ok: true, json: async () => ({}) });
global.navigator = { language: "zh-CN" };

eval(src.slice(0, cut) + `\nglobalThis.X = { state, parseCsv, buildProfs, localEmail, SAMPLE_ZH, SAMPLE_EN, profileName };`);
const X = globalThis.X;
X.state.prompts = JSON.parse(fs.readFileSync(path.join(site, "prompts.json"), "utf8"));

const csv = fs.readFileSync(process.argv[2], "utf8").replace(/^\uFEFF/, "");
const profs = X.buildProfs(X.parseCsv(csv));
const prof = profs.find((p) => p.name.includes("HU")) || profs[0];

const zh = X.localEmail({
  lang: "zh", profile: X.SAMPLE_ZH, signatureName: X.profileName(X.SAMPLE_ZH) || "王小明",
  university: "清华大学", program: "计算机科学与技术学术型硕士", intake: "2027年秋季", subjectTpl: "",
  senderEmail: "xiaoming.wang@example.com",
}, prof);
console.log("SUBJECT:", zh.subject);
console.log("=".repeat(72));
console.log(zh.body);

const en = X.localEmail({
  lang: "en", profile: X.SAMPLE_EN, signatureName: X.profileName(X.SAMPLE_EN) || "Wang Xiaoming",
  university: "Tsinghua University", program: "MSc in Computer Science", intake: "autumn 2027",
  subjectTpl: "", senderEmail: "xiaoming.wang@example.com",
}, prof);
console.log("\nSUBJECT:", en.subject);
console.log("=".repeat(72));
console.log(en.body);

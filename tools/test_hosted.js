// Headless checks for the hosted edition: CSV parsing, prompt filling, validation.
const fs = require("fs");
const path = require("path");

const site = path.join(__dirname, "..", "site");
const src = fs.readFileSync(path.join(site, "app.js"), "utf8");
const cut = src.indexOf("/* ================================================================ boot */");
if (cut < 0) { console.error("could not find boot section"); process.exit(1); }

global.localStorage = { getItem: () => null, setItem: () => {}, };
global.document = { querySelector: () => null, querySelectorAll: () => [] };
global.fetch = async () => ({ ok: true, json: async () => ({}), text: async () => "{}" });
global.navigator = { language: "zh-CN" };

eval(src.slice(0, cut) + `
globalThis.__x = { state, parseCsv, buildProfs, buildPrompt, validate, demoEmail, topicsOf, surnameOf,
                   profileName, SAMPLE_ZH, SAMPLE_EN };`);

// function declarations leak out of a sloppy direct eval, const/let do not
const state = globalThis.__x.state;
const SAMPLE_ZH = globalThis.__x.SAMPLE_ZH;
const SAMPLE_EN = globalThis.__x.SAMPLE_EN;

state.prompts = JSON.parse(fs.readFileSync(path.join(site, "prompts.json"), "utf8"));
state.lang = "zh";

const csvPath = process.argv[2];
const csvText = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const rows = parseCsv(csvText);
console.log("csv rows parsed:", rows.length, "| header:", rows[0].slice(0, 5).join(" | "));

const profs = buildProfs(rows);
console.log("professors with email:", profs.length);
const first = profs[0];
console.log("first:", first.id, first.name, "|", first.sal.zh, "|", first.sal.en);
console.log("topics:", topicsOf(first.research).join(", "));

const cfg = {
  lang: "zh", profile: SAMPLE_ZH, signatureName: profileName(SAMPLE_ZH) || "王小明",
  university: "清华大学", program: "计算机科学与技术学术型硕士", intake: "2027年秋季",
  subjectTpl: "", senderName: "王小明",
};
console.log("profile name:", cfg.signatureName);
const { system, user } = buildPrompt(cfg, first);
const leftovers = ["[[profile]]", "[[sal]]", "[[interests]]", "[[name]]"].filter((x) => user.includes(x));
console.log("prompt chars:", user.length, "| leftover placeholders:", leftovers.length ? leftovers : "none");

const demo = demoEmail(cfg, first);
console.log("demo subject:", demo.subject, "| starts with salutation:", demo.body.startsWith(first.sal.zh));

const zhBody = `尊敬的${surnameOf(first.name)}老师：

您好！冒昧来信打扰，深感抱歉。

我是示例大学计算机科学与技术专业本科生王小明，预计2028年6月毕业，已通过英语C1考试。我认真阅读了您的简介，对您在计算机图形学与几何处理方向的研究很感兴趣。

我参与过图像目标检测研究，负责数据集标注与训练流程；也参与过校园智能配送系统项目，积累了一些算法训练与系统集成的经验，并具备Python、C/C++、SQL和Linux的扎实基础。

虽然我目前在计算机图形学的理论基础尚处于起步阶段，但我对这一领域抱有浓厚的兴趣。我相信我扎实的编程基础、项目经验和学习能力，能让我在入学前补齐理论短板，并全心投入到您的研究团队中。这也是我诚恳希望在硕士阶段跟随您学习的原因。

请问您2027年秋季是否招收硕士研究生？如您方便，我非常希望能有机会与您进行10–15分钟的线上或线下交流，请教需要准备的知识和文献。若您今年名额已满，也恳请您给予建议，我将不胜感激。

随信附上我的个人简历，供您参考；若您能在百忙之中抽空查看，我将感激不尽。感谢您的时间。

此致
敬礼！

王小明
示例大学 计算机科学与技术
邮箱：xiaoming.wang@example.com`;

const problems = validate(cfg, first, "2027年秋季硕士申请咨询：计算机图形学", zhBody, false);
const chars = (zhBody.match(/[\u4e00-\u9fff]/g) || []).length;
console.log(`letter: ${chars} chars ->`, problems.length ? problems : "passes");

const bad = zhBody.replace("我认真阅读了您的简介", "久仰大名，我认真阅读了您的简介");
console.log("banned phrase caught:", validate(cfg, first, "主题", bad, false).some((p) => p.includes("久仰")));
console.log("short letter caught:", validate(cfg, first, "主题", zhBody.slice(0, 200), false).length > 0);

const enCfg = Object.assign({}, cfg, { lang: "en", profile: SAMPLE_EN, signatureName: profileName(SAMPLE_EN) });
const enPrompt = buildPrompt(enCfg, first);
console.log("en prompt chars:", enPrompt.user.length, "| name injected:", enPrompt.user.includes(enCfg.signatureName));

// no-API template writer
const loc = localEmail(cfg, first);
const locChars = (loc.body.match(/[\u4e00-\u9fff]/g) || []).length;
console.log(`local zh: ${locChars} chars | subject: ${loc.subject}`);
console.log("   starts with salutation:", loc.body.startsWith(first.sal.zh), "| has 此致:", loc.body.includes("此致"));
const locEn = localEmail(Object.assign({}, enCfg, { lang: "en" }), first);
const locWords = locEn.body.trim().split(/\s+/).length;
console.log(`local en: ${locWords} words | subject: ${locEn.subject}`);
console.log("   starts with salutation:", locEn.body.startsWith(first.sal.en), "| has Best regards:", locEn.body.includes("Best regards"));
console.log("   profile facts used:", loc.body.includes(cfg.signatureName) && loc.body.includes(cfg.university));

const locBad = localEmail(cfg, profs[5]);
console.log("   different professor -> different body:", locBad.body !== loc.body);

// sign-off must be accepted in its common forms, and rejected when absent
const withSincere = locEn.body.replace(/Best regards,/, "Sincerely,");
const noSignoff = locEn.body.replace(/Best regards,/, "");
console.log("   'Sincerely,' accepted:", validate(enCfg, first, "x", withSincere, true).length === 0);
console.log("   no sign-off rejected:", validate(enCfg, first, "x", noSignoff, true).some((p) => p.includes("sign-off")));

const localOk = locChars >= 300 && locWords >= 140;
if (locChars < 300) console.log("   ! local zh too short:", locChars);
if (locWords < 140) console.log("   ! local en too short:", locWords);

const ok = !leftovers.length && profs.length > 0 && problems.length === 0 && localOk;
console.log(ok ? "\nOK: hosted edition logic works" : "\nFAIL");
process.exit(ok ? 0 : 1);

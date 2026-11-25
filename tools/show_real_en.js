// Render the English letter using the user's real CV profile.
const fs = require("fs");
const path = require("path");

const site = path.join(__dirname, "..", "site");
const src = fs.readFileSync(path.join(site, "app.js"), "utf8");
const cut = src.indexOf("/* ================================================================ boot */");

global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { querySelector: () => null, querySelectorAll: () => [] };
global.fetch = async () => ({ ok: true, json: async () => ({}) });
global.navigator = { language: "zh-CN" };
eval(src.slice(0, cut) + `\nglobalThis.X = { state, parseCsv, buildProfs, localEmail };`);
const X = globalThis.X;
X.state.prompts = JSON.parse(fs.readFileSync(path.join(site, "prompts.json"), "utf8"));

const PROFILE = `姓名：Md Miftahul Bari（李晨），孟加拉国籍，目前在四川省绵阳市。
学历：绵阳师范学院 计算机科学与技术专业 本科生（2023年9月—2027年6月，预计毕业）。
奖学金：四川省政府外国留学生奖学金（学业优秀）。
联系方式：lichen_009bari@qq.com | +86 13689677215 | github.com/Md-Miftahul-Bari
微信：Miftahul_Bari
ORCID：0009-0004-0907-090X

研究兴趣：计算机视觉与应用深度学习（目标检测）；面向深度学习的数据工程。

论文：共同作者《Deep Learning Methods for Chest X-Ray Imaging-Based COVID-19 Pneumonia Detection》，
Journal of Image Processing and Intelligent Remote Sensing，2024年，第4卷5期，55–63页。本人负责数据集收集、
清洗与标注，执行训练流程与性能评估。

项目：《面向智慧校园的全自动无人快递取件与管理系统》，2025年中国国际大学生创新大赛四川省省级铜奖。

技能：Python、C、C++；YOLOv8、目标检测、模型训练、图像标注；SQL/SQLite；Git、Linux。
语言：孟加拉语（母语）、英语（C1）、汉语（HSK四级）。`;

const csv = fs.readFileSync(process.argv[2], "utf8").replace(/^\uFEFF/, "");
const profs = X.buildProfs(X.parseCsv(csv));
const prof = { ...profs[0], name: "Zhang Yuan", sal: { zh: "尊敬的Zhang Yuan老师：", en: "Dear Professor Zhang Yuan," } };

const out = X.localEmail({
  lang: "en", profile: PROFILE, signatureName: "Md Miftahul Bari",
  university: "Tsinghua University", program: "MSc in Computer Science", intake: "autumn 2027",
  subjectTpl: "", senderEmail: "lichen_009bari@qq.com",
}, prof);

console.log("SUBJECT:", out.subject);
console.log("=".repeat(74));
console.log(out.body);
console.log("=".repeat(74));
console.log("words:", out.body.trim().split(/\s+/).length);

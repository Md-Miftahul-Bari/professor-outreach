/* Hosted edition: everything runs in the browser except the final SMTP hop. */

const $ = (s) => document.querySelector(s);
const val = (id) => ($("#" + id) ? $("#" + id).value.trim() : "");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================================================================ i18n */
const I18N = {
  zh: {
    title: "教授邮件助手",
    subtitle: "上传名单与简历，为每位教授单独写一封信，逐封发出",
    local: "在线运行",
    sec_mail: "发件邮箱", sec_ai: "AI 服务商", sec_content: "内容",
    sec_files: "收件人与附件", sec_pace: "发送节奏",
    f_email: "发件邮箱", f_provider: "邮箱服务商", f_smtp_host: "SMTP 服务器",
    f_auth: "授权码 / 应用专用密码",
    f_auth_hint: "QQ 邮箱：设置 → 账户 → POP3/IMAP/SMTP 服务 → 生成授权码",
    f_name: "发件人姓名",
    f_llm: "服务商", f_model: "模型", f_key: "API Key", f_base: "接口地址",
    f_jsonmode: "支持 JSON 模式", opt_custom_smtp: "自定义 SMTP",
    opt_custom_llm: "自定义接口", opt_demo: "演示模式（只能预览）",
    opt_local: "本地模板（不需要 API Key）",
    f_university: "学校", f_intake: "入学时间", f_program: "申请项目",
    f_lang: "邮件语言", f_profile: "申请人背景（邮件只能使用这里的事实）",
    f_profile_hint: "上面是示例数据 — 用之前请整段换成你自己的信息。邮件只会使用这里的事实。",
    f_subject: "邮件主题（可选）",
    f_subject_hint: "留空则让 AI 拟定。可用变量：{方向}（院系目录原文）{姓名} {学校} {入学} {教授} {项目}",
    reset_profile: "恢复示例",
    f_csv_choose: "点击选择 CSV", f_csv_hint: "需包含 姓名 / 邮箱 / 研究方向 三列",
    f_att_add: "添加附件", f_att_hint: "简历 PDF 等，可多选，总大小 ≤ 4 MB",
    f_dmin: "最小间隔（秒）", f_dmax: "最大间隔（秒）",
    f_pace_hint: "间隔太短容易被邮箱服务商限流。中途可以随时暂停或停止。",
    btn_preview: "预览第一封", btn_start: "开始发送", btn_pause: "暂停",
    btn_resume: "继续", btn_stop: "停止",
    done_label: "已完成", elapsed: "已用时", eta: "预计剩余",
    sent: "已发送", left: "剩余", failed: "失败", total: "总计",
    calls: "API 调用", tokens_used: "Token", cost_est: "预估费用",
    log: "日志", log_empty: "还没有开始。", modal_close: "关闭",
    foot: "浏览器直接调用 AI 接口 · 邮箱授权码只经过一次发送请求 · 不会保存",
    state_idle: "未开始", state_starting: "启动中", state_connecting: "连接中",
    state_running: "发送中", state_paused: "已暂停", state_done: "已完成",
    state_stopped: "已停止", state_error: "出错",
    att_remove: "移除", confirm_start: "将按 CSV 中的地址逐封发送邮件，确认开始？",
    confirm_stop: "停止发送？已发送的记录会保留，重跑可以接着发。",
    err_no_csv: "请先上传 CSV 文件", generating: "生成中…",
    modal_to: "收件人：", unit_chars: "字", unit_words: "个词",
    big_attach: "附件太大：在线版单个请求上限约 4 MB，超过请用本地版。",
    cors_note: "若服务商不允许浏览器直连，会自动改走服务器转发。",
    foot_manual: "使用手册", foot_about: "关于",
    btn_test: "测试邮箱登录",
    test_ok: "登录成功：{email} 可以发信",
    err_auth: "535 登录失败：发件邮箱和授权码必须属于同一个账号，且已开启 SMTP 服务。连续失败会被临时限制，请等 10–30 分钟再试。",
    err_net: "连不上邮件服务器：检查网络，或端口 465/587 是否被屏蔽。",
    err_rcpt: "邮件服务器拒绝了收件地址。",
    err_unknown: "发送失败。",
    no_key_local: "没有填写 API Key，这次会用「本地模板」写作——句子是按模板拼的，不会像 DeepSeek 那样自然。想让它像聊天一样写，请在上面填 API Key。",
    profile_lang_hint: "提示：写英文邮件时，用英文填写这份资料效果最好（专业、项目名、技能）。",
  },
  en: {
    title: "Professor Outreach",
    subtitle: "Upload a roster and a CV — it writes a separate email for each professor and sends them one by one",
    local: "Runs online",
    sec_mail: "Sending mailbox", sec_ai: "AI provider", sec_content: "Content",
    sec_files: "Recipients & attachments", sec_pace: "Pacing",
    f_email: "From address", f_provider: "Provider", f_smtp_host: "SMTP server",
    f_auth: "App password / auth code",
    f_auth_hint: "QQ Mail: Settings → Account → POP3/IMAP/SMTP → generate an authorization code",
    f_name: "Sender name",
    f_llm: "Provider", f_model: "Model", f_key: "API key", f_base: "Endpoint",
    f_jsonmode: "Supports JSON mode", opt_custom_smtp: "Custom SMTP",
    opt_custom_llm: "Custom (OpenAI-compatible)", opt_demo: "Demo mode (preview only)",
    opt_local: "Local template (no API key needed)",
    f_university: "University", f_intake: "Intake", f_program: "Programme",
    f_lang: "Email language", f_profile: "Applicant profile (the only facts an email may use)",
    f_profile_hint: "This is sample data — replace the whole block with your own. Emails may only use what is here.",
    f_subject: "Subject line (optional)",
    f_subject_hint: "Leave empty to let the AI write it. Variables: {方向} {姓名} {学校} {入学} {教授} {项目}",
    reset_profile: "Reset to sample",
    f_csv_choose: "Click to choose a CSV", f_csv_hint: "Needs name / email / research columns",
    f_att_add: "Add attachments", f_att_hint: "CV PDF and others, multiple files, 4 MB total",
    f_dmin: "Min gap (seconds)", f_dmax: "Max gap (seconds)",
    f_pace_hint: "Short gaps get rate-limited. You can pause or stop whenever you want.",
    btn_preview: "Preview first", btn_start: "Start sending", btn_pause: "Pause",
    btn_resume: "Resume", btn_stop: "Stop",
    done_label: "done", elapsed: "Elapsed", eta: "Time left",
    sent: "Sent", left: "Left", failed: "Failed", total: "Total",
    calls: "API calls", tokens_used: "Tokens", cost_est: "Est. cost",
    log: "Log", log_empty: "Nothing yet.", modal_close: "Close",
    foot: "The browser calls the AI directly · your mailbox password crosses one send request · nothing is stored",
    state_idle: "Idle", state_starting: "Starting", state_connecting: "Connecting",
    state_running: "Sending", state_paused: "Paused", state_done: "Finished",
    state_stopped: "Stopped", state_error: "Error",
    att_remove: "Remove", confirm_start: "Send to every address in the CSV, one at a time. Start?",
    confirm_stop: "Stop sending? Sent records are kept and rerunning resumes from there.",
    err_no_csv: "Upload a CSV file first", generating: "Generating…",
    modal_to: "To: ", unit_chars: "chars", unit_words: "words",
    big_attach: "Attachments too large: the hosted version allows about 4 MB per request. Use the local edition.",
    cors_note: "If the provider blocks browser calls, the request is relayed through the server automatically.",
    foot_manual: "Manual", foot_about: "About",
    btn_test: "Test login",
    test_ok: "Signed in — {email} can send",
    err_auth: "535 login failed: the From address and the app password must belong to the same account, and SMTP must be enabled. Repeated failures get temporarily limited — wait 10-30 minutes.",
    err_net: "Cannot reach the mail server: check the network, or whether port 465/587 is blocked.",
    err_rcpt: "The mail server rejected the recipient address.",
    err_unknown: "Sending failed.",
    no_key_local: "No API key, so this run uses the local template — the sentences are assembled fixed, not written like DeepSeek chat. Add an API key above to get natural writing.",
    profile_lang_hint: "Tip: for English emails, fill this profile in English (major, projects, skills).",
  },
};

const t = (k) => (I18N[state.lang] || I18N.zh)[k] ?? k;

/* ================================================================ sample profiles */
const SAMPLE_ZH = `姓名：王小明（Wang Xiaoming），中国籍，目前在上海市。
学历：示例大学 计算机科学与技术专业 本科生（2024年9月—2028年6月，预计毕业）。
奖学金：校级优秀学生奖学金（示例）。
联系方式：xiaoming.wang@example.com
微信：example_wechat
电话：+86 138 0000 0000
ORCID：0000-0000-0000-0000

研究兴趣：计算机视觉与应用深度学习（目标检测）；面向深度学习的数据工程（数据采集、清洗、标注与训练流程）。

论文：示例论文《A Sample Paper on Image Detection》，示例期刊，2024年，第1卷第1期，10–20页。
本人负责数据集标注与训练流程。
项目：《示例：校园智能配送系统》，2025年，某省级竞赛铜奖。
技能：Python、C/C++、SQL、Linux。
助教：示例大学 Python 实验课助教（2026年9月至今）。
语言：汉语（母语）、英语（C1）。

—— 以上全部是示例数据（example.com、0000-0000 的 ORCID）。用的时候请整段替换成你自己的真实信息。`;

const SAMPLE_EN = `Name: Wang Xiaoming, Chinese, currently based in Shanghai.
Degree: B.Eng. in Computer Science and Technology, Example University
Study period: September 2024 - expected graduation June 2028.
Scholarship: University Merit Scholarship (sample).
Email: xiaoming.wang@example.com
WeChat: example_wechat
Phone: +86 138 0000 0000
ORCID: 0000-0000-0000-0000

Research interests: computer vision and applied deep learning (object detection); data engineering for deep
learning (collection, cleaning, annotation, training pipelines).

Paper: co-author, "A Sample Paper on Image Detection", Example Journal, 2024, Vol. 1(1), pp. 10-20.
I handled dataset annotation and the training pipeline.
Project: "Sample: Campus Smart Delivery System", 2025, bronze award in a provincial competition.
Skills: Python, C/C++, SQL, Linux.
Teaching assistant: Python lab TA, Example University, since September 2026.
Languages: Chinese (native), English (C1).

-- Everything above is sample data (example.com, ORCID 0000-0000). Replace the whole block with your own.`;

const LLM_BASES = {
  deepseek: { base: "https://api.deepseek.com/chat/completions", model: "deepseek-chat", json: true, cost: [0.27, 1.10] },
  openai: { base: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", json: true, cost: [0.15, 0.60] },
  moonshot: { base: "https://api.moonshot.cn/v1/chat/completions", model: "moonshot-v1-8k", json: true, cost: [1.70, 1.70] },
  siliconflow: { base: "https://api.siliconflow.cn/v1/chat/completions", model: "deepseek-ai/DeepSeek-V3", json: true, cost: [0.27, 1.10] },
};

const SMTP = {
  qq: ["smtp.qq.com", 465, true],
  gmail: ["smtp.gmail.com", 465, true],
  outlook: ["smtp.office365.com", 587, false],
  163: ["smtp.163.com", 465, true],
  126: ["smtp.126.com", 465, true],
};

const SENT_KEY = "hosted_sent_v1";
const FORM_KEY = "hosted_form_v1";
const MAX_ATTACH = 4 * 1024 * 1024;

/* ================================================================ state */
const state = {
  lang: "zh", csv: null, attachments: [], profs: [], prompts: null,
  paused: false, stopReq: false, run: null, timer: null, samples: { zh: SAMPLE_ZH, en: SAMPLE_EN },
  defaultProfile: "", last: null,
};

function applyLang() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("#lang_seg button").forEach((b) => b.classList.toggle("on", b.dataset.lang === state.lang));

  const box = $("#profile");
  const cur = (box.value || "").trim();
  const pristine = !cur || cur === SAMPLE_ZH.trim() || cur === SAMPLE_EN.trim();
  state.defaultProfile = state.samples[state.lang];
  if (pristine) box.value = state.defaultProfile;

  renderAttachments();
  updatePauseLabel();
  if (state.last) setBadge(state.last.state);
  if (state.csv) $("#csv_name").textContent = state.csv.name;
  localStorage.setItem("hosted_lang", state.lang);
}

function showError(msg) {
  const el = $("#form_error");
  el.textContent = msg || "";
  el.classList.toggle("hidden", !msg);
  const toast = $("#toast");
  if (toast) {
    toast.textContent = msg || "";
    toast.classList.toggle("hidden", !msg);
    if (msg) {
      clearTimeout(showError._t);
      showError._t = setTimeout(() => toast.classList.add("hidden"), 12000);
    }
  }
}

function fmtDur(sec) {
  if (!sec || sec < 1) return "—";
  sec = Math.round(sec);
  if (sec < 60) return state.lang === "zh" ? `${sec} 秒` : `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return state.lang === "zh" ? `${m} 分 ${s} 秒` : `${m}m ${s}s`;
  return state.lang === "zh" ? `${Math.floor(m / 60)} 小时 ${m % 60} 分` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(n);
}

/* ================================================================ csv */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ""));
}

function pickCol(header, aliases) {
  for (const h of header) {
    const hl = String(h || "").toLowerCase();
    if (aliases.some((a) => hl.includes(a))) return h;
  }
  return null;
}

function surnameOf(name) {
  const toks = String(name).trim().split(/\s+/);
  const caps = toks.filter((x) => x.length > 1 && x === x.toUpperCase());
  const raw = caps.length ? caps[caps.length - 1] : toks[toks.length - 1];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function displayName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .map((tok) => (tok.length > 1 && tok === tok.toUpperCase()
      ? tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase()
      : tok))
    .join(" ");
}

function salutationOf(name, title) {
  const full = displayName(name);
  // Chinese readers expect "尊敬的王老师"; an ALL-CAPS token is a reliable surname marker ("Jiwu SHU").
  // When there is no such marker ("Zhang Yuan"), use the whole name rather than guess.
  const caps = String(name).trim().split(/\s+/).filter((t) => t.length > 1 && t === t.toUpperCase());
  const zhName = caps.length ? displayName(caps[caps.length - 1]) : full;
  const tl = String(title || "").toLowerCase();
  const zh = `尊敬的${zhName}老师：`;
  let en;
  if (tl.includes("professor")) en = `Dear Professor ${full},`;
  else if (tl.includes("researcher") || tl.includes("fellow")) en = `Dear Dr. ${full},`;
  else en = `Dear ${full},`;
  return { zh, en };
}

function topicsOf(research, limit = 3) {
  const text = String(research || "").replace(/\([^()]*\)/g, " ").replace(/\s{2,}/g, " ");
  const out = [];
  for (const chunk of text.split(/[;,|、]/)) {
    const phrase = chunk.trim().replace(/^[ .;:-]+|[ .;:-]+$/g, "");
    if (!phrase) continue;
    const n = phrase.split(/\s+/).length;
    if (n < 1 || n > 8) continue;
    if (!out.some((p) => p.toLowerCase() === phrase.toLowerCase())) out.push(phrase);
  }
  return out.slice(0, limit);
}

function buildProfs(rows) {
  const header = rows[0];
  const cName = pickCol(header, ["name", "professor", "faculty", "姓名"]);
  const cMail = pickCol(header, ["email", "e-mail", "mail", "邮箱", "邮件"]);
  const cRes = pickCol(header, ["research", "interest", "area", "work", "方向", "研究"]);
  const cTitle = pickCol(header, ["title", "position", "rank", "职称"]);
  const cInst = pickCol(header, ["institute", "department", "school", "unit", "院系", "单位"]);
  if (!cName || !cMail || !cRes) throw new Error(state.lang === "zh" ? "CSV 需要包含 姓名 / 邮箱 / 研究方向 三列" : "CSV needs name, email and research columns");

  const idx = (col) => (col ? header.indexOf(col) : -1);
  const iN = idx(cName), iM = idx(cMail), iR = idx(cRes), iT = idx(cTitle), iI = idx(cInst);

  const out = [];
  rows.slice(1).forEach((r, n) => {
    const name = String(r[iN] || "").trim();
    const email = String(r[iM] || "").trim().toLowerCase();
    if (!name || !email.includes("@")) return;
    const title = iT >= 0 ? String(r[iT] || "").trim() : "";
    out.push({
      id: String(n + 1).padStart(3, "0"),
      name, title, email,
      research: String(r[iR] || "").replace(/\s+/g, " ").trim(),
      institute: iI >= 0 ? String(r[iI] || "").trim() : "",
      sal: salutationOf(name, title),
    });
  });
  return out;
}

/* ================================================================ prompt / validate */
function profileName(profile) {
  const m = String(profile).match(/(?:姓名|Name)\s*[:：]\s*([^\n（(，,]+)/);
  return m ? m[1].trim() : "";
}

function buildPrompt(cfg, prof) {
  const pack = state.prompts[cfg.lang];
  const values = {
    profile: cfg.profile,
    name: prof.name,
    sal: prof.sal[cfg.lang],
    title: prof.title,
    institute: prof.institute,
    university: cfg.university,
    research: prof.research,
    interests: topicsOf(prof.research).join(cfg.lang === "zh" ? "、" : ", ") || "-",
    program: cfg.program,
    intake: cfg.intake,
    signature_name: cfg.signatureName,
    subject_tpl: (cfg.subjectTpl || "").trim() || pack.subject_placeholder,
  };
  let user = pack.user;
  for (const [k, v] of Object.entries(values)) user = user.split(`[[${k}]]`).join(String(v));
  return { system: pack.system, user };
}

function validate(cfg, prof, subject, body, locked) {
  const rules = state.prompts.validation[cfg.lang];
  const problems = [];
  if (cfg.lang === "zh") {
    const squash = (s) => s.replace(/:/g, "：").replace(/\s/g, "");
    if (!squash(body).startsWith(squash(prof.sal.zh))) problems.push("salutation");
    const chars = (body.match(/[\u4e00-\u9fff]/g) || []).length;
    if (chars < rules.min_chars || chars > rules.max_chars) problems.push(`${chars} chars`);
    if (!locked && subject.length > rules.max_subject_chars) problems.push("subject length");
  } else {
    if (!body.startsWith(prof.sal.en)) problems.push("salutation");
    const words = body.trim().split(/\s+/).length;
    if (words < rules.min_words || words > rules.max_words) problems.push(`${words} words`);
    if (!locked && subject.split(/\s+/).length > rules.max_subject_words) problems.push("subject length");
  }
  const hay = cfg.lang === "zh" ? body : body.toLowerCase();
  for (const must of rules.must || []) if (!hay.includes(must)) problems.push(`missing ${must}`);
  const signoffs = rules.signoff || [];
  if (signoffs.length && !signoffs.some((s) => hay.includes(s))) problems.push("missing sign-off");
  for (const bad of rules.banned || []) if (hay.includes(bad)) problems.push(`banned ${bad}`);
  if (/[[\]]/.test(body)) problems.push("placeholders");
  if (!body.includes(cfg.signatureName)) problems.push("signature");
  return problems;
}

function parseJsonLoose(text) {
  let s = String(text).trim();
  if (s.startsWith("```")) {
    s = s.split("```")[1] || "";
    s = s.replace(/^json/i, "");
  }
  try { return JSON.parse(s); } catch (_) {}
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(s.slice(a, b + 1));
  throw new Error("model did not return JSON");
}

function demoEmail(cfg, prof) {
  const topic = topicsOf(prof.research, 2).join(cfg.lang === "zh" ? "、" : ", ") || (cfg.lang === "zh" ? "该方向" : "this area");
  const subject = cfg.lang === "zh" ? `${cfg.intake}硕士申请咨询（演示模式）` : `MSc application, ${cfg.intake} (demo)`;
  const body = cfg.lang === "zh"
    ? `${prof.sal.zh}\n\n您好！冒昧来信打扰，深感抱歉。\n\n这是演示模式生成的示例邮件，用于检查排版，不会发送给任何人。正式运行时，第 3–5 段会由你选择的 AI 服务商，根据申请人资料和这位教授的研究方向重新撰写。\n\n我认真阅读了您的简介，对您在${topic}方向的研究很感兴趣。\n\n请问您在${cfg.intake}是否招收硕士研究生？如您方便，我非常希望能有机会与您进行 10–15 分钟的线上或线下交流，请教需要准备的知识和文献。\n\n随信附上我的个人简历，供您参考。感谢您的时间。\n\n此致\n敬礼！\n\n${cfg.signatureName}\n${cfg.university}`
    : `${prof.sal.en}\n\nPlease excuse my writing to you without an introduction.\n\nThis is a sample produced by demo mode to check the layout; it is not sent to anyone. In a real run, paragraphs 3-5 would be written by the AI provider you chose.\n\nI have read your profile and am especially interested in your work on ${topic}.\n\nMay I ask whether you will be admitting master's students in ${cfg.intake}? If it is convenient, I would value 10-15 minutes online or in person to ask what I should read and prepare.\n\nI have attached my CV for reference. Thank you for your time.\n\nBest regards,\n${cfg.signatureName}\n${cfg.university}`;
  return { subject, body };
}

/* ---------------------------------------------- no-API template writer */
function parseFacts(text) {
  const facts = {};
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^[—-]/.test(line)) continue;
    const m = line.match(/^([^:：]{1,16})[:：]\s*(.+)$/);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    if (!(key in facts)) facts[key] = m[2].trim();
  }
  return facts;
}

function fact(facts, keys) {
  for (const k of keys) {
    for (const [key, value] of Object.entries(facts)) {
      if (key.includes(k)) return value;
    }
  }
  return "";
}

function cleanDate(s) {
  return String(s).replace(/[（(][^）)]*[）)]/g, "").replace(/[，,。.]$/, "").trim();
}

function sentence(s, limit) {
  let t = String(s || "").replace(/[。.;；]+$/, "").trim();
  if (limit && t.length > limit) t = t.slice(0, limit) + "…";
  return t;
}

function titleOf(text, limit) {
  const t = String(text || "");
  const cn = t.match(/《([^》]{4,120})》/);
  if (cn) return `《${cn[1]}》`;
  const q = t.match(/["“]([^"”]{6,120})["”]/);
  if (q) return `"${q[1]}"`;
  return sentence(t, limit);
}

function deriveMajor(facts) {  const explicit = fact(facts, ["专业", "major"]);
  if (explicit) return explicit;
  const edu = fact(facts, ["学历", "degree", "education"]);
  const m = edu.match(/([^\s，,]{2,20}?)专业/);
  if (m) return m[1];
  const en = edu.match(/in ([A-Za-z ,&]{4,40})/);
  return en ? en[1].split(/,| and /)[0].trim() : "";
}

function hashOf(s) {
  let h = 0;
  for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function renderSubject(tpl, cfg, prof) {
  const top = topicsOf(prof.research, 1)[0] || "";
  const table = {
    "{方向}": top, "{topic}": top, "{area}": top,
    "{姓名}": cfg.signatureName, "{name}": cfg.signatureName,
    "{学校}": cfg.university, "{university}": cfg.university,
    "{入学}": cfg.intake, "{intake}": cfg.intake,
    "{教授}": prof.name, "{professor}": prof.name, "{surname}": surnameOf(prof.name),
    "{项目}": cfg.program, "{program}": cfg.program,
  };
  let out = String(tpl);
  for (const [k, v] of Object.entries(table)) out = out.split(k).join(v);
  return out.replace(/\{[^{}]{0,20}\}/g, "").replace(/\s{2,}/g, " ").trim().slice(0, 120);
}

function signatureBlock(cfg, f, lang) {
  const uni = fact(f, ["学校", "university", "院校"]) || cfg.university;
  const major = fact(f, ["专业", "major"]);
  const email = fact(f, ["邮箱", "email"]) || cfg.senderEmail;
  const wechat = fact(f, ["微信", "wechat"]);
  const phone = fact(f, ["电话", "phone", "tel"]);
  const orcid = fact(f, ["orcid"]);
  const lines = [cfg.signatureName];
  lines.push(uni + (major ? (lang === "zh" ? " " : ", ") + major : ""));
  lines.push((lang === "zh" ? "邮箱：" : "Email: ") + email);
  if (wechat) lines.push((lang === "zh" ? "微信：" : "WeChat: ") + wechat);
  if (phone) lines.push((lang === "zh" ? "电话：" : "Phone: ") + phone);
  if (orcid) lines.push("ORCID: " + orcid);
  return lines.join("\n");
}

function monthName(n) {
  return ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"][n - 1] || "";
}

function gradEn(grad) {
  const m = String(grad).match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
  if (m) return `${monthName(Number(m[2]))} ${m[1]}`;
  const m2 = String(grad).match(/(\d{4})-(\d{1,2})/);
  if (m2) return `${monthName(Number(m2[2]))} ${m2[1]}`;
  return String(grad).trim();
}

function listEn(text) {
  const items = sentence(text, 200).split(/[、,，;；]/).map((s) => s.trim()).filter(Boolean);
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function hskOf(facts) {
  const lang = fact(facts, ["语言", "language"]);
  const m = lang.match(/HSK\s*(?:Level\s*)?([1-6]|[一二三四五六])/i);
  if (!m) return "";
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
  return m[1] in map ? map[m[1]] : m[1];
}

function gradOf(facts) {
  const direct = cleanDate(fact(facts, ["毕业", "graduat"]));
  if (direct) return direct;
  const edu = fact(facts, ["学历", "degree", "education"]);
  const range = edu.match(/(\d{4}\s*年\s*\d{1,2}\s*月)\s*[—\-–~至到]+\s*(\d{4}\s*年\s*\d{1,2}\s*月)/);
  if (range) return range[2];
  const single = edu.match(/(\d{4}\s*年\s*\d{1,2}\s*月)/);
  return single ? single[1] : "";
}

function contactBits(facts, cfg) {
  const blob = [fact(facts, ["联系方式", "contact"]), fact(facts, ["邮箱", "email"])].join(" ");
  const email = (blob.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [""])[0] || cfg.senderEmail;
  const phone = fact(facts, ["电话", "phone", "tel"]) ||
    (blob.match(/(\+\d{1,3}[\s\d-]{7,15})/) || [""])[0].trim();
  return { email, phone };
}

const EN_GLOSSARY = [
  ["计算机科学与技术", "Computer Science and Technology"],
  ["软件工程", "Software Engineering"],
  ["人工智能", "Artificial Intelligence"],
  ["计算机视觉", "computer vision"],
  ["深度学习", "deep learning"],
  ["机器学习", "machine learning"],
  ["目标检测", "object detection"],
  ["模型训练", "model training"],
  ["图像标注", "image annotation"],
  ["数据标注", "data annotation"],
  ["数据采集", "data collection"],
  ["数据集", "dataset"],
  ["图像处理", "image processing"],
  ["自然语言处理", "natural language processing"],
  ["本科生", "undergraduate"],
  ["硕士研究生", "master's student"],
  ["助教", "teaching assistant"],
  ["大学", "University"],
];

function enify(text) {
  let out = String(text || "");
  for (const [zh, en] of EN_GLOSSARY) out = out.split(zh).join(en);
  return out;
}

function localEmail(cfg, prof) {
  const f = parseFacts(cfg.profile);
  const name = cfg.signatureName;
  const uni = fact(f, ["学校", "university", "院校"]) || cfg.university;
  const major = deriveMajor(f) || (cfg.lang === "zh" ? "计算机" : "Computer Science");
  const grad = gradOf(f);
  const paper = fact(f, ["论文", "paper", "publication"]);
  const project = fact(f, ["项目", "project"]);
  const skills = fact(f, ["技能", "skill"]);
  const topics = topicsOf(prof.research, 2);
  const area = topics.length
    ? (cfg.lang === "zh" ? topics.join("、") : topics.length > 2 ? `${topics.slice(0, -1).join(", ")} and ${topics[topics.length - 1]}` : topics.join(" and "))
    : (cfg.lang === "zh" ? "这个方向" : "this area");
  const v = hashOf(prof.email) % 3;
  const sig = signatureBlock(cfg, f, cfg.lang);

  let subject;
  if ((cfg.subjectTpl || "").trim()) {
    subject = renderSubject(cfg.subjectTpl, cfg, prof);
  } else if (cfg.lang === "zh") {
    const full = `${cfg.intake}硕士申请咨询：${topics[0] || "研究方向"}`;
    subject = full.length <= 30 ? full : `${cfg.intake}硕士申请咨询`;
  } else {
    const full = `${cfg.intake} master's application - ${topics[0] || "research"}`;
    subject = full.split(/\s+/).length <= 10 ? full : `${cfg.intake} master's application`;
  }

  if (cfg.lang === "zh") {
    const openings = [
      `我是${uni}${major}专业本科生${name}${grad ? `，预计${grad}毕业` : ""}，正在准备${cfg.intake}入学的硕士申请。`,
      `我叫${name}，${uni}${major}专业本科生${grad ? `，${grad}毕业` : ""}，目前正在准备${cfg.intake}的硕士申请。`,
      `我是${uni}${major}专业的本科生${name}${grad ? `，将于${grad}毕业` : ""}，打算申请${cfg.intake}入学的硕士。`,
    ];
    const paperTitle = paper ? titleOf(paper, 70) : "";
    const paperRole = (paper.match(/本人(?:负责|参与|完成)([^。；;]{4,60})/) || [])[1];
    const projectTitle = project ? titleOf(project, 70) : "";
    const projectRole = (project.match(/本人(?:负责|参与|完成)([^。；;]{4,60})/) || [])[1];
    const paperLine = paperTitle ? `我参与过${paperTitle}的工作${paperRole ? `，负责${paperRole}` : ""}。` : "";
    const projectLine = projectTitle ? `我也参与过${projectTitle}${projectRole ? `，负责${projectRole}` : ""}。` : "";
    const skillLine = skills ? `技能方面，我熟悉${sentence(skills, 50)}。` : "";
    const evidence = [paperLine, projectLine, skillLine].filter(Boolean).join("");

    let body = `${prof.sal.zh}

您好！冒昧来信打扰，深感抱歉。

${openings[v]}

我读过您的简介，对您在${area}方面的研究很感兴趣。这也是我希望在硕士阶段深入的方向。

${evidence}

我目前在这个方向的理论基础还在起步阶段，但我愿意在入学前补上：先把您提到的几本基础文献和综述读完，再跟着课题组的节奏做具体工作。

请问您在${cfg.intake}是否招收硕士研究生？如您方便，我希望能有十分钟左右的时间向您请教需要提前准备的知识和文献；若名额已满，也恳请您给些建议。

随信附上我的简历。感谢您的时间。

此致
敬礼！

${sig}`;

    if ((body.match(/[\u4e00-\u9fff]/g) || []).length < 320) {
      body = body.replace("随信附上我的简历", "我知道自己的积累还不算多，但愿意从基础做起，先把基本功打扎实，再参与具体的工作。\n\n随信附上我的简历");
    }
    return { subject, body };
  }

  const nameFull = fact(f, ["姓名", "name"]) || name;
  const nameOnly = nameFull.split(/[（(，,]/)[0].trim() || name;
  const cname = (nameFull.match(/[（(]([^）)]{1,12})[）)]/) || [])[1] || "";
  const nameLine = cname ? `${nameOnly} (${cname})` : nameOnly;
  const gradTxt = grad ? gradEn(grad) : "";
  const hsk = hskOf(f);
  const paperTitle = paper ? titleOf(paper, 90) : "";
  const projectTitle = project ? titleOf(project, 80) : "";
  const done = [paperTitle, projectTitle].filter(Boolean).map(enify);
  const expSentence = done.length
    ? `I took part in ${done.join(" and ")}, which gave me practical experience in dataset preparation, model training and system integration.`
    : `I have worked on coursework projects in ${majorEn}, including data preparation and model training.`;
  const skillsSentence = skills ? `I also have a solid foundation in ${listEn(enify(skills))}.` : "";
  const hskSentence = hsk ? `I have passed HSK Level ${hsk}.` : "";

  const emailAddr = contactBits(f, cfg).email;
  const wechat = fact(f, ["微信", "wechat"]);
  const phoneNo = contactBits(f, cfg).phone;
  const orcid = fact(f, ["orcid"]);
  const sigEn = [
    nameLine, uni, enify(major),
    `Email: ${emailAddr}`,
    wechat ? `WeChat: ${wechat}` : "",
    phoneNo ? `Phone: ${phoneNo}` : "",
    orcid ? `ORCID: ${orcid}` : "",
  ].filter(Boolean).join("\n");

  const majorEn = enify(major);
  const para2 = [
    `My name is ${nameLine}, an undergraduate student majoring in ${majorEn} at ${uni}${gradTxt ? `, expected to graduate in ${gradTxt}` : ""}.`,
    hskSentence,
    `I have read your profile and am very interested in your research in ${area}.`,
    expSentence,
    skillsSentence,
  ].filter(Boolean).join(" ");

  const body = `${prof.sal.en}

I hope this email finds you well. Please forgive me for writing to you unexpectedly.

${para2}

While I am currently at the early stage of my understanding of ${area}, I hold a deep interest in this field. I am confident that my solid programming foundation, project experience in system integration, and strong learning ability will allow me to bridge this theoretical gap quickly before enrollment and devote myself fully to your research team. This is precisely why I sincerely hope to learn under your supervision at the master's level.

May I ask whether you will be accepting master's students in ${cfg.intake}? If convenient, I would be very grateful for a 10-15 minute online or in-person meeting to ask what knowledge and literature I should prepare in advance. If your quota for this year is already full, I would also sincerely appreciate your advice.

Please kindly find my CV enclosed for your reference; I would be very grateful if you could take a look at it when you have a moment. Thank you for your time.

Sincerely,
${sigEn}`;

  return { subject, body };
}
async function callLLM(cfg, system, user) {
  const payload = {
    model: cfg.model,
    temperature: 0.7,
    max_tokens: 1200,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  };
  if (cfg.jsonMode) payload.response_format = { type: "json_object" };

  try {
    const res = await fetch(cfg.base, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
    return JSON.parse(raw);
  } catch (err) {
    if (err.name !== "TypeError") throw err;      // real API error, don't retry via proxy
    const res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cfg.base, api_key: cfg.key, payload }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 200) throw new Error(`proxy ${data.status || res.status}: ${String(data.body || data.error).slice(0, 200)}`);
    return JSON.parse(data.body);
  }
}

async function sendMail(cfg, prof, subject, body) {
  const res = await fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      smtp: { host: cfg.smtpHost, port: cfg.smtpPort, secure: cfg.smtpSsl },
      auth: { user: cfg.senderEmail, pass: cfg.authKey },
      from_email: cfg.senderEmail,
      from_name: cfg.senderName || cfg.signatureName,
      to: prof.email,
      to_name: prof.name,
      subject, body,
      attachments: cfg.attachments,
    }),
  });
  const data = await res.json().catch(() => ({ error: "server error" }));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.ecode = data.ecode;
    throw err;
  }
  return data;
}

function mailErrorText(e) {
  const friendly = { auth: t("err_auth"), network: t("err_net"), recipient: t("err_rcpt") }[e.ecode];
  if (friendly) {
    const detail = String(e.message || "").slice(0, 90);
    return detail ? `${friendly}  ${detail}` : friendly;
  }
  return e.message || t("err_unknown");
}

async function testLogin() {
  showError("");
  const ok = $("#test_result");
  ok.classList.add("hidden");
  const btn = $("#btn_test");
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("generating");
  try {
    const cfg = readConfig();
    const res = await fetch("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtp: { host: cfg.smtpHost, port: cfg.smtpPort, secure: cfg.smtpSsl },
        auth: { user: cfg.senderEmail, pass: cfg.authKey },
      }),
    });
    const data = await res.json().catch(() => ({ error: "server error" }));
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.ecode = data.ecode;
      throw err;
    }
    ok.textContent = t("test_ok").replace("{email}", cfg.senderEmail);
    ok.classList.remove("hidden");
  } catch (e) {
    showError(mailErrorText(e));
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

/* ================================================================ config from form */
function readConfig() {
  const provider = val("llm_provider") || "deepseek";
  const demo = provider === "demo";
  const key = $("#api_key").value;
  const local = provider === "local" || (!demo && provider !== "custom" && !key.trim());
  let base = "", model = "", jsonMode = false, cost = [0, 0];
  if (provider === "custom") {
    base = val("api_base");
    model = val("api_model");
    jsonMode = $("#json_mode").checked;
    if (!base || !model) throw new Error(state.lang === "zh" ? "自定义服务商需要填写接口地址和模型名" : "A custom provider needs an endpoint and a model");
  } else if (!demo && !local) {
    const p = LLM_BASES[provider];
    base = p.base; model = val("api_model") || p.model; jsonMode = p.json; cost = p.cost;
  }

  const sp = val("smtp_provider") || "qq";
  let smtpHost, smtpPort, smtpSsl;
  if (sp === "custom") {
    smtpHost = val("smtp_host");
    smtpPort = Number(val("smtp_port")) || 465;
    smtpSsl = $("#smtp_ssl").checked;
    if (!smtpHost) throw new Error(state.lang === "zh" ? "自定义 SMTP 需要填写服务器地址" : "Custom SMTP needs a host");
  } else {
    [smtpHost, smtpPort, smtpSsl] = SMTP[sp];
  }

  const profile = $("#profile").value;
  const senderEmail = val("sender_email");
  if (!senderEmail.includes("@")) throw new Error(t("f_email"));
  if (!profile.trim()) throw new Error(t("f_profile"));

  return {
    lang: val("language") || "zh",
    demo, local, base, model, jsonMode, key, cost,
    smtpHost, smtpPort, smtpSsl,
    senderEmail, authKey: $("#auth_key").value,
    senderName: val("sender_name"),
    signatureName: profileName(profile) || val("sender_name") || senderEmail.split("@")[0],
    university: val("university"), program: val("program"), intake: val("intake"),
    profile, subjectTpl: val("subject_tpl"),
    attachments: state.attachments.map((a) => ({ name: a.name, type: a.type, b64: a.b64 })),
    delayMin: Number(val("delay_min")) || 30,
    delayMax: Number(val("delay_max")) || 70,
  };
}

/* ================================================================ preview */
async function preview() {
  showError("");
  if (!state.csv) return showError(t("err_no_csv"));
  const btn = $("#btn_preview");
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = t("generating");
  try {
    const cfg = readConfig();
    if (cfg.local && !cfg.demo && val("llm_provider") !== "local") showError(t("no_key_local"));
    if (!cfg.profs) state.profs = buildProfs(state.csv.rows);
    const prof = state.profs[0];
    if (prof.name.trim().toLowerCase() === cfg.signatureName.trim().toLowerCase()) {
      showError(state.lang === "zh"
        ? "注意：CSV 第一行的名字和你自己的姓名相同，确认一下是不是把自己当成了收件人。"
        : "Note: the first CSV row has your own name — check that this is really a recipient.");
    }
    let subject, body, tokens = 0;
    if (cfg.demo) {
      ({ subject, body } = demoEmail(cfg, prof));
    } else if (cfg.local) {
      ({ subject, body } = localEmail(cfg, prof));
    } else {
      if (!cfg.key) throw new Error(state.lang === "zh" ? "请填写 API Key" : "API key is missing");
      const { system, user } = buildPrompt(cfg, prof);
      let lastProblems = [];
      let lastError = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const prompt = attempt && lastProblems.length
            ? `${user}\n\nThe previous attempt failed these checks: ${lastProblems.join("; ")}. Fix them and return the complete JSON again.`
            : user;
          const data = await callLLM(cfg, system, prompt);
          tokens += (data.usage && data.usage.total_tokens) || 0;
          const obj = parseJsonLoose(data.choices[0].message.content);
          subject = String(obj.subject || "").split(/\s+/).join(" ").trim();
          body = String(obj.body || "").trim();
        } catch (e) {
          lastError = e.message || String(e);
          continue;
        }
        lastProblems = validate(cfg, prof, subject, body, Boolean(cfg.subjectTpl.trim()));
        if (!lastProblems.length) break;
      }
      if (!body || lastProblems.length) {
        body = "";
        const detail = lastProblems.length ? lastProblems.join(", ") : lastError;
        throw new Error((state.lang === "zh" ? "生成未通过校验：" : "generation failed validation: ") + detail);
      }
      if (cfg.subjectTpl.trim()) subject = renderSubject(cfg.subjectTpl, cfg, prof);
    }
    $("#m_to").textContent = `${t("modal_to")}${prof.name} <${prof.email}>`;
    $("#m_subject").textContent = subject;
    $("#m_body").textContent = body;
    const unit = cfg.lang === "zh" ? t("unit_chars") : t("unit_words");
    const size = cfg.lang === "zh" ? (body.match(/[\u4e00-\u9fff]/g) || []).length : body.trim().split(/\s+/).length;
    $("#m_stats").textContent = `${size} ${unit} · ${tokens} tokens`;
    $("#modal").classList.remove("hidden");
  } catch (e) {
    showError(e.message);
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
}

/* ================================================================ run */
function logAdd(kind, text, extra) {
  if (!state.run) return;
  state.run.log.unshift({ t: new Date().toLocaleTimeString(), kind, text, ...(extra || {}) });
  if (state.run.log.length > 120) state.run.log.pop();
  renderRun();
}

async function gate() {
  while (state.paused) {
    if (state.stopReq) throw new Error("stopped");
    await delay(200);
  }
  if (state.stopReq) throw new Error("stopped");
}

async function waitGap(seconds) {
  let left = seconds * 1000;
  while (left > 0) {
    await gate();
    const step = Math.min(250, left);
    await delay(step);
    left -= step;
    if (!state.paused) renderRun();
  }
}

async function startRun() {
  showError("");
  if (!state.csv) return showError(t("err_no_csv"));
  if (!confirm(t("confirm_start"))) return;

  let cfg;
  try { cfg = readConfig(); } catch (e) { return showError(e.message); }
  if (!cfg.demo && !cfg.local && !cfg.key) return showError(state.lang === "zh" ? "请填写 API Key，或选择「本地模板」" : "Add an API key, or choose the local template writer");
  if (cfg.local && !cfg.demo && val("llm_provider") !== "local") showError(t("no_key_local"));
  if (!cfg.demo && !cfg.authKey && val("smtp_provider") !== "custom") {
    return showError(state.lang === "zh" ? "请填写邮箱授权码" : "App password is missing");
  }

  state.profs = buildProfs(state.csv.rows);
  const sent = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
  state.run = {
    state: "running", total: state.profs.length, sent: 0, failed: 0, skipped: 0,
    tokensIn: 0, tokensOut: 0, calls: 0, cost: 0, startedAt: Date.now(), log: [], current: null,
  };
  state.stopReq = false; state.paused = false;
  updatePauseLabel();
  $("#btn_start").disabled = true;
  $("#btn_pause").disabled = false;
  $("#btn_stop").disabled = false;
  renderRun();

  try {
    for (const prof of state.profs) {
      await gate();
      if (sent[prof.email] && sent[prof.email].status === "sent") {
        state.run.skipped++;
        logAdd("skip", `${prof.name}: ${state.lang === "zh" ? "已发送过，跳过" : "already sent, skipped"}`);
        continue;
      }
      state.run.current = prof;
      logAdd("info", `[${prof.id}] ${prof.name} <${prof.email}> ${state.lang === "zh" ? "生成中…" : "drafting…"}`);

      let subject = "", body = "";
      try {
        if (cfg.demo) {
          ({ subject, body } = demoEmail(cfg, prof));
        } else if (cfg.local) {
          ({ subject, body } = localEmail(cfg, prof));
        } else {
          const { system, user } = buildPrompt(cfg, prof);
          let problems = ["not generated"];
          for (let attempt = 0; attempt < 3; attempt++) {
            const prompt = attempt && problems.length
              ? `${user}\n\nThe previous attempt failed these checks: ${problems.join("; ")}. Fix them and return the complete JSON again.`
              : user;
            const data = await callLLM(cfg, system, prompt);
            state.run.calls++;
            const usage = data.usage || {};
            state.run.tokensIn += usage.prompt_tokens || 0;
            state.run.tokensOut += usage.completion_tokens || 0;
            try {
              const obj = parseJsonLoose(data.choices[0].message.content);
              subject = String(obj.subject || "").split(/\s+/).join(" ").trim();
              body = String(obj.body || "").trim().replace(/\r\n/g, "\n");
            } catch (_) { problems = ["unparseable"]; continue; }
            problems = validate(cfg, prof, subject, body, Boolean(cfg.subjectTpl.trim()));
            if (!problems.length) break;
          }
          if (problems.length) throw new Error(problems.join(", "));
          if (cfg.subjectTpl.trim()) subject = renderSubject(cfg.subjectTpl, cfg, prof);
        }
      } catch (e) {
        state.run.failed++;
        logAdd("fail", `${prof.name}: ${e.message}`);
        continue;
      }

      state.run.cost = (state.run.tokensIn / 1e6) * cfg.cost[0] + (state.run.tokensOut / 1e6) * cfg.cost[1];

      try {
        await sendMail(cfg, prof, subject, body);
      } catch (e) {
        state.run.failed++;
        sent[prof.email] = { status: "failed" };
        localStorage.setItem(SENT_KEY, JSON.stringify(sent));
        logAdd("fail", `${prof.name}: ${mailErrorText(e)}`);
        await delay(1500);
        continue;
      }

      state.run.sent++;
      sent[prof.email] = { status: "sent", ts: Date.now(), subject };
      localStorage.setItem(SENT_KEY, JSON.stringify(sent));
      logAdd("ok", `${prof.name}: ${state.lang === "zh" ? "已发送" : "sent"}`, { subject });
      renderRun();

      if (state.run.sent + state.run.failed < state.run.total) {
        const gap = cfg.delayMin + Math.random() * Math.max(0, cfg.delayMax - cfg.delayMin);
        logAdd("info", state.lang === "zh" ? `等待 ${Math.round(gap)} 秒` : `waiting ${Math.round(gap)}s`);
        await waitGap(gap);
      }
    }
    state.run.state = "done";
  } catch (e) {
    state.run.state = e.message === "stopped" ? "stopped" : "error";
    if (e.message !== "stopped") logAdd("fail", e.message);
  } finally {
    state.run.current = null;
    $("#btn_start").disabled = false;
    $("#btn_pause").disabled = true;
    $("#btn_stop").disabled = true;
    renderRun();
  }
}

/* ================================================================ render */
function setBadge(s) {
  const badge = $("#state_badge");
  badge.textContent = t("state_" + s);
  badge.className = "badge " + s;
}

function renderRun() {
  const r = state.run;
  if (!r) return;
  const done = r.sent + r.failed + r.skipped;
  const pct = r.total ? Math.min(100, Math.round((done / r.total) * 100)) : 0;
  const elapsed = (Date.now() - r.startedAt) / 1000;
  const avg = done ? elapsed / done : 0;
  const eta = r.state === "running" && done ? avg * (r.total - done) : 0;

  const ring = $("#ring");
  ring.style.setProperty("--p", pct);
  $("#pct").textContent = pct + "%";
  $("#current").textContent = r.current ? `${r.current.name} · ${r.current.email}` : (r.state === "done" ? t("state_done") : "—");

  $("#s_sent").textContent = r.sent;
  $("#s_left").textContent = Math.max(0, r.total - done);
  $("#s_fail").textContent = r.failed;
  $("#s_total").textContent = r.total;
  $("#s_elapsed").textContent = fmtDur(elapsed);
  $("#s_eta").textContent = r.state === "running" ? fmtDur(eta) : "—";
  $("#s_calls").textContent = r.calls;
  $("#s_tokens").textContent = fmtNum(r.tokensIn + r.tokensOut);
  $("#s_cost").textContent = "$" + (r.cost || 0).toFixed(4);
  setBadge(r.state);
  state.last = r;

  const log = $("#log");
  if (r.log.length) {
    log.innerHTML = r.log.slice(0, 60).map((e) =>
      `<li class="${e.kind}"><span class="t">${e.t}</span><span class="txt">${escapeHtml(e.text)}${
        e.subject ? `<span class="subj">${escapeHtml(e.subject)}</span>` : ""}</span></li>`
    ).join("");
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ================================================================ wiring */
function readFileB64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function renderAttachments() {
  const ul = $("#att_list");
  ul.innerHTML = "";
  state.attachments.forEach((a, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = `${a.name} · ${(a.size / 1024).toFixed(0)} KB`;
    const b = document.createElement("button");
    b.textContent = t("att_remove");
    b.onclick = () => { state.attachments.splice(i, 1); renderAttachments(); };
    li.append(span, b);
    ul.appendChild(li);
  });
}

function updatePauseLabel() {
  const b = $("#btn_pause");
  if (b) b.textContent = state.paused ? t("btn_resume") : t("btn_pause");
}

function syncVisibility() {
  document.querySelector(".custom-smtp").classList.toggle("hidden", $("#smtp_provider").value !== "custom");
  document.querySelector(".custom-llm").classList.toggle("hidden", $("#llm_provider").value !== "custom");
}

function applyLlmPreset(force = true) {
  const p = $("#llm_provider").value;
  if (p === "demo") { $("#api_model").value = "demo"; $("#api_model").disabled = true; return; }
  $("#api_model").disabled = false;
  const preset = LLM_BASES[p];
  if (preset && (force || !$("#api_model").value)) $("#api_model").value = preset.model;
}

function save() {
  const data = {};
  ["sender_email", "smtp_provider", "sender_name", "llm_provider", "api_model", "api_base",
   "university", "program", "intake", "language", "profile", "delay_min", "delay_max",
   "smtp_host", "smtp_port", "subject_tpl"].forEach((k) => { const el = $("#" + k); if (el) data[k] = el.value; });
  localStorage.setItem(FORM_KEY, JSON.stringify(data));
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(FORM_KEY) || "{}");
    Object.entries(saved).forEach(([k, v]) => {
      const el = $("#" + k);
      if (el && el.type !== "password" && k !== "profile") el.value = v;
    });
    const p = (saved.profile || "").trim();
    const isSample = !p || p === SAMPLE_ZH.trim() || p === SAMPLE_EN.trim();
    if (p && !isSample) $("#profile").value = saved.profile;
    else $("#profile").value = state.samples[state.lang];
  } catch (_) {}
}

function bind() {
  document.querySelectorAll("#lang_seg button").forEach((b) => {
    b.addEventListener("click", () => { state.lang = b.dataset.lang; applyLang(); });
  });
  $("#smtp_provider").addEventListener("change", syncVisibility);
  $("#llm_provider").addEventListener("change", () => { applyLlmPreset(true); syncVisibility(); });

  $("#csv_drop").addEventListener("click", () => $("#csv_file").click());
  $("#csv_file").addEventListener("click", (e) => e.stopPropagation());
  $("#csv_file").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    let text = await f.text();
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    state.csv = { name: `${f.name} · ${(f.size / 1024).toFixed(0)} KB`, rows: parseCsv(text) };
    try {
      state.profs = buildProfs(state.csv.rows);
      $("#csv_name").textContent = `${f.name} · ${state.profs.length} ${state.lang === "zh" ? "位" : "professors"}`;
    } catch (err) {
      showError(err.message);
      state.csv = null;
    }
  });

  $("#att_drop").addEventListener("click", () => $("#att_files").click());
  $("#att_files").addEventListener("click", (e) => e.stopPropagation());
  $("#att_files").addEventListener("change", async (e) => {
    for (const f of e.target.files) {
      if (state.attachments.length >= 3) break;
      state.attachments.push({ name: f.name, b64: await readFileB64(f), type: f.type || "application/pdf", size: f.size });
    }
    e.target.value = "";
    const total = state.attachments.reduce((n, a) => n + a.size, 0);
    if (total > MAX_ATTACH) {
      showError(t("big_attach"));
      state.attachments.pop();
    }
    renderAttachments();
  });

  $("#btn_preview").addEventListener("click", preview);
  $("#btn_start").addEventListener("click", startRun);
  $("#btn_test").addEventListener("click", testLogin);
  $("#btn_pause").addEventListener("click", () => {
    state.paused = !state.paused;
    updatePauseLabel();
    if (state.run) {
      state.run.state = state.paused ? "paused" : "running";
      renderRun();
    }
  });
  $("#btn_stop").addEventListener("click", () => {
    if (!confirm(t("confirm_stop"))) return;
    state.stopReq = true;
    state.paused = false;
  });
  $("#btn_reset_profile").addEventListener("click", () => {
    $("#profile").value = state.samples[state.lang];
    save();
  });
  $("#m_close").addEventListener("click", () => $("#modal").classList.add("hidden"));
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").classList.add("hidden"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#modal").classList.add("hidden"); });
  setInterval(save, 2500);
  setInterval(() => { if (state.run && state.run.state === "running") renderRun(); }, 1000);
}

/* ================================================================ boot */
(async function init() {
  state.lang = localStorage.getItem("hosted_lang") ||
    ((navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en");
  try {
    state.prompts = await (await fetch("/prompts.json")).json();
  } catch (e) {
    document.body.innerHTML = "<p style='font:16px system-ui;padding:40px'>prompts.json could not be loaded.</p>";
    return;
  }
  applyLang();
  restore();
  applyLlmPreset(false);
  syncVisibility();
  bind();
})();

/* Shared script: bilingual toggle for the landing page, markdown renderer for the manual. */

const I18N = {
  zh: {
    brand: "教授邮件助手",
    nav_how: "怎么用", nav_start: "快速开始", nav_manual: "使用手册",
    kicker: "本机运行 · 不上传任何凭据",
    h1: "给每位教授，写一封只属于他的信",
    lead: "上传一份教授名单和一份自己的背景资料，它按每位教授的研究方向单独写信——不是群发模板——再通过你自己的邮箱逐封发出，附上简历，并实时告诉你发到第几封。",
    btn_start: "快速开始", btn_manual: "阅读使用手册", btn_open: "打开应用",
    b1: "零依赖", b2: "中英双语界面", b3: "MIT 许可",
    how_h2: "它到底做了什么", how_lead: "三步，全部在你自己的电脑上完成。",
    step1_t: "读名单", step1_d: "解析 CSV：姓名、邮箱、职称、院系、研究方向。没有邮箱的行跳过，重复的邮箱只发一次。",
    step2_t: "单独写", step2_d: "用你选的模型，结合你的背景和这位教授的方向写一封信；格式校验不过就重写，最多三次。",
    step3_t: "逐封发", step3_d: "经你的 SMTP 发出，附件带上简历；可暂停、可停止，重跑自动跳过已发的。",
    feat_h2: "为什么不是群发",
    f1_t: "每封都不同", f1_d: "第 3–5 段围绕该教授的研究方向重写，提示词明确禁止只替换关键词。",
    f2_t: "只用真事实", f2_d: "模型只能使用「申请人背景」里写的内容，成绩、论文、奖项、联系方式都不会被编造。",
    f3_t: "固定格式", f3_d: "称呼 → 自我介绍 → 经历 → 提问 → 此致/敬礼 → 署名，中英各一套。",
    f4_t: "实时进度", f4_d: "已发/剩余/失败、用时、预计剩余、Token 与预估费用，逐封日志。",
    f5_t: "不会重复", f5_d: "发送记录写在 runs/ 里，中断后重跑从没发过的地方继续。",
    f6_t: "凭据不落盘", f6_d: "授权码与 API Key 只存在内存，程序一关就没了；只监听 127.0.0.1。",
    start_h2: "快速开始", start_lead: "需要 Python 3.9+，不需要安装任何第三方库。",
    s1: "克隆仓库", s2: "启动，然后打开 http://127.0.0.1:8765",
    start_note: "Windows 也可以直接双击 start.bat。第一次使用建议先选「演示模式」，点「预览第一封」看格式，不会发送。",
    faq_h2: "几个常见问题",
    q1: "它会自动替我发邮件吗？", a1: "不会。所有邮件都在你本机生成，由你点「开始发送」才发出，发送前还有一次确认。",
    q2: "我的邮箱密码会被上传吗？", a2: "不会。授权码只存在内存里，用于这一次连接；程序关闭即消失，也不写日志。",
    q3: "能放在网上给所有人用吗？", a3: "不建议。别人的邮箱授权码会经过你的服务器。让每个人在自己电脑上运行更安全。",
    q4: "支持哪些模型和邮箱？", a4: "DeepSeek、OpenAI、Kimi、SiliconFlow 或任意 OpenAI 兼容接口；QQ、Gmail、Outlook、163、126 或自定义 SMTP。",
    foot_left: "MIT License · 本地运行，凭据不上传", foot_manual: "使用手册",
    nav_home: "返回首页", loading: "载入中…", nav_about: "关于",
  },
  en: {
    brand: "Professor Outreach",
    nav_how: "How it works", nav_start: "Quick start", nav_manual: "Manual",
    kicker: "Runs on your machine · no credentials uploaded",
    h1: "A separate letter for every professor",
    lead: "Load a list of professors and one profile of yourself. It writes an individual email around each professor's research, sends them one by one from your own mailbox with your CV attached, and shows you the queue in real time.",
    btn_start: "Quick start", btn_manual: "Read the manual", btn_open: "Open the app",
    b1: "No dependencies", b2: "Chinese & English UI", b3: "MIT licensed",
    how_h2: "What it actually does", how_lead: "Three steps, all on your own computer.",
    step1_t: "Reads the list", step1_d: "Parses the CSV: name, email, title, institute, research areas. Rows without an email are skipped and no address is ever emailed twice.",
    step2_t: "Writes each letter", step2_d: "Your chosen model writes from your profile plus that professor's areas; a draft that fails the format checks is rewritten, up to three times.",
    step3_t: "Sends one by one", step3_d: "Goes out through your own SMTP with the CV attached. Pause, stop, and resume later without repeats.",
    feat_h2: "Why this is not a mail merge",
    f1_t: "Every letter differs", f1_d: "Paragraphs 3–5 are rewritten around that professor's area; the prompt forbids keyword-swapping.",
    f2_t: "Only real facts", f2_d: "The model may use only what you put in the profile box. No invented grades, papers, awards or contact details.",
    f3_t: "Fixed structure", f3_d: "Salutation → introduction → experience → one request → sign-off → signature, in Chinese and in English.",
    f4_t: "Live tracking", f4_d: "Sent, remaining, failed, elapsed, time left, tokens and cost, with a per-email log.",
    f5_t: "Never twice", f5_d: "Sends are recorded under runs/, so an interrupted run resumes where it stopped.",
    f6_t: "Secrets stay local", f6_d: "The app password and API key live in memory only and vanish when the process ends. Binds to 127.0.0.1.",
    start_h2: "Quick start", start_lead: "Python 3.9+ and nothing else to install.",
    s1: "Clone the repo", s2: "Start it, then open http://127.0.0.1:8765",
    start_note: "On Windows you can just double-click start.bat. On a first run, pick Demo mode and press Preview to check the formatting without sending anything.",
    faq_h2: "Common questions",
    q1: "Does it send emails on its own?", a1: "No. Everything is generated locally and only leaves when you press Start, after a confirmation dialog.",
    q2: "Is my mailbox password uploaded anywhere?", a2: "No. The app password is held in memory for the SMTP connection and is never written to disk.",
    q3: "Can I host it publicly for everyone?", a3: "Not advisable — other people's mailbox passwords would pass through your server. Local use is safer.",
    q4: "Which models and mailboxes work?", a4: "DeepSeek, OpenAI, Kimi, SiliconFlow or any OpenAI-compatible endpoint; QQ, Gmail, Outlook, 163, 126 or custom SMTP.",
    foot_left: "MIT License · runs locally, credentials never uploaded", foot_manual: "Manual",
    nav_home: "Back to home", loading: "Loading…", nav_about: "About",
  },
};

function currentLang() {
  return localStorage.getItem("site_lang") ||
    ((navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en");
}

function applyLang(lang) {
  localStorage.setItem("site_lang", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = (I18N[lang] || {})[el.dataset.i18n];
    if (v) el.textContent = v;
  });
  const btn = document.getElementById("lang");
  if (btn) btn.textContent = lang === "zh" ? "EN" : "中文";
}

function initLang() {
  const lang = currentLang();
  applyLang(lang);
  const btn = document.getElementById("lang");
  if (btn) btn.addEventListener("click", () => applyLang(lang === "zh" ? "en" : "zh"));
}

/* ------------------------------------------------------------------ markdown */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  return s.split(/(`[^`]+`)/g).map((part) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return `<code>${part.slice(1, -1)}</code>`;
    }
    return part
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }).join("");
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      closeList();
      const buf = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) buf.push(lines[i]);
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    if (/^###\s+/.test(line)) { closeList(); out.push(`<h3>${inline(esc(line.slice(4).trim()))}</h3>`); continue; }
    if (/^##\s+/.test(line)) { closeList(); out.push(`<h2>${inline(esc(line.slice(3).trim()))}</h2>`); continue; }
    if (/^#\s+/.test(line)) { closeList(); out.push(`<h1>${inline(esc(line.slice(2).trim()))}</h1>`); continue; }
    if (/^---+\s*$/.test(line)) { closeList(); out.push("<hr>"); continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
      out.push(`<li>${inline(esc(line.replace(/^\s*[-*]\s+/, "")))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
      out.push(`<li>${inline(esc(line.replace(/^\s*\d+\.\s+/, "")))}</li>`);
      continue;
    }
    if (!line.trim()) { closeList(); continue; }

    closeList();
    const buf = [line.trim()];
    while (i + 1 < lines.length && lines[i + 1].trim() &&
           !/^(#{1,3}\s|```|---|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i + 1])) {
      buf.push(lines[++i].trim());
    }
    out.push(`<p>${inline(esc(buf.join(" ")))}</p>`);
  }
  closeList();
  return out.join("\n");
}

async function initManual() {
  const doc = document.getElementById("doc");
  if (!doc) return;
  try {
    const md = await (await fetch("/manual.md")).text();
    doc.innerHTML = renderMarkdown(md);
  } catch (e) {
    doc.innerHTML = '<p class="loading">Could not load the manual.</p>';
    return;
  }

  const toc = document.getElementById("toc");
  if (toc) {
    let n = 0;
    doc.querySelectorAll("h1, h2").forEach((h) => {
      h.id = "h" + ++n;
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      a.className = h.tagName === "H1" ? "lvl1" : "lvl2";
      toc.appendChild(a);
    });
  }
}

initLang();
initManual();

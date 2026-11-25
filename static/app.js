const $ = (s) => document.querySelector(s);
const val = (id) => ($("#" + id) ? $("#" + id).value.trim() : "");

/* ================================================================ i18n */
const I18N = {
  zh: {
    title: "教授邮件助手",
    subtitle: "上传名单与简历，为每位教授单独写一封信，逐封发出",
    local: "本地运行",
    sec_mail: "发件邮箱", sec_ai: "AI 服务商", sec_content: "内容",
    sec_files: "收件人与附件", sec_pace: "发送节奏",
    f_email: "发件邮箱", f_provider: "邮箱服务商", f_smtp_host: "SMTP 服务器",
    f_auth: "授权码 / 应用专用密码",
    f_auth_hint: "QQ 邮箱：设置 → 账户 → POP3/IMAP/SMTP 服务 → 生成授权码",
    f_name: "发件人姓名",
    f_llm: "服务商", f_model: "模型", f_key: "API Key", f_base: "接口地址",
    f_jsonmode: "支持 JSON 模式", opt_custom_smtp: "自定义 SMTP",
    opt_custom_llm: "自定义接口", opt_demo: "演示模式（只能预览）",
    f_university: "学校", f_intake: "入学时间", f_program: "申请项目",
    f_lang: "邮件语言", f_profile: "申请人背景（邮件只能使用这里的事实）",
    f_profile_hint: "上面是示例数据 — 用之前请整段换成你自己的信息。邮件只会使用这里的事实。",
    f_subject: "邮件主题（可选）",
    f_subject_hint: "留空则让 AI 拟定。可用变量：{方向}（院系目录原文）{姓名} {学校} {入学} {教授} {项目}",
    reset_profile: "恢复示例",
    f_csv_choose: "点击选择 CSV", f_csv_hint: "需包含 姓名 / 邮箱 / 研究方向 三列",
    f_att_add: "添加附件", f_att_hint: "简历 PDF 等，可多选，总大小 ≤ 25 MB",
    f_dmin: "最小间隔（秒）", f_dmax: "最大间隔（秒）",
    f_pace_hint: "间隔太短容易被邮箱服务商限流。中途可以随时暂停或停止。",
    btn_preview: "预览第一封", btn_start: "开始发送", btn_pause: "暂停",
    btn_resume: "继续", btn_stop: "停止",
    done_label: "已完成", elapsed: "已用时", eta: "预计剩余",
    sent: "已发送", left: "剩余", failed: "失败", total: "总计",
    calls: "API 调用", tokens_used: "Token", cost_est: "预估费用",
    log: "日志", log_empty: "还没有开始。", modal_close: "关闭",
    foot: "只在本机运行 · 凭据仅存于内存 · 已发送的地址不会重复发送",
    state_idle: "未开始", state_starting: "启动中", state_connecting: "连接中",
    state_running: "发送中", state_paused: "已暂停", state_done: "已完成",
    state_stopped: "已停止", state_error: "出错",
    att_remove: "移除", confirm_start: "将按 CSV 中的地址逐封发送邮件，确认开始？",
    confirm_stop: "停止发送？已发送的记录会保留，重跑可以接着发。",
    err_no_csv: "请先上传 CSV 文件", generating: "生成中…",
    modal_to: "收件人：", unit_chars: "字", unit_words: "个词",
  },
  en: {
    title: "Professor Outreach",
    subtitle: "Upload a roster and a CV — it writes a separate email for each professor and sends them one by one",
    local: "Local only",
    sec_mail: "Sending mailbox", sec_ai: "AI provider", sec_content: "Content",
    sec_files: "Recipients & attachments", sec_pace: "Pacing",
    f_email: "From address", f_provider: "Provider", f_smtp_host: "SMTP server",
    f_auth: "App password / auth code",
    f_auth_hint: "QQ Mail: Settings → Account → POP3/IMAP/SMTP → generate an authorization code",
    f_name: "Sender name",
    f_llm: "Provider", f_model: "Model", f_key: "API key", f_base: "Endpoint",
    f_jsonmode: "Supports JSON mode", opt_custom_smtp: "Custom SMTP",
    opt_custom_llm: "Custom (OpenAI-compatible)", opt_demo: "Demo mode (preview only)",
    f_university: "University", f_intake: "Intake", f_program: "Programme",
    f_lang: "Email language", f_profile: "Applicant profile (the only facts an email may use)",
    f_profile_hint: "This is sample data — replace the whole block with your own. Emails may only use what is here.",
    f_subject: "Subject line (optional)",
    f_subject_hint: "Leave empty to let the AI write it. Variables: {方向} {姓名} {学校} {入学} {教授} {项目}",
    reset_profile: "Reset to sample",
    f_csv_choose: "Click to choose a CSV", f_csv_hint: "Needs name / email / research columns",
    f_att_add: "Add attachments", f_att_hint: "CV PDF and others, multiple files, 25 MB total",
    f_dmin: "Min gap (seconds)", f_dmax: "Max gap (seconds)",
    f_pace_hint: "Short gaps get rate-limited. You can pause or stop whenever you want.",
    btn_preview: "Preview first", btn_start: "Start sending", btn_pause: "Pause",
    btn_resume: "Resume", btn_stop: "Stop",
    done_label: "done", elapsed: "Elapsed", eta: "Time left",
    sent: "Sent", left: "Left", failed: "Failed", total: "Total",
    calls: "API calls", tokens_used: "Tokens", cost_est: "Est. cost",
    log: "Log", log_empty: "Nothing yet.", modal_close: "Close",
    foot: "Runs on this machine · credentials stay in memory · nobody is emailed twice",
    state_idle: "Idle", state_starting: "Starting", state_connecting: "Connecting",
    state_running: "Sending", state_paused: "Paused", state_done: "Finished",
    state_stopped: "Stopped", state_error: "Error",
    att_remove: "Remove", confirm_start: "Send to every address in the CSV, one at a time. Start?",
    confirm_stop: "Stop sending? Sent records are kept and rerunning resumes from there.",
    err_no_csv: "Upload a CSV file first", generating: "Generating…",
    modal_to: "To: ", unit_chars: "chars", unit_words: "words",
  },
};

const state = { lang: "zh", csv: null, attachments: [], jobId: null, timer: null, paused: false,
                presets: {}, last: null, defaultProfile: "", samples: { zh: "", en: "" } };

// Bump the storage key whenever the meaning of stored fields changes, so a stale
// browser profile can never shadow a new default.
const STORE = "outreach_form_v3";

const t = (k) => (I18N[state.lang] || I18N.zh)[k] ?? k;

function applyLang() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("#lang_seg button").forEach((b) => b.classList.toggle("on", b.dataset.lang === state.lang));

  // the sample profile follows the interface language, unless the user has edited it
  const box = $("#profile");
  const cur = (box.value || "").trim();
  const pristine = !cur || cur === (state.samples.zh || "").trim() || cur === (state.samples.en || "").trim();
  if (state.samples[state.lang]) state.defaultProfile = state.samples[state.lang];
  if (pristine && state.defaultProfile) box.value = state.defaultProfile;

  renderAttachments();
  updatePauseLabel();
  if (state.last) setBadge(state.last.state);
  if (state.csv) $("#csv_name").textContent = `${state.csv.name} · ${(state.csv.size / 1024).toFixed(0)} KB`;
  localStorage.setItem("outreach_lang", state.lang);
}

/* ================================================================ helpers */
async function api(path, body, method = "POST") {
  const opts = { method, headers: {} };
  if (body !== null && body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({ error: "server error" }));
  if (!res.ok) throw new Error(data.error || "request failed");
  return data;
}

function readB64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
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

function showError(msg) {
  const el = $("#form_error");
  el.textContent = msg || "";
  el.classList.toggle("hidden", !msg);
}

/* ================================================================ startup */
(async function init() {
  state.lang = localStorage.getItem("outreach_lang") ||
    ((navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en");
  applyLang();

  try {
    const d = await api("/api/defaults", null, "GET");
    state.presets = d.llm || {};
    state.samples = { zh: d.profile_zh || d.profile || "", en: d.profile_en || d.profile_zh || "" };
    state.defaultProfile = state.samples[state.lang] || state.samples.zh;
    if (!$("#profile").value) $("#profile").value = state.defaultProfile;
  } catch (_) { /* ignore */ }

  restore();
  applyLlmPreset(false);
  syncVisibility();
  bind();
  setInterval(save, 2000);
})();

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
    Object.entries(saved).forEach(([k, v]) => {
      const el = $("#" + k);
      if (el && el.type !== "password" && k !== "profile") el.value = v;
    });

    // A stored profile only wins if the user actually wrote it; a stored *sample* must not
    // override the sample for the current interface language.
    const savedProfile = (saved.profile || "").trim();
    const isSample = !savedProfile
      || savedProfile === (state.samples.zh || "").trim()
      || savedProfile === (state.samples.en || "").trim();
    if (savedProfile && !isSample) $("#profile").value = saved.profile;
    else if (state.defaultProfile) $("#profile").value = state.defaultProfile;
  } catch (_) {}
}

function save() {
  const data = {};
  ["sender_email", "smtp_provider", "sender_name", "llm_provider", "api_model", "api_base",
   "university", "program", "intake", "language", "profile", "delay_min", "delay_max",
   "smtp_host", "smtp_port", "subject_tpl"].forEach((k) => { const el = $("#" + k); if (el) data[k] = el.value; });
  localStorage.setItem(STORE, JSON.stringify(data));
}

/* ================================================================ ui */
function syncVisibility() {
  document.querySelector(".custom-smtp").classList.toggle("hidden", $("#smtp_provider").value !== "custom");
  document.querySelector(".custom-llm").classList.toggle("hidden", $("#llm_provider").value !== "custom");
}

function applyLlmPreset(force = true) {
  const p = $("#llm_provider").value;
  if (p === "demo") { $("#api_model").value = "demo"; $("#api_model").disabled = true; return; }
  $("#api_model").disabled = false;
  const preset = state.presets[p];
  if (preset && (force || !$("#api_model").value)) $("#api_model").value = preset.model;
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
    state.csv = { name: f.name, b64: await readB64(f), size: f.size };
    $("#csv_name").textContent = `${f.name} · ${(f.size / 1024).toFixed(0)} KB`;
  });

  $("#att_drop").addEventListener("click", () => $("#att_files").click());
  $("#att_files").addEventListener("click", (e) => e.stopPropagation());
  $("#att_files").addEventListener("change", async (e) => {
    for (const f of e.target.files) {
      if (state.attachments.length >= 5) break;
      state.attachments.push({ name: f.name, b64: await readB64(f), type: f.type || "application/pdf", size: f.size });
    }
    e.target.value = "";
    renderAttachments();
  });

  $("#btn_preview").addEventListener("click", preview);
  $("#btn_start").addEventListener("click", start);
  $("#btn_pause").addEventListener("click", togglePause);
  $("#btn_stop").addEventListener("click", stop);
  $("#btn_reset_profile").addEventListener("click", () => {
    $("#profile").value = state.samples[state.lang] || state.defaultProfile;
    save();
  });
  $("#m_close").addEventListener("click", () => $("#modal").classList.add("hidden"));
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").classList.add("hidden"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#modal").classList.add("hidden"); });
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

/* ================================================================ actions */
function payload(send) {
  return {
    sender_email: val("sender_email"),
    auth_key: $("#auth_key").value,
    smtp_provider: val("smtp_provider"),
    smtp_host: val("smtp_host"),
    smtp_port: val("smtp_port") || 465,
    smtp_ssl: $("#smtp_ssl").checked,
    sender_name: val("sender_name"),
    llm_provider: val("llm_provider"),
    api_key: $("#api_key").value,
    api_model: val("api_model"),
    api_base: val("api_base"),
    json_mode: $("#json_mode").checked,
    university: val("university"),
    program: val("program"),
    intake: val("intake"),
    language: val("language"),
    subject_tpl: val("subject_tpl"),
    ui_lang: state.lang,
    profile: $("#profile").value,
    delay_min: Number(val("delay_min")) || 30,
    delay_max: Number(val("delay_max")) || 70,
    csv_b64: state.csv ? state.csv.b64 : "",
    attachments: state.attachments.map((a) => ({ name: a.name, b64: a.b64, type: a.type })),
    send,
  };
}

async function preview() {
  showError("");
  if (!state.csv) return showError(t("err_no_csv"));
  const btn = $("#btn_preview");
  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = t("generating");
  try {
    const r = await api("/api/preview", payload(false));
    $("#m_to").textContent = `${t("modal_to")}${r.name} <${r.to}>`;
    $("#m_subject").textContent = r.subject;
    $("#m_body").textContent = r.body;
    $("#m_stats").textContent = `${r.chars} ${r.unit === "words" ? t("unit_words") : t("unit_chars")} · ${r.tokens || 0} tokens`;
    $("#modal").classList.remove("hidden");
  } catch (e) {
    showError(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

async function start() {
  showError("");
  if (!state.csv) return showError(t("err_no_csv"));
  if (!confirm(t("confirm_start"))) return;
  const btn = $("#btn_start");
  btn.disabled = true;
  try {
    const r = await api("/api/start", payload(true));
    state.jobId = r.job_id;
    state.paused = false;
    updatePauseLabel();
    $("#btn_pause").disabled = false;
    $("#btn_stop").disabled = false;
    poll();
    state.timer = setInterval(poll, 1200);
  } catch (e) {
    showError(e.message);
    btn.disabled = false;
  }
}

async function togglePause() {
  if (!state.jobId) return;
  state.paused = !state.paused;
  updatePauseLabel();
  try { await api(state.paused ? "/api/pause" : "/api/resume", { id: state.jobId }); }
  catch (e) { showError(e.message); }
}

async function stop() {
  if (!state.jobId) return;
  if (!confirm(t("confirm_stop"))) return;
  try { await api("/api/stop", { id: state.jobId }); } catch (e) { showError(e.message); }
}

/* ================================================================ polling */
async function poll() {
  if (!state.jobId) return;
  try {
    const s = await api("/api/status?id=" + state.jobId, null, "GET");
    state.last = s;
    render(s);
    if (["done", "error", "stopped"].includes(s.state)) {
      clearInterval(state.timer);
      $("#btn_start").disabled = false;
      $("#btn_pause").disabled = true;
      $("#btn_stop").disabled = true;
    }
  } catch (e) {
    clearInterval(state.timer);
    showError(e.message);
  }
}

function setBadge(s) {
  const badge = $("#state_badge");
  const label = t("state_" + s);
  badge.textContent = label;
  badge.className = "badge " + s;
}

function render(s) {
  const done = s.sent + s.failed + s.skipped;
  const pct = s.total ? Math.min(100, Math.round((done / s.total) * 100)) : 0;

  const ring = $("#ring");
  ring.style.setProperty("--p", pct);
  ring.style.setProperty("--rc", s.failed > 0 && done === s.total ? "var(--red)" : "var(--indigo)");
  $("#pct").textContent = pct + "%";

  $("#current").textContent = s.current && s.current.name
    ? `${s.current.name} · ${s.current.email}`
    : (s.state === "done" ? t("state_done") : "—");

  $("#s_sent").textContent = s.sent;
  $("#s_left").textContent = Math.max(0, s.total - done);
  $("#s_fail").textContent = s.failed;
  $("#s_total").textContent = s.total;
  $("#s_elapsed").textContent = fmtDur(s.elapsed);
  $("#s_eta").textContent = s.state === "running" ? fmtDur(s.eta) : "—";
  $("#s_calls").textContent = s.api_calls;
  $("#s_tokens").textContent = fmtNum(s.tokens_in + s.tokens_out);
  $("#s_cost").textContent = "$" + (s.cost || 0).toFixed(4);

  setBadge(s.state);

  const log = $("#log");
  if (s.log && s.log.length) {
    log.innerHTML = s.log.map((e) =>
      `<li class="${e.kind}"><span class="t">${e.t}</span><span class="txt">${escapeHtml(e.text)}${
        e.subject ? `<span class="subj">${escapeHtml(e.subject)}</span>` : ""}</span></li>`
    ).join("");
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

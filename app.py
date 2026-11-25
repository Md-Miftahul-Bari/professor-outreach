#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Professor outreach — local web app.

    python app.py            # then open http://127.0.0.1:8765

Everything runs on this machine. Credentials are kept in memory for the duration of a job and are never
written to disk; only the send log and progress are saved under runs/.
"""

from __future__ import annotations

import argparse
import base64
import csv
import io
import json
import random
import re
import smtplib
import ssl
import threading
import time
import urllib.error
import urllib.request
import uuid
from collections import deque
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
RUNS = ROOT / "runs"

CJK = re.compile(r"[\u4e00-\u9fff]")

# Prompts and validation rules live in site/prompts.json, shared with the hosted edition.
PROMPTS = json.loads((ROOT / "site" / "prompts.json").read_text(encoding="utf-8"))

# ---------------------------------------------------------------- provider presets
SMTP_PRESETS = {
    "qq": ("smtp.qq.com", 465, True),
    "gmail": ("smtp.gmail.com", 465, True),
    "outlook": ("smtp.office365.com", 587, False),
    "163": ("smtp.163.com", 465, True),
    "126": ("smtp.126.com", 465, True),
}

LLM_PRESETS = {
    "deepseek": ("https://api.deepseek.com/chat/completions", "deepseek-chat", True, 0.27, 1.10),
    "openai": ("https://api.openai.com/v1/chat/completions", "gpt-4o-mini", True, 0.15, 0.60),
    "moonshot": ("https://api.moonshot.cn/v1/chat/completions", "moonshot-v1-8k", True, 1.70, 1.70),
    "siliconflow": ("https://api.siliconflow.cn/v1/chat/completions", "deepseek-ai/DeepSeek-V3", True, 0.27, 1.10),
}

DEFAULT_PROFILE_EN = """Name: Wang Xiaoming, Chinese, currently based in Shanghai.
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

-- Everything above is sample data (example.com, ORCID 0000-0000). Replace the whole block with your own."""
DEFAULT_PROFILE_ZH = """姓名：王小明（Wang Xiaoming），中国籍，目前在上海市。
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

—— 以上全部是示例数据（example.com、0000-0000 的 ORCID）。用的时候请整段替换成你自己的真实信息。"""

DEFAULT_PROFILE = DEFAULT_PROFILE_ZH  # backwards-compatible alias

# ---------------------------------------------------------------- server messages
MSG = {
    "zh": {
        "csv_cols": "无法识别列名，需要包含 姓名 / 邮箱 / 研究方向。当前列：{cols}",
        "custom_llm_need": "自定义服务商需要填写接口地址和模型名",
        "custom_smtp_need": "自定义 SMTP 需要填写服务器地址",
        "need_sender": "请填写发件邮箱",
        "need_auth": "请填写邮箱授权码 / 应用专用密码",
        "need_profile": "请填写申请人背景资料",
        "need_csv": "请上传 CSV 文件",
        "csv_decode": "CSV 解码失败：{err}",
        "attach_too_big": "附件总大小超过 25 MB",
        "no_emails": "CSV 里没有可用的邮箱",
        "demo_only": "演示模式只能预览，不能发送。请选择真实的服务商并填入 API Key。",
        "skip": "已发送过，跳过",
        "generating": "[{pid}] {name} <{email}> 生成中…",
        "gen_failed": "{name}：生成失败 {err}",
        "preview_ok": "{name}：预览（未发送）",
        "connecting": "连接 {host}:{port}…",
        "smtp_ok": "SMTP 登录成功",
        "rate_limit": "触发频率限制，暂停 10 分钟",
        "send_exc": "发送异常 {err}，重连",
        "paused": "已暂停",
        "resumed": "继续",
        "stop_req": "已请求停止",
        "waiting": "等待 {sec} 秒",
        "aborted": "任务中止：{err}",
        "auth_failed": "SMTP 认证失败：检查邮箱地址与授权码",
        "gen_invalid": "生成失败：三次都未通过校验",
        "api_key_empty": "API Key 为空",
        "sent_ok": "{name}：已发送",
        "sent_fail": "{name}：{err}",
    },
    "en": {
        "csv_cols": "Could not find the required columns (name / email / research). Found: {cols}",
        "custom_llm_need": "A custom provider needs an endpoint URL and a model name",
        "custom_smtp_need": "A custom SMTP server needs a host name",
        "need_sender": "Enter the sending email address",
        "need_auth": "Enter the app password / authorization code",
        "need_profile": "Enter the applicant profile",
        "need_csv": "Upload a CSV file",
        "csv_decode": "Could not decode the CSV: {err}",
        "attach_too_big": "Attachments exceed 25 MB in total",
        "no_emails": "No usable email addresses in this CSV",
        "demo_only": "Demo mode can only preview. Pick a real provider and add an API key.",
        "skip": "already sent, skipped",
        "generating": "[{pid}] {name} <{email}> drafting…",
        "gen_failed": "{name}: generation failed — {err}",
        "preview_ok": "{name}: preview (not sent)",
        "connecting": "connecting to {host}:{port}…",
        "smtp_ok": "SMTP login OK",
        "rate_limit": "rate limited, pausing for 10 minutes",
        "send_exc": "send error {err}, reconnecting",
        "paused": "paused",
        "resumed": "resumed",
        "stop_req": "stop requested",
        "waiting": "waiting {sec}s",
        "aborted": "job aborted: {err}",
        "auth_failed": "SMTP authentication failed — check the address and app password",
        "gen_invalid": "generation failed: 3 attempts did not pass validation",
        "api_key_empty": "API key is empty",
        "sent_ok": "{name}: sent",
        "sent_fail": "{name}: {err}",
    },
}


def m(lang: str, key: str, **kw) -> str:
    table = MSG.get(lang) or MSG["zh"]
    return table.get(key, MSG["zh"].get(key, key)).format(**kw) if kw else table.get(key, key)


# ---------------------------------------------------------------- people
def surname(name: str, overrides: dict | None = None) -> str:
    overrides = overrides or {}
    if name.strip() in overrides:
        return overrides[name.strip()]
    toks = name.split()
    caps = [t for t in toks if len(t) > 1 and t.isupper()]
    if caps:
        return caps[-1].title()
    return toks[-1].title()


def salutations(name: str, title: str, overrides: dict | None = None) -> tuple[str, str]:
    sn = surname(name, overrides)
    t = title.lower()
    # 中文一律用"老师"：对副教授、研究员都不会叫错，也是学生写信的常规写法
    zh = f"尊敬的{sn}老师："
    if "professor" in t:
        en = f"Dear Professor {sn},"
    elif "researcher" in t or "fellow" in t:
        en = f"Dear Dr. {sn},"
    else:
        en = f"Dear {sn},"
    return zh, en


def pick(header, aliases):
    for h in header:
        hl = (h or "").strip().lower()
        if any(a in hl for a in aliases):
            return h
    return None


def decode_csv(raw: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "gb18030", "utf-16", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    raise ValueError("cannot decode CSV")


def parse_people(raw: bytes, overrides: dict | None = None, lang: str = "zh") -> list[dict]:
    text = decode_csv(raw)
    reader = csv.DictReader(io.StringIO(text))
    header = reader.fieldnames or []
    cn = pick(header, ("name", "professor", "faculty", "姓名"))
    ct = pick(header, ("title", "position", "rank", "职称"))
    ce = pick(header, ("email", "e-mail", "mail", "邮箱", "邮件"))
    cr = pick(header, ("research", "interest", "area", "work", "方向", "研究"))
    ci = pick(header, ("institute", "department", "school", "unit", "院系", "单位"))
    if not all([cn, ce, cr]):
        raise ValueError(m(lang, "csv_cols", cols=header))
    people = []
    for idx, r in enumerate(reader, 1):
        name = (r.get(cn) or "").strip()
        email = (r.get(ce) or "").strip().lower()
        if not name or "@" not in email:
            continue
        title = (r.get(ct) or "").strip() if ct else ""
        zh, en = salutations(name, title, overrides)
        people.append(
            {
                "id": f"{idx:03d}",
                "name": name,
                "title": title,
                "email": email,
                "research": " ".join((r.get(cr) or "").split()),
                "institute": (r.get(ci) or "").strip() if ci else "",
                "sal_zh": zh,
                "sal_en": en,
            }
        )
    return people


def topics(research: str, limit: int = 3) -> list[str]:
    text = re.sub(r"\([^()]*\)", " | ", research)
    parts: list[str] = []
    for chunk in re.split(r"[;,|、]", text):
        phrase = chunk.strip(" .;:-")
        if not phrase or not 1 <= len(phrase.split()) <= 8:
            continue
        if phrase.lower() not in {p.lower() for p in parts}:
            parts.append(phrase)
    return parts[:limit]


# ---------------------------------------------------------------- prompts
def profile_name(profile: str) -> str:
    hit = re.search(r"(?:姓名|Name)\s*[:：]\s*([^\n（(，,]+)", profile)
    return hit.group(1).strip() if hit else ""


def build_prompt(cfg: dict, p: dict) -> tuple[str, str]:
    """Fill the shared prompt template from site/prompts.json."""
    lang = cfg["language"]
    pack = PROMPTS[lang]
    fixed = (cfg.get("subject_tpl") or "").strip() or pack["subject_placeholder"]
    values = {
        "profile": cfg["profile"],
        "name": p["name"],
        "sal": p["sal_zh"] if lang == "zh" else p["sal_en"],
        "title": p["title"],
        "institute": p["institute"],
        "university": cfg["university"],
        "research": p["research"],
        "interests": "、".join(topics(p["research"])) or "-",
        "program": cfg["program"],
        "intake": cfg["intake"],
        "signature_name": cfg.get("signature_name") or cfg["sender_name"],
        "subject_tpl": fixed,
    }
    user = pack["user"]
    for key, value in values.items():
        user = user.replace(f"[[{key}]]", str(value))
    return pack["system"], user


def render_subject(tpl: str, p: dict, cfg: dict) -> str:
    """Fill {方向} / {姓名} / {学校} … in a user-supplied subject line."""
    top = (topics(p["research"], 1) or [""])[0]
    who = cfg.get("signature_name") or cfg["sender_name"]
    table = {
        "{方向}": top, "{topic}": top, "{area}": top,
        "{姓名}": who, "{name}": who,
        "{学校}": cfg["university"], "{university}": cfg["university"],
        "{入学}": cfg["intake"], "{intake}": cfg["intake"],
        "{教授}": p["name"], "{professor}": p["name"], "{surname}": surname(p["name"]),
        "{项目}": cfg["program"], "{program}": cfg["program"],
    }
    out = tpl
    for k, v in table.items():
        out = out.replace(k, v)
    out = re.sub(r"\{[^{}]{0,20}\}", "", out)
    out = re.sub(r"\s{2,}", " ", out).strip(" ：:-")
    return out[:120]


def demo_email(cfg: dict, p: dict) -> tuple[str, str]:
    """Fixed sample used by 演示模式 so the UI can be exercised without an API key."""
    who = cfg.get("signature_name") or cfg["sender_name"]
    prof = "、".join(topics(p["research"], 2)) or "该方向"
    subject = (cfg.get("subject_tpl") or "").strip()
    if subject:
        subject = render_subject(subject, p, cfg)
    elif cfg["language"] == "zh":
        subject = f"{cfg['intake']}硕士申请咨询（演示模式）"
    else:
        subject = f"MSc application, {cfg['intake']} (demo)"

    if cfg["language"] == "zh":
        body = f"""{p['sal_zh']}

您好！冒昧来信打扰，深感抱歉。

这是演示模式生成的示例邮件，用于检查排版，不会发送给任何人。正式运行时，第 3–5 段会由你选择的 AI
服务商，根据申请人资料和这位教授的研究方向重新撰写。

我认真阅读了您的简介，对您在{prof}方向的研究很感兴趣。

请问您在{cfg['intake']}是否招收硕士研究生？如您方便，我非常希望能有机会与您进行 10–15 分钟的线上或
线下交流，请教需要提前准备的知识和文献。若您今年名额已满，也恳请您给予建议，我将不胜感激。

随信附上我的个人简历，供您参考；若您能在百忙之中抽空查看，我将感激不尽。感谢您的时间。

此致
敬礼！

{who}
{cfg['university']}
邮箱：{cfg['sender_email']}"""
        return subject, body

    body = f"""{p['sal_en']}

Please excuse my writing to you without an introduction.

This is a sample produced by demo mode to check the layout; it is not sent to anyone. In a real run,
paragraphs 3-5 would be written by the AI provider you chose, from your profile and this professor's areas.

I have read your profile and am especially interested in your work on {prof}.

May I ask whether you will be admitting master's students in {cfg['intake']}? If it is convenient, I would
value 10-15 minutes online or in person to ask what I should read and prepare. If your places are already
filled, I would still be grateful for your advice.

I have attached my CV for reference. Thank you for your time.

Best regards,
{who}
{cfg['university']}
Email: {cfg['sender_email']}"""
    return subject, body


def validate(lang: str, p: dict, subject: str, body: str, sender_name: str,
             subject_locked: bool = False) -> list[str]:
    """Format checks driven by the shared rules in site/prompts.json."""
    rules = PROMPTS["validation"][lang]
    problems: list[str] = []
    squashed = body.replace(":", "：").replace(" ", "").replace("\u3000", "")

    if lang == "zh":
        if not squashed.startswith(p["sal_zh"].replace(":", "：").replace(" ", "")):
            problems.append("称呼不对")
        chars = len(CJK.findall(body))
        if not rules["min_chars"] <= chars <= rules["max_chars"]:
            problems.append(f"{chars} 个汉字")
        if not subject_locked and len(subject) > rules.get("max_subject_chars", 30):
            problems.append("主题太长")
    else:
        if not body.startswith(p["sal_en"]):
            problems.append("wrong salutation")
        words = len(body.split())
        if not rules["min_words"] <= words <= rules["max_words"]:
            problems.append(f"{words} words")
        if not subject_locked and len(subject.split()) > rules.get("max_subject_words", 12):
            problems.append("subject too long")

    haystack = body if lang == "zh" else body.lower()
    for needle in rules.get("must", []):
        if needle not in haystack:
            problems.append(f"missing {needle!r}")
    for phrase in rules.get("banned", []):
        if phrase in haystack:
            problems.append(f"banned {phrase!r}")
    if "[" in body or "]" in body:
        problems.append("placeholders")
    if sender_name not in body:
        problems.append("missing sign-off name")
    return problems


def call_model(cfg: dict, system: str, user: str) -> tuple[str, dict]:
    key = cfg["api_key"]
    if not key:
        raise RuntimeError(m(cfg.get("ui_lang", "zh"), "api_key_empty"))
    payload = {
        "model": cfg["api_model"],
        "temperature": 0.7,
        "max_tokens": 1200,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
    }
    if cfg.get("json_mode"):
        payload["response_format"] = {"type": "json_object"}
    req = urllib.request.Request(
        cfg["api_base"],
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
        method="POST",
    )
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"], data.get("usage", {}) or {}
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:300]
            last = f"HTTP {e.code}: {detail}"
            if e.code in (429, 500, 502, 503):
                time.sleep(4 * (attempt + 1))
                continue
            raise RuntimeError(last)
        except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError) as e:
            last = f"{type(e).__name__}: {e}"
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(last or "model call failed")


def parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        text = text[4:] if text.lower().startswith("json") else text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        s, e = text.find("{"), text.rfind("}")
        if s >= 0 and e > s:
            return json.loads(text[s : e + 1])
        raise


def generate(cfg: dict, p: dict) -> tuple[str, str, dict, int]:
    if cfg.get("demo"):
        subject, body = demo_email(cfg, p)
        return subject, body, {}, 0
    lang = cfg.get("ui_lang", "zh")
    fixed = (cfg.get("subject_tpl") or "").strip()
    who = cfg.get("signature_name") or cfg["sender_name"]
    system, user = build_prompt(cfg, p)
    tokens = 0
    for attempt in range(3):
        raw, usage = call_model(cfg, system, user)
        tokens += int(usage.get("total_tokens") or 0)
        try:
            obj = parse_json(raw)
            subject = " ".join(str(obj["subject"]).split())
            body = str(obj["body"]).strip().replace("\r\n", "\n")
        except Exception:  # noqa: BLE001
            continue
        if fixed:
            subject = render_subject(fixed, p, cfg)
        problems = validate(cfg["language"], p, subject, body, who, bool(fixed))
        if not problems:
            return subject, body, usage, tokens
    raise RuntimeError(m(lang, "gen_invalid"))


# ---------------------------------------------------------------- mail
def smtp_connect(cfg: dict):
    ctx = ssl.create_default_context()
    if cfg["smtp_ssl"]:
        s = smtplib.SMTP_SSL(cfg["smtp_host"], int(cfg["smtp_port"]), context=ctx, timeout=90)
    else:
        s = smtplib.SMTP(cfg["smtp_host"], int(cfg["smtp_port"]), timeout=90)
        s.starttls(context=ctx)
    if cfg.get("smtp_user") and cfg.get("smtp_pass"):
        s.login(cfg["smtp_user"], cfg["smtp_pass"])
    return s


def build_message(cfg: dict, p: dict, subject: str, body: str, attachments: list[dict]) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = formataddr((cfg["sender_name"], cfg["sender_email"]))
    msg["To"] = formataddr((p["name"], p["email"]))
    msg["Subject"] = subject
    msg["Reply-To"] = cfg.get("reply_to") or cfg["sender_email"]
    msg["Message-ID"] = make_msgid()
    msg.set_content(body, charset="utf-8")
    for a in attachments:
        data = base64.b64decode(a["b64"])
        maintype, _, subtype = (a.get("type") or "application/octet-stream").partition("/")
        msg.add_attachment(data, maintype=maintype or "application", subtype=subtype or "octet-stream",
                           filename=a["name"])
    return msg


# ---------------------------------------------------------------- jobs
JOBS: dict[str, "Job"] = {}
JOBS_LOCK = threading.Lock()


class Job:
    def __init__(self, cfg: dict, people: list[dict], attachments: list[dict]):
        self.id = uuid.uuid4().hex[:8]
        self.cfg = cfg
        self.people = people
        self.attachments = attachments
        self.run_dir = RUNS / self.id
        self.run_dir.mkdir(parents=True, exist_ok=True)
        self.state = "starting"
        self.error = ""
        self.started_at = time.time()
        self.finished_at: float | None = None
        self.total = len(people)
        self.sent = 0
        self.failed = 0
        self.skipped = 0
        self.tokens_in = 0
        self.tokens_out = 0
        self.api_calls = 0
        self.current = {}
        self.log: deque = deque(maxlen=150)
        self.pause = threading.Event()
        self.pause.set()
        self.stop_flag = False
        self.lock = threading.Lock()
        self.sent_log = self._load_log()

    # -- persistence of progress only (no credentials)
    def _load_log(self) -> dict:
        f = self.run_dir / "sent.json"
        if f.exists():
            try:
                return json.loads(f.read_text(encoding="utf-8"))
            except Exception:  # noqa: BLE001
                return {}
        return {}

    def _save_log(self) -> None:
        f = self.run_dir / "sent.json"
        tmp = f.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.sent_log, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.replace(f)

    def add(self, kind: str, text: str, extra: dict | None = None) -> None:
        entry = {"t": datetime.now().strftime("%H:%M:%S"), "kind": kind, "text": text}
        if extra:
            entry.update(extra)
        with self.lock:
            self.log.appendleft(entry)

    def status(self) -> dict:
        now = self.finished_at or time.time()
        elapsed = max(0.0, now - self.started_at)
        processed = self.sent + self.failed
        avg = elapsed / processed if processed else 0.0
        remaining = max(0, self.total - processed - self.skipped)
        eta = avg * remaining if processed and self.state == "running" else 0.0
        cost = (self.tokens_in / 1e6) * self.cfg.get("cost_in", 0) + (self.tokens_out / 1e6) * self.cfg.get("cost_out", 0)
        with self.lock:
            log = list(self.log)[:60]
        return {
            "job_id": self.id,
            "state": self.state,
            "error": self.error,
            "total": self.total,
            "sent": self.sent,
            "failed": self.failed,
            "skipped": self.skipped,
            "remaining": remaining,
            "elapsed": round(elapsed, 1),
            "eta": round(eta, 1),
            "avg_seconds": round(avg, 1),
            "current": self.current,
            "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out,
            "api_calls": self.api_calls,
            "cost": round(cost, 4),
            "log": log,
        }


def worker(job: Job) -> None:
    cfg = job.cfg
    ui = cfg.get("ui_lang", "zh")
    smtp = None
    try:
        job.state = "connecting"
        for p in job.people:
            if job.stop_flag:
                job.state = "stopped"
                return
            job.pause.wait()
            if job.stop_flag:
                job.state = "stopped"
                return
            if job.sent_log.get(p["email"], {}).get("status") == "sent":
                job.skipped += 1
                job.add("skip", f"{p['name']}: " + m(ui, "skip"))
                continue

            job.current = {"name": p["name"], "email": p["email"], "id": p["id"]}
            job.add("info", m(ui, "generating", pid=p["id"], name=p["name"], email=p["email"]))
            try:
                subject, body, usage, tokens = generate(cfg, p)
            except Exception as e:  # noqa: BLE001
                job.failed += 1
                job.add("fail", m(ui, "gen_failed", name=p["name"], err=e))
                continue

            job.api_calls += 1
            job.tokens_in += int(usage.get("prompt_tokens") or 0)
            job.tokens_out += int(usage.get("completion_tokens") or 0)
            if not usage:
                job.tokens_in += tokens // 2
                job.tokens_out += tokens - tokens // 2

            if not cfg.get("send"):
                job.sent += 1
                job.add("ok", m(ui, "preview_ok", name=p["name"]), {"subject": subject})
                continue

            msg = build_message(cfg, p, subject, body, job.attachments)
            ok = False
            for _ in range(3):
                try:
                    if smtp is None:
                        job.state = "running"
                        job.add("info", m(ui, "connecting", host=cfg["smtp_host"], port=cfg["smtp_port"]))
                        smtp = smtp_connect(cfg)
                        job.add("info", m(ui, "smtp_ok"))
                    smtp.send_message(msg)
                    ok = True
                    break
                except smtplib.SMTPAuthenticationError:
                    raise RuntimeError(m(ui, "auth_failed"))
                except smtplib.SMTPServerDisconnected:
                    smtp = None
                    time.sleep(15)
                except smtplib.SMTPResponseException as e:
                    text = f"{e.smtp_error} {e}".lower()
                    if any(k in text for k in ("too many", "exceed", "limit", "frequency", "421")):
                        job.add("warn", m(ui, "rate_limit"))
                        smtp = None
                        time.sleep(600)
                    else:
                        job.add("fail", m(ui, "sent_fail", name=p["name"], err=e))
                        break
                except (smtplib.SMTPException, OSError) as e:
                    job.add("warn", m(ui, "send_exc", err=e))
                    smtp = None
                    time.sleep(10)

            if ok:
                job.sent += 1
                job.sent_log[p["email"]] = {
                    "status": "sent", "name": p["name"], "subject": subject,
                    "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
                job._save_log()
                job.add("ok", m(ui, "sent_ok", name=p["name"]), {"subject": subject})
            else:
                job.failed += 1
                job.sent_log[p["email"]] = {"status": "failed", "name": p["name"]}
                job._save_log()

            job.state = "running"
            if job.stop_flag:
                job.state = "stopped"
                return
            delay = random.uniform(float(cfg["delay_min"]), float(cfg["delay_max"]))
            job.add("info", m(ui, "waiting", sec=int(round(delay))))
            end = time.time() + delay
            while time.time() < end:
                if job.stop_flag:
                    job.state = "stopped"
                    return
                job.pause.wait()
                time.sleep(0.5)
        job.state = "done"
    except Exception as e:  # noqa: BLE001
        job.state = "error"
        job.error = str(e)
        job.add("fail", m(ui, "aborted", err=e))
    finally:
        job.finished_at = time.time()
        job.current = {}
        if smtp is not None:
            try:
                smtp.quit()
            except Exception:  # noqa: BLE001
                pass


# ---------------------------------------------------------------- http
class Handler(BaseHTTPRequestHandler):
    server_version = "OutreachUI/1.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, *args):  # silence
        pass

    # -- helpers
    def send_json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_file(self, path: Path):
        if not path.exists():
            self.send_json({"error": "not found"}, 404)
            return
        data = path.read_bytes()
        ctype = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
                 ".js": "application/javascript; charset=utf-8", ".png": "image/png"}.get(
            path.suffix, "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length > 40 * 1024 * 1024:
            raise ValueError("payload too large")
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    # -- routes
    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            self.send_file(STATIC / "index.html")
        elif path.startswith("/static/"):
            self.send_file(STATIC / path[len("/static/"):])
        elif path == "/api/status":
            job_id = (urlparse(self.path).query.split("id=")[1].split("&")[0]
                      if "id=" in urlparse(self.path).query else "")
            job = JOBS.get(job_id)
            if not job:
                self.send_json({"error": "no such job"}, 404)
            else:
                self.send_json(job.status())
        elif path == "/api/defaults":
            self.send_json({
                "profile": DEFAULT_PROFILE_ZH,
                "profile_zh": DEFAULT_PROFILE_ZH,
                "profile_en": DEFAULT_PROFILE_EN,
                "llm": {k: {"base": v[0], "model": v[1]} for k, v in LLM_PRESETS.items()},
            })
        elif path == "/api/jobs":
            self.send_json([{"id": j.id, "state": j.state, "total": j.total, "sent": j.sent}
                            for j in JOBS.values()])
        else:
            self.send_json({"error": "not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self.body()
        except Exception as e:  # noqa: BLE001
            self.send_json({"error": f"bad request: {e}"}, 400)
            return

        if path == "/api/preview":
            self.handle_preview(payload)
        elif path == "/api/start":
            self.handle_start(payload)
        elif path in ("/api/pause", "/api/resume", "/api/stop"):
            job = JOBS.get(payload.get("id", ""))
            if not job:
                self.send_json({"error": "no such job"}, 404)
                return
            if path == "/api/pause":
                job.pause.clear()
                job.state = "paused"
                job.add("info", m(job.cfg.get("ui_lang", "zh"), "paused"))
            elif path == "/api/resume":
                job.pause.set()
                job.state = "running"
                job.add("info", m(job.cfg.get("ui_lang", "zh"), "resumed"))
            else:
                job.stop_flag = True
                job.pause.set()
                job.add("info", m(job.cfg.get("ui_lang", "zh"), "stop_req"))
            self.send_json(job.status())
        else:
            self.send_json({"error": "not found"}, 404)

    # -- preview: generate one email, send nothing
    def handle_preview(self, payload: dict):
        try:
            cfg, people, _ = prepare(payload, need_people=True)
        except Exception as e:  # noqa: BLE001
            self.send_json({"error": str(e)}, 400)
            return
        if not people:
            self.send_json({"error": m(cfg.get("ui_lang", "zh"), "no_emails")}, 400)
            return
        p = people[0]
        try:
            subject, body, usage, tokens = generate(cfg, p)
        except Exception as e:  # noqa: BLE001
            self.send_json({"error": str(e)}, 400)
            return
        self.send_json({"ok": True, "to": p["email"], "name": p["name"], "subject": subject,
                         "body": body, "usage": usage, "tokens": tokens,
                         "chars": len(CJK.findall(body)) if cfg["language"] == "zh" else len(body.split()),
                         "unit": "chars" if cfg["language"] == "zh" else "words"})

    def handle_start(self, payload: dict):
        try:
            cfg, people, attachments = prepare(payload, need_people=True)
        except Exception as e:  # noqa: BLE001
            self.send_json({"error": str(e)}, 400)
            return
        if cfg.get("demo"):
            self.send_json({"error": m(cfg.get("ui_lang", "zh"), "demo_only")}, 400)
            return
        if not people:
            self.send_json({"error": m(cfg.get("ui_lang", "zh"), "no_emails")}, 400)
            return
        job = Job(cfg, people, attachments)
        with JOBS_LOCK:
            JOBS[job.id] = job
        threading.Thread(target=worker, args=(job,), daemon=True).start()
        self.send_json({"job_id": job.id, "total": job.total})


def prepare(payload: dict, need_people: bool = False):
    lang = payload.get("language") or "zh"
    ui = payload.get("ui_lang") or "zh"
    provider = payload.get("llm_provider") or "deepseek"
    demo = provider == "demo"
    if demo:
        base, model, json_mode, cin, cout = "", "demo", False, 0, 0
    elif provider == "custom":
        base = (payload.get("api_base") or "").strip()
        model = (payload.get("api_model") or "").strip()
        json_mode = bool(payload.get("json_mode", False))
        cin = cout = 0
        if not base or not model:
            raise ValueError(m(ui, "custom_llm_need"))
    else:
        base, model, json_mode, cin, cout = LLM_PRESETS[provider]
        model = (payload.get("api_model") or "").strip() or model

    smtp_provider = payload.get("smtp_provider") or "qq"
    if smtp_provider == "custom":
        host = (payload.get("smtp_host") or "").strip()
        port = int(payload.get("smtp_port") or 465)
        use_ssl = bool(payload.get("smtp_ssl", True))
        if not host:
            raise ValueError(m(ui, "custom_smtp_need"))
    else:
        host, port, use_ssl = SMTP_PRESETS[smtp_provider]

    sender_email = (payload.get("sender_email") or "").strip()
    auth = (payload.get("auth_key") or "").strip()
    if not sender_email or "@" not in sender_email:
        raise ValueError(m(ui, "need_sender"))
    if payload.get("send") and not auth and smtp_provider != "custom":
        raise ValueError(m(ui, "need_auth"))

    cfg = {
        "language": lang,
        "ui_lang": ui,
        "university": (payload.get("university") or "").strip(),
        "program": (payload.get("program") or "").strip(),
        "intake": (payload.get("intake") or "").strip(),
        "profile": (payload.get("profile") or "").strip(),
        "sender_name": (payload.get("sender_name") or "").strip() or sender_email.split("@")[0],
        "sender_email": sender_email,
        "reply_to": (payload.get("reply_to") or "").strip(),
        "smtp_host": host, "smtp_port": port, "smtp_ssl": use_ssl,
        "smtp_user": sender_email, "smtp_pass": auth,
        "api_base": base, "api_model": model, "api_key": (payload.get("api_key") or "").strip(),
        "json_mode": json_mode, "cost_in": cin, "cost_out": cout,
        "delay_min": float(payload.get("delay_min") or 30),
        "delay_max": float(payload.get("delay_max") or 70),
        "subject_tpl": (payload.get("subject_tpl") or "").strip(),
        "send": bool(payload.get("send", False)),
        "demo": demo,
    }
    if not cfg["profile"]:
        raise ValueError(m(ui, "need_profile"))
    cfg["signature_name"] = profile_name(cfg["profile"]) or cfg["sender_name"]
    if cfg["delay_max"] < cfg["delay_min"]:
        cfg["delay_max"] = cfg["delay_min"]

    people: list[dict] = []
    if need_people:
        b64 = payload.get("csv_b64") or ""
        if not b64:
            raise ValueError(m(ui, "need_csv"))
        try:
            raw = base64.b64decode(b64.split(",")[-1])
        except Exception as e:  # noqa: BLE001
            raise ValueError(m(ui, "csv_decode", err=e))
        people = parse_people(raw, None, ui)

    attachments = []
    total = 0
    for a in payload.get("attachments") or []:
        data = base64.b64decode(a["b64"].split(",")[-1])
        total += len(data)
        if total > 25 * 1024 * 1024:
            raise ValueError(m(ui, "attach_too_big"))
        attachments.append({"name": a["name"], "b64": a["b64"].split(",")[-1],
                            "type": a.get("type", "application/pdf")})
    return cfg, people, attachments


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()
    RUNS.mkdir(exist_ok=True)
    srv = ThreadingHTTPServer((args.host, args.port), Handler)
    srv.daemon_threads = True
    print(f"Professor outreach UI  ->  http://{args.host}:{args.port}")
    print("Ctrl+C to stop")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()

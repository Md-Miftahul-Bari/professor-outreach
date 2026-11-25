# Professor Outreach

A small local web app that writes a **separate** email for every professor in a CSV — using their research
areas and your own background — and sends them one by one from your own mailbox, with your CV attached.

Built for graduate-school cold emailing, especially applications to Chinese universities: the letters follow a
proper Chinese academic format (尊敬的X老师 → 自我介绍 → 经历 → 请求 → 此致/敬礼 → 署名), with an English
equivalent that mirrors the same structure.

Runs entirely on your machine. No server, no accounts, no data leaves the box except your own email and the
LLM API call.

---

## Features

- **Per-professor emails, not mail-merge.** Every letter is generated from that professor's listed research
  areas plus your profile, and the prompt forbids reusing the same wording.
- **Fact-grounded.** The AI may only assert what is in the applicant-profile box. No invented GPA, papers,
  awards, or claims about the professor's publications.
- **Fixed letter structure**, so every email reads professionally: salutation, apology for writing unasked,
  introduction and interest, experience and skills, honest note on the theory gap, one clear request,
  attachment line, sign-off, signed block with contact details.
- **Live tracking**: sent / left / failed / total, elapsed, time remaining, API calls, tokens, cost estimate,
  and a per-email log.
- **Bilingual interface** (中文 / English) and **bilingual email output**.
- **Custom subject line** with variables, or let the AI write one.
- **Safe by default**: pause / stop mid-run, resume without ever emailing the same address twice,
  credentials held in memory only.
- **Zero dependencies** — Python standard library only.

## Requirements

- Python 3.9+ (tested on 3.14)
- An email account that allows SMTP (QQ Mail, Gmail, Outlook, 163, 126, or any custom server)
- An API key for an OpenAI-compatible LLM: DeepSeek, OpenAI, Kimi/Moonshot, SiliconFlow, or a custom endpoint

## Quick start

```bash
cd professor-outreach
python app.py
```

Open <http://127.0.0.1:8765>. On Windows you can also double-click `start.bat`.

## What to fill in

| Section | What it wants |
|---|---|
| Sending mailbox | your address, provider, and an **app password**, not your login password |
| AI provider | provider, API key, model |
| Content | university, programme, intake, email language, optional subject line, **applicant profile** |
| Recipients & attachments | a CSV (name / email / research columns) and files to attach |
| Pacing | random gap in seconds between two sends |

The **applicant profile** is the single source of truth. Replace the sample block with your own history —
anything you leave out will simply not appear in the letters, and nothing will be invented to fill the gap.

Students can be emailed in Chinese or English; the profile may be written in either.

## Getting the app password

| Provider | Where |
|---|---|
| QQ Mail | 设置 → 账户 → POP3/IMAP/SMTP 服务 → 生成授权码 |
| Gmail | Google Account → Security → 2-Step Verification → App passwords |
| Outlook / Office365 | Account security → Advanced security options → App passwords |
| 163 / 126 | 设置 → POP3/SMTP/IMAP → 开启服务 → 客户端授权密码 |

SMTP presets ship for QQ (smtp.qq.com:465), Gmail, Outlook, 163, 126; anything else can be entered manually.

## How it works

1. The CSV is parsed into one record per professor (name, email, title, institute, research areas).
2. For each, the server builds a prompt from your profile + that professor's row and asks the model for
   `{"subject", "body"}` as JSON.
3. The reply is validated: right salutation, required sections, character/word budget, no placeholders, no
   filler phrases, your name in the signature. A failing draft is retried up to three times.
4. On success the message is assembled as plain text with your attachments and sent over SMTP.
5. Progress and a send log are written to `runs/<job>/` so a rerun resumes instead of repeating.

## Privacy and safety

- Binds to `127.0.0.1` only.
- Credentials live in process memory for the duration of a job and are never written to disk.
- Only non-secret form fields are cached in the browser's localStorage.
- Already-sent addresses are recorded, so no professor is ever emailed twice.
- Nothing is sent without an explicit confirmation dialog.

## Limits worth knowing

- Your mail provider throttles bursts. The default 30–70 s gap is deliberate; keep it.
- A large CV attachment counts against provider daily limits.
- Machine-generated letters still need a human eye. Preview one before launching a run.

## License

MIT — see [LICENSE](LICENSE).

---

## 中文说明

这是一个**在本机运行**的小网站：上传一份教授名单 CSV 和自己的简历信息，它会为每位教授单独写一封中文或
英文申请邮件，逐封通过你自己的邮箱发出，并实时显示已发送 / 剩余 / 用时 / 预计剩余 / Token 与费用。

```bash
python app.py
```

打开 <http://127.0.0.1:8765>（Windows 也可双击 `start.bat`）。

- **申请人背景**是邮件的唯一事实来源，请整段替换成自己的经历；没写的不会被编造。
- 授权码不是邮箱密码，需在邮箱设置里单独生成（QQ 邮箱：设置 → 账户 → POP3/IMAP/SMTP 服务）。
- 邮件格式固定为：称呼 → 您好/冒昧打扰 → 自我介绍与兴趣 → 经历与技能 → 诚实说明与决心 → 请求 →
  附件说明 → 此致/敬礼 → 署名区。
- 凭据只存在内存里，不落盘；已发送的地址不会重复发送。
- GitHub Pages 不能运行它（需要 Python 服务端），请在本机或自己的服务器上运行。

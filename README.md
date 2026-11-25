# Professor Outreach · 教授邮件助手

Write a **separate** email for every professor in a CSV — built around their research areas and your own
background — and send them one by one from your own mailbox, with your CV attached.

Built for graduate-school cold emailing, especially applications to Chinese universities: letters follow a proper
Chinese academic format (尊敬的X老师 → 自我介绍 → 经历 → 请求 → 此致/敬礼 → 署名), with an English equivalent
that mirrors the same structure.

## Two editions, same letter

**Hosted (this repo's Netlify deploy).** Open the link, fill the form, press start. The browser calls the AI
provider directly; only the SMTP hop goes through a Netlify function, one message per request.

- Nothing is stored: your API key never leaves the browser, your mailbox password crosses one send request.
- Limits of the serverless path: attachments ~4 MB, keep the tab open while it runs, one request per email.

**Local (`app.py`).** `python app.py` gives the same interface on `127.0.0.1:8765` with no per-request limits —
attachments up to 25 MB, and the sending loop lives in a local process instead of a browser tab.

Both editions read the same prompt and validation rules from [`site/prompts.json`](site/prompts.json), so a
letter written by one is written the same way by the other.

## Features

- **Per-professor emails, not mail-merge.** Each letter is generated from that professor's listed research plus
  your profile; the prompt forbids reusing the same wording.
- **Fact-grounded.** The AI may only assert what is in the applicant-profile box. No invented GPA, papers,
  awards, or claims about the professor's publications.
- **Fixed structure**, validated before anything is sent: salutation, apology, introduction and interest,
  experience and skills, honest note on the theory gap, one request, attachment line, sign-off, signed block
  with contact details.
- **Live tracking**: sent / left / failed, elapsed, time remaining, API calls, tokens, cost estimate, per-email
  log.
- **Bilingual everywhere**: interface in 中文 or English, emails in either.
- **Custom subject line** with `{方向} {姓名} {学校} {入学} {教授} {项目}` variables, or let the AI write one.
- **No repeats.** Sent addresses are remembered, so an interrupted run resumes instead of starting over.

## Deploy on Netlify

1. Push this repo to GitHub (or upload the folder through the web UI).
2. Netlify → **Add new site** → **Import an existing project** → pick the repo.
3. Build command: empty. Publish directory: `site` — already set in [`netlify.toml`](netlify.toml).
4. Deploy.

`netlify.toml` also wires `/api/send` and `/api/llm` to the two functions and pins Node 20, so Netlify installs
`nodemailer` from `package.json` during the build. A plain drag-and-drop deploy of `site/` will **not** include
the functions — connect the repo instead.

## Run locally

```bash
python app.py          # then open http://127.0.0.1:8765
```

Windows: double-click `start.bat`. Python 3.9+ and no third-party packages.

## What you need

- An email account with SMTP and an **app password** (not your login password):
  QQ Mail → 设置 → 账户 → POP3/IMAP/SMTP 服务 → 生成授权码. Presets ship for QQ, Gmail, Outlook, 163, 126.
- An OpenAI-compatible API key: DeepSeek, OpenAI, Kimi/Moonshot, SiliconFlow, or a custom endpoint.

## CSV format

At least three columns, auto-detected, English or Chinese names:

```
Name,Title,Institute,Email,Research_Interests_and_Work
Jianhua FENG,Professor,Institute of Computing Software,fengjh@tsinghua.edu.cn,"Database Systems, Data Security"
```

Rows without an email are skipped; no address is emailed twice.

## Documentation

- **[MANUAL.md](MANUAL.md)** — full bilingual manual: every field, the app-password table, troubleshooting, FAQ.
- `/manual.html` on the deployed site renders the same manual.
- `/about.html` is the landing page.

## Privacy

- The hosted build stores nothing: no database, no logs of credentials, no message archive.
- The local build keeps the app password and API key in memory only; the send log under `runs/` contains
  addresses, not secrets.
- The `/api/llm` relay only accepts requests to the four known API hosts, so it cannot be used as an open proxy.

## License

MIT — see [LICENSE](LICENSE).

---

## 中文摘要

上传一份教授名单 CSV 和自己的背景资料，它会为每位教授**单独**写一封信（引用该教授的研究方向），再通过你
自己的邮箱逐封发出，附上简历，并实时显示进度、Token 与费用。

- **在线版**：打开部署链接就能用。AI 请求由浏览器直接发出，只有发信经服务器转发一次；不保存任何凭据。
  限制：附件约 4 MB、发送时页面要开着。
- **本地版**：`python app.py`，界面一样，附件可到 25 MB。

两个版本共用 `site/prompts.json` 里的提示词与校验规则，所以写出来的信格式一致。

邮件格式固定为：称呼 → 您好/冒昧打扰 → 自我介绍与兴趣 → 经历与技能 → 诚实说明与决心 → 请求 → 附件说明 →
此致/敬礼 → 署名区。申请人背景是唯一事实来源，没写的内容不会被编造。

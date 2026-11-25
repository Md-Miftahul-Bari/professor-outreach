# 使用手册 · User Manual

一个在本机运行的小网站：读取教授名单 CSV，为每位教授单独写一封中文或英文申请邮件，再通过你自己的邮箱
逐封发出。

A local web app that reads a CSV of professors, writes a separate email for each one, and sends them from your
own mailbox.

---

# 中文

## 1. 它做什么

你上传一份教授名单（CSV）和一份自己的背景资料，它就会：

1. 读取每位教授的姓名、邮箱、职称、研究方向；
2. 用你选的大模型，为这位教授单独写一封信，引用他的研究方向；
3. 生成前先做格式检查（称呼、段落、字数、署名），不合格就重写；
4. 通过你的邮箱，逐封发出，附件带上简历；
5. 在页面上实时显示已发 / 剩余 / 用时 / Token / 费用。

它不会群发同一封邮件。每封信的第 3–5 段都必须围绕这位教授的方向重新写。

## 2. 准备三样东西

**Python 3.9 或更新版本。** 安装时勾选 “Add Python to PATH”。命令行输入 `python --version` 能显示版本即可。

**一个支持 SMTP 的邮箱，以及它的「授权码」。** 注意：授权码不是登录密码。

- QQ 邮箱：设置 → 账户 → POP3/IMAP/SMTP 服务 → 开启 → 生成授权码
- Gmail：Google 账户 → 安全性 → 两步验证 → 应用专用密码
- Outlook：账户安全 → 高级安全选项 → 应用密码
- 163 / 126：设置 → POP3/SMTP/IMAP → 开启服务 → 客户端授权密码

**一个大模型的 API Key。** 支持 DeepSeek、OpenAI、Kimi（Moonshot）、SiliconFlow，以及任何 OpenAI 兼容
接口。

## 3. 启动

```
python app.py
```

浏览器打开 http://127.0.0.1:8765 。Windows 也可以双击 `start.bat`。

换端口：`python app.py --port 9000`。

## 4. 界面填写说明

**发件邮箱**：填你的邮箱地址，选择服务商。选「自定义 SMTP」时才需要手填服务器地址和端口。

**授权码**：上面第 2 步生成的那串。它只保存在内存里，不写硬盘。

**发件人姓名**：会用在发件人显示名上；信里的署名以「申请人背景」里的姓名为准。

**AI 服务商**：选一个，填 API Key。模型名会自动带出来，可以改。选「演示模式」时不调用任何 API，只能预览，
不能发送。

**学校 / 项目 / 入学时间**：会写进信里，例如「清华大学」「计算机科学与技术学术型硕士」「2027年秋季」。

**邮件语言**：中文或英文。中文按中文学术邮件格式写，英文按同样的段落结构写。

**邮件主题**：可以留空让 AI 拟；也可以自己写，用变量：

- `{方向}` 这位教授的研究方向（取自名单原文）
- `{姓名}` `{学校}` `{入学}` `{教授}` `{项目}`

例如 `2027年秋季硕士申请咨询：{方向}`。

**申请人背景**：这是整封信唯一的事实来源。学校、专业、年级、论文、项目、技能、语言证书、联系方式，写什么
用什么；没写的不会出现在信里，也不会被编造。框里默认是一份示例数据（王小明 / example.com），**用之前必须
整段换成你自己的**。点「恢复示例」可以恢复。

**CSV**：见下一节。

**附件**：简历 PDF 等，可多选，总大小不超过 25 MB。

**发送节奏**：两封信之间的随机间隔秒数，默认 30–70 秒。太短会被邮箱服务商限流。

## 5. CSV 格式

需要至少三列，列名会自动识别，中英文都行：

- 姓名（name）
- 邮箱（email）
- 研究方向（research / interests）

可选：职称、院系。示例：

```
Name,Title,Institute,Email,Research_Interests_and_Work
Jianhua FENG,Professor,Institute of Computing Software,fengjh@tsinghua.edu.cn,"Database Systems, Data Security"
```

没有邮箱的行会被跳过。同一个邮箱不会重复发送。

## 6. 发送流程

1. 填完上面的内容；
2. 点「预览第一封」，看一眼格式和称呼（会真实调用一次 AI，花费很小）；
3. 点「开始发送」，确认；
4. 运行中可以「暂停 / 继续 / 停止」；
5. 中途停了或断网，重新运行，会从没发过的地方继续，不会重复。

## 7. 看懂进度面板

- 圆环：完成百分比
- 已发送 / 剩余 / 失败 / 总计
- 已用时、预计剩余（按实际平均速度算）
- API 调用次数、Token 总数、预估费用
- 日志：每封信的状态，成功是绿色，失败是红色，限流暂停是黄色

## 8. 常见错误

**SMTP 认证失败 / 535**：授权码错了，或者服务商没开 SMTP。重新生成一次授权码。

**连接超时**：公司或校园网屏蔽了 465 端口，换网络试试。

**429 / 限流**：间隔太短。把最小间隔调到 60 秒以上，第二天再发。

**401 / 余额不足**：API Key 错了或没钱了。

**无法识别列名**：CSV 需要包含姓名、邮箱、研究方向三列，检查第一行。

**生成失败：三次都未通过校验**：模型输出不合格式。换一个更强的模型，或者再试一次。

## 9. 隐私与安全

- 只监听 127.0.0.1，外网访问不到。
- 授权码和 API Key 只在内存里，任务结束或程序关闭就没了。
- 浏览器只记住非密码字段。
- 已发送的地址会记录在 `runs/` 里，防止重复。
- 发送前一定有一次确认框。

## 10. 常见问题

**能发多少封？** 取决于你的邮箱服务商。QQ 免费邮箱有每日上限，建议一天不超过 40–80 封。

**能同时在两台电脑用吗？** 能，各自独立运行。

**会不会被判定为垃圾邮件？** 有可能。建议：间隔足够长、正文纯文本、附件不要太大、内容真正针对收件人。

**能直接放在网上让别人用吗？** 不建议。别人的邮箱授权码会经过你的服务器。让每个人在自己电脑上运行最安全。

---

# English

## 1. What it does

Given a CSV of professors and a profile describing you, the app:

1. parses one record per professor (name, email, title, institute, research areas);
2. asks the LLM you chose to write a letter for that professor, referring to their areas;
3. validates the draft before sending — salutation, required sections, length, signature — and retries if it
   fails;
4. sends each message through your own mailbox, with your CV attached;
5. shows sent / remaining / elapsed / tokens / cost while it runs.

It does not mail-merge. Paragraphs 3–5 are rewritten around each professor's field.

## 2. What you need

**Python 3.9 or newer.** On Windows, tick "Add Python to PATH" during install; `python --version` should work.

**A mailbox that allows SMTP, and its app password.**

- QQ Mail: Settings → Account → POP3/IMAP/SMTP service → enable → generate authorization code
- Gmail: Google Account → Security → 2-Step Verification → App passwords
- Outlook: Account security → Advanced security options → App passwords
- 163 / 126: Settings → POP3/SMTP/IMAP → enable → client authorization password

**An API key for an OpenAI-compatible LLM.** DeepSeek, OpenAI, Kimi (Moonshot), SiliconFlow, or any compatible
endpoint.

## 3. Start it

```
python app.py
```

Then open http://127.0.0.1:8765. On Windows you can double-click `start.bat`.

Different port: `python app.py --port 9000`.

## 4. Filling in the form

**From address** — your email, then pick your provider. Choose "Custom SMTP" only if your provider is not
listed.

**App password** — the authorization code from step 2. It lives in memory only.

**Sender name** — used as the display name on the envelope. The signature inside the letter uses the name from
your profile.

**AI provider** — pick one and paste the key. The model name is filled in automatically and can be changed.
"Demo mode" calls no API and can only preview.

**University / Programme / Intake** — written into the letter, for example "Tsinghua University", "MSc in
Computer Science", "autumn 2027".

**Email language** — Chinese or English. Both follow the same paragraph structure.

**Subject line** — leave empty to let the AI write one, or write your own with variables:

- `{方向}` / `{topic}` — this professor's research area from the CSV
- `{姓名}` / `{name}`, `{学校}` / `{university}`, `{入学}` / `{intake}`, `{教授}` / `{professor}`,
  `{项目}` / `{program}`

For example `MSc application 2027 — {topic}`.

**Applicant profile** — the only source of facts. Everything you write here may appear in the letter; anything
missing will not appear and will not be invented. The box starts with sample data (Wang Xiaoming /
example.com) — **replace the whole block before using it**. "Reset to sample" restores it.

**CSV** — see the next section.

**Attachments** — CV PDF and others, up to 25 MB in total.

**Pacing** — the random gap between two sends, 30–70 seconds by default. Shorter gaps get throttled.

## 5. CSV format

At least three columns; names are auto-detected, English or Chinese:

- name
- email
- research / interests

Optional: title, institute. Example:

```
Name,Title,Institute,Email,Research_Interests_and_Work
Jianhua FENG,Professor,Institute of Computing Software,fengjh@tsinghua.edu.cn,"Database Systems, Data Security"
```

Rows without an email are skipped. The same address is never emailed twice.

## 6. Sending

1. Fill in the form;
2. click "Preview first" to check format and salutation (this does call the API once, cheaply);
3. click "Start sending" and confirm;
4. pause / resume / stop at any time;
5. if you stop or the connection drops, just run it again — it continues and never repeats.

## 7. Reading the dashboard

- the ring is the completion percentage
- sent / remaining / failed / total
- elapsed and estimated time left, from the real average speed
- API calls, total tokens, estimated cost
- the log: green sent, red failed, amber rate-limited

## 8. Troubleshooting

**SMTP authentication failed / 535** — wrong app password, or SMTP is not enabled. Generate a new code.

**Connection timeout** — port 465 is blocked on your network. Try another network.

**429 / throttled** — gaps too short. Raise the minimum gap above 60 seconds and continue the next day.

**401 / insufficient balance** — wrong API key or no credit.

**Could not find the required columns** — the CSV needs name, email and research columns. Check the first row.

**Generation failed: 3 attempts did not pass validation** — the model did not follow the format. Try again or
use a stronger model.

## 9. Privacy and safety

- Binds to 127.0.0.1 only; not reachable from the network.
- The app password and API key stay in memory and vanish when the job or the process ends.
- The browser only caches non-secret fields.
- Sent addresses are recorded under `runs/` so nobody is emailed twice.
- Nothing is sent without a confirmation dialog.

## 10. FAQ

**How many can I send?** Whatever your provider allows. Free QQ Mail has a daily cap; 40–80 a day is a safe
range.

**Can two people run it at once?** Yes, each on their own machine.

**Will this be marked as spam?** Possibly. Use long gaps, plain text, a reasonably small attachment, and
content that is genuinely specific to the recipient.

**Can I host it publicly for others?** Not recommended — other people's mailbox passwords would pass through
your server. Let each person run it locally.

"""Generate site/prompts.json - the single source of truth for prompts and validation rules.

Shared by app.py (local edition) and site/app.js (hosted edition), so the letter format is defined once.
Run:  python tools/gen_prompts.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SYSTEM_ZH = """你在为一位准备申请硕士项目的学生撰写发给教授的中文联系邮件。

只输出一个 JSON 对象：{"subject": "...", "body": "..."}，不要输出任何别的内容。

硬性规则：
1. 只能使用【申请人资料】中的事实。学校、专业、年级、成绩、奖学金、论文、项目、技能、语言证书、联系方式，
   一律照资料写；资料里没有的内容一个字都不写，资料里没有的联系方式整行省略。
2. 只能用【教授资料】里列出的研究方向来谈教授的工作。不得虚构论文、年份、成果或实验室名称。
3. 必须按【邮件结构】的板块顺序写，不要增加、合并或删除板块。
4. 正文 320–620 个汉字，纯文本：不用 Markdown、不用项目符号、不用 [占位符]、不用表情符号。
5. 语言要像人写的：句子短，具体，克制。避免套话堆叠——不要连用"深感""不胜感激""万分荣幸"，
   不要每段都用"我非常希望"，不要空泛恭维（久仰、拜读、世界一流、顶尖）。
6. 结尾署名区逐行写：姓名、学校与专业、邮箱、微信、电话、ORCID；资料里缺哪一行就整行省掉。
7. 主题不超过 30 个字符，说明目的与一个具体方向，不用问句。若【指定主题】已给出，必须原样使用。
8. 教授方向原文是英文时，译成通顺中文；YOLOv8、SQL、Jittor 等专有名词保留英文。
9. 不同教授方向不同，第 3–5 段必须围绕该方向重新措辞，不能只把关键词换掉。
"""

USER_ZH = """【申请人资料】
[[profile]]

【教授资料】
姓名：[[name]]
开头称呼（原样使用）：[[sal]]
职称：[[title]]
所属院系：[[institute]]
学校：[[university]]
研究方向（院系目录原文）：[[research]]
主要方向：[[interests]]

【申请目标】
项目：[[program]]
入学时间：[[intake]]
署名姓名：[[signature_name]]

【指定主题】
[[subject_tpl]]

【邮件结构】严格按此顺序逐段写：
1. 第一行：[[sal]]
2. 空一行，写："您好！冒昧来信打扰，深感抱歉。"
3. 自我介绍与兴趣（2–3 句）：资料里的学校、专业、姓名（资料中有中文名就一并写上）、预计毕业时间、
   已通过的语言考试；然后写一句"我认真阅读了您的简介，对您在[[interests]]方向的研究很感兴趣"。
   方向必须取自教授资料。
4. 经历与技能（2–3 句）：从资料里挑出与该方向最相关的论文和项目，写清本人负责的部分，再列出资料中的
   技能基础。只写资料里真实存在的经历；不要用"扎实""较强"这类自我评价堆砌。
5. 诚实说明与决心（2–3 句）：说清自己在该方向的理论基础仍在起步，愿意在入学前补上；一句说明为什么想
   跟这位教授学。不要许诺成果。
6. 请求（2–3 句）：请问教授在[[intake]]是否招收硕士研究生；希望能有 10–15 分钟线上或线下交流，请教
   需要提前准备的知识与文献；若名额已满，恳请给予建议。
7. 附件说明（1 句）：随信附上个人简历，谢谢对方的时间。
8. 空一行，写"此致"，换行"敬礼！"，再空一行写署名区：姓名 / 学校与专业 / 邮箱 / 微信 / 电话 /
   ORCID；资料里没有的行，整行省略。

现在输出 JSON。"""

SYSTEM_EN = """You write short first-contact emails in English from a prospective master's applicant to a professor.

Output ONLY a JSON object: {"subject": "...", "body": "..."} and nothing else.

1. Use ONLY facts from APPLICANT PROFILE: institution, degree, dates, papers, projects, skills, language
   certificates, contact details. Invent nothing. Omit any contact line the profile does not contain.
2. Discuss the professor's work ONLY through the areas listed in PROFESSOR. Invent no papers or results.
3. Write native, professional English - the way a careful researcher writes, not a translation of Chinese.
   Short sentences, active voice, no ornate connectives, no "Moreover/Furthermore" chains.
4. Body 150-220 words. Plain prose; no markdown, no bullets, no placeholders, no emoji.
5. Banned phrasing: "I hope this email finds you well", "Please kindly", "I am writing to express",
   "esteemed", "world-class", "Please find attached", "I would be very grateful if you could take a look",
   "I sincerely hope", "I am confident that my ... will allow me to".
6. Exactly one request, stated once, in the final paragraph.
7. Tone: modest, specific, unadorned. One concrete thing the applicant did, one thing they want to learn.
   No self-praise ("strong learning ability", "solid foundation" as a boast), no promises about results.
8. Signature block, one line each: name; institution and major; email; WeChat; phone; ORCID - omit missing.
9. Subject: use FIXED SUBJECT verbatim if given, otherwise at most 8 words, not a question.
"""

USER_EN = """APPLICANT PROFILE
[[profile]]

PROFESSOR
Name: [[name]]
Salutation to use verbatim: [[sal]]
Title: [[title]]
Institute: [[institute]]
University: [[university]]
Areas (verbatim from the directory): [[research]]
Key areas: [[interests]]

TARGET
Programme: [[program]] at [[university]]
Intake: [[intake]]
Signature name: [[signature_name]]

FIXED SUBJECT
[[subject_tpl]]

HOW TO WRITE IT
1. Line 1: [[sal]]
2. Blank line.
3. Opening (1-2 sentences): who the applicant is and what they are asking for. Shape it like: "I am a
   final-year Computer Science undergraduate at X, writing to ask whether you will be taking master's
   students in autumn 2027." Do not open with an apology formula, and do not open with "I hope this email
   finds you well".
4. Why this group (1-2 sentences): name one or two of the professor's listed areas and say what the applicant
   wants to learn there. Specific, no flattery.
5. Evidence (1-2 sentences): one paper or project from the profile, what the applicant personally did in it,
   and one short line of the skills the profile lists. No self-assessment adjectives.
6. The ask (1-2 sentences): whether they are admitting master's students in [[intake]]; whether a 10-15 minute
   call is possible; if their places are full, any advice would help.
7. Close (1 sentence): CV attached, thanks for their time.
8. Blank line, "Best regards," then the signature block (name; institution and major; email; WeChat; phone;
   ORCID - omit missing lines).

Return the JSON object now."""

data = {
    "version": 2,
    "zh": {
        "system": SYSTEM_ZH,
        "user": USER_ZH,
        "subject_placeholder": "（未指定，请自行拟定）",
    },
    "en": {
        "system": SYSTEM_EN,
        "user": USER_EN,
        "subject_placeholder": "(none - propose one)",
    },
    "validation": {
        "zh": {
            "min_chars": 300,
            "max_chars": 700,
            "max_subject_chars": 30,
            "banned": ["久仰", "拜读", "深感荣幸", "非常荣幸", "世界一流", "顶尖", "万分"],
            "must": ["您好", "此致", "敬礼"],
        },
        "en": {
            "min_words": 140,
            "max_words": 300,
            "max_subject_words": 10,
            "banned": ["i hope this email finds you well", "i am writing to express", "esteemed",
                       "i would be honored", "world-class", "i have long admired", "top-tier",
                       "please kindly", "please find attached", "i sincerely hope"],
            "must": ["best regards"],
        },
    },
}

out = ROOT / "site" / "prompts.json"
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size} bytes)")

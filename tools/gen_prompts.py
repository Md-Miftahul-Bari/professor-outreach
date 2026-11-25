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

SYSTEM_EN = """You write first-contact emails in English from a prospective master's applicant to a professor.

Output ONLY a JSON object: {"subject": "...", "body": "..."} and nothing else.

The user has a fixed letter they want. Reproduce its structure and its fixed sentences WORD FOR WORD, filling
only the parts that depend on the professor and on the applicant's facts. Do not improve the wording, do not
shorten it, do not replace the formal phrases with plainer English.

1. Use ONLY facts from APPLICANT PROFILE. Invent nothing; omit a contact line the profile lacks.
2. Discuss the professor's work only through the areas listed in PROFESSOR.
3. The two opening sentences after the salutation must appear exactly:
   "I hope this email finds you well. Please forgive me for writing to you unexpectedly."
4. Do not shorten. The letter is 200-300 words, five paragraphs, plain text, no markdown.
5. Keep the formal register of the template ("I would be very grateful", "Please kindly find my CV enclosed",
   "Sincerely"). Do not modernise it.
6. Signature block after "Sincerely," - name; institution; major; email; WeChat; phone; ORCID, omitting any
   line the profile lacks.
7. Subject: use FIXED SUBJECT verbatim if given, otherwise at most 8 words, not a question.
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

Write exactly this letter, in this order, keeping every fixed sentence word for word. Replace the
[bracketed slots] with the applicant's real facts; keep the rest identical.

[[sal]]

I hope this email finds you well. Please forgive me for writing to you unexpectedly.

My name is [full name, with the Chinese name in brackets if the profile has one], an undergraduate student
majoring in [major] at [institution], expected to graduate in [graduation month and year]. [If the profile
mentions a language certificate: I have passed HSK Level N.] I have read your profile and am very interested in
your research in [one or two areas from PROFESSOR]. I took part in [the paper and/or project named in the
profile], which gave me practical experience in [what that work involved, taken from the profile]. I also have
a solid foundation in [skills from the profile].

While I am currently at the early stage of my understanding of [the same area], I hold a deep interest in this
field. I am confident that my solid programming foundation, project experience in system integration, and
strong learning ability will allow me to bridge this theoretical gap quickly before enrollment and devote
myself fully to your research team. This is precisely why I sincerely hope to learn under your supervision at
the master's level.

May I ask whether you will be accepting master's students in [intake]? If convenient, I would be very grateful
for a 10-15 minute online or in-person meeting to ask what knowledge and literature I should prepare in
advance. If your quota for this year is already full, I would also sincerely appreciate your advice.

Please kindly find my CV enclosed for your reference; I would be very grateful if you could take a look at it
when you have a moment. Thank you for your time.

Sincerely,
[name]
[institution]
[major]
Email: [email]
WeChat: [wechat if present]
Phone: [phone if present]
ORCID: [orcid if present]

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
            "min_words": 180,
            "max_words": 360,
            "max_subject_words": 10,
            "banned": ["i am writing to express", "esteemed", "world-class", "i have long admired",
                       "top-tier", "i would be honored"],
            "must": ["i hope this email finds you well",
                     "please forgive me for writing to you unexpectedly"],
            "signoff": ["sincerely", "best regards", "kind regards", "yours sincerely"],
        },
    },
}

out = ROOT / "site" / "prompts.json"
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size} bytes)")

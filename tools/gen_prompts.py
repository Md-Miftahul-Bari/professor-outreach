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
1. 只能使用【申请人资料】中的事实。学校、专业、年级、奖学金、论文、项目、技能、语言证书、联系方式，
   一律照资料写；资料里没有的内容一个字都不写，资料里没有的联系方式整行省略。
2. 只能用【教授资料】里列出的研究方向来谈教授的工作。不得虚构论文、年份、成果或实验室名称。
3. 必须严格按【邮件结构】的板块顺序写，不要增加、合并或删除板块。
4. 正文 320–620 个汉字，纯文本：不用 Markdown、不用项目符号、不用 [占位符]、不用表情符号。
5. 语气诚恳、克制、有礼貌。可以用"冒昧来信打扰，深感抱歉"这类客套；不要空泛恭维（久仰、拜读、
   深感荣幸、世界一流、顶尖），不要许诺成果。
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
   已通过的语言考试；然后写"我认真阅读了您的简介，对您在[[interests]]方向的研究很感兴趣"。方向必须取自
   教授资料。
4. 经历与技能（2–3 句）：从资料里挑出与该方向最相关的论文和项目，写清本人负责的部分，并列出资料中的
   技能基础。只写资料里真实存在的经历。
5. 诚实说明与决心（3–4 句）：坦率说明自己在该方向的理论基础仍在起步阶段，表达浓厚兴趣、入学前补齐
   短板的计划，以及希望在硕士阶段跟随这位教授学习的原因。不要许诺成果。
6. 请求（2–3 句）：请问教授在[[intake]]是否招收硕士研究生；希望有机会进行 10–15 分钟线上或线下
   交流，请教需要提前准备的知识与文献；若名额已满，恳请给予建议。
7. 附件说明（1–2 句）：随信附上个人简历，感谢对方抽空查看。
8. 空一行，写"此致"，换行"敬礼！"，再空一行写署名区：姓名 / 学校与专业 / 邮箱 / 微信 / 电话 /
   ORCID；资料里没有的行，整行省略。

现在输出 JSON。"""

SYSTEM_EN = """You write first-contact academic emails from a prospective master's applicant to a professor.

Output ONLY a JSON object: {"subject": "...", "body": "..."} and nothing else.

1. Use ONLY facts from APPLICANT PROFILE: institution, degree, year, awards, papers, projects, skills,
   language certificates, contact details. Invent nothing. Omit any contact line the profile does not have.
2. Discuss the professor's work ONLY with the research areas listed in PROFESSOR. Invent no papers or results.
3. Follow the EMAIL STRUCTURE in the given order exactly. Do not add, merge or drop sections.
4. Body 180-320 words, plain prose, no markdown, no bullet points, no placeholders, no emojis.
5. Sincere, restrained, polite. A brief apology for writing unannounced is welcome. No flattery
   ("I have long admired", "world-class", "top"), no promises of results.
6. Signature block, one per line: name; institution and major; email; WeChat; phone; ORCID - omit any line
   the profile lacks.
7. Subject at most 12 words, stating the purpose and one concrete area, not a question. If a FIXED SUBJECT is
   given, use it verbatim.
8. The professor's areas may be written in English or Chinese; render them naturally in the email's language.
9. Each professor differs: paragraphs 3-5 must be rephrased around that specific area, not keyword-swapped.
"""

USER_EN = """APPLICANT PROFILE
[[profile]]

PROFESSOR
Name: [[name]]
Salutation to use verbatim: [[sal]]
Title: [[title]]
Institute: [[institute]]
University: [[university]]
Interests (verbatim from the directory): [[research]]
Key interests: [[interests]]

TARGET
Programme: [[program]] at [[university]]
Intake: [[intake]]
Signature name: [[signature_name]]

FIXED SUBJECT
[[subject_tpl]]

EMAIL STRUCTURE - write in this order:
1. Line 1: [[sal]]
2. Blank line, then: "Please excuse my writing to you without an introduction."
3. Introduction and interest (2-3 sentences): institution, major, name, expected graduation and language
   certificates from the profile; then "I have read your profile and am especially interested in your work on
   [[interests]]." Those areas must come from PROFESSOR.
4. Experience and skills (2-3 sentences): pick the paper and project from the profile that fit that area most
   closely, say what the applicant personally did, and list the relevant skills the profile mentions. Only
   real items.
5. Honest gap and commitment (3-4 sentences): state plainly that the theoretical grounding in that area is
   still at an early stage, show genuine interest, explain the plan to close the gap before enrolment, and why
   studying under this professor specifically matters. Promise no results.
6. The request (2-3 sentences): whether the professor is taking master's students in [[intake]]; ask for
   10-15 minutes online or in person to learn what to read and prepare; if places are full, ask for advice.
7. Attachment (1-2 sentences): CV attached, thanks for their time.
8. Blank line, "Best regards," then the signature block, one line each: name; institution and major; email;
   WeChat; phone; ORCID - omit any line the profile lacks.

Return the JSON object now."""

data = {
    "version": 1,
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
            "min_words": 170,
            "max_words": 360,
            "max_subject_words": 12,
            "banned": ["i hope this email finds you well", "i am writing to express", "esteemed",
                       "i would be honored", "world-class", "i have long admired", "top-tier"],
            "must": ["best regards"],
        },
    },
}

out = ROOT / "site" / "prompts.json"
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size} bytes)")

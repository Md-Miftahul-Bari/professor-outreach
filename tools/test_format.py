"""Verify the shared prompt template renders and the shared rules still validate a real letter."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import app as A  # noqa: E402

prof = {
    "id": "046", "name": "Shimin HU", "title": "Professor",
    "institute": "Institute of Human-computer Interaction and Media Integration",
    "email": "shimin@tsinghua.edu.cn",
    "research": "Computer Graphics, Geometry Processing, Computer Vision, Jittor Deep Learning Framework.",
    "sal_zh": "尊敬的Hu老师：", "sal_en": "Dear Professor Hu,",
}

for lang, name, keep in (("zh", "王小明", "王小明"), ("en", "Wang Xiaoming", "Wang Xiaoming")):
    cfg = {
        "language": lang, "ui_lang": lang, "university": "清华大学" if lang == "zh" else "Tsinghua University",
        "program": "计算机科学与技术学术型硕士" if lang == "zh" else "MSc in Computer Science",
        "intake": "2027年秋季" if lang == "zh" else "autumn 2027",
        "profile": A.DEFAULT_PROFILE_ZH if lang == "zh" else A.DEFAULT_PROFILE_EN,
        "sender_name": name, "sender_email": "xiaoming.wang@example.com",
        "signature_name": keep, "subject_tpl": "",
    }
    system, user = A.build_prompt(cfg, prof)
    leftover = [t for t in ("[[profile]]", "[[name]]", "[[sal]]", "[[interests]]") if t in user]
    print(f"{lang}: prompt chars={len(user)} leftover placeholders={leftover or 'none'}")
    print(f"   signature name injected: {keep in user} | salutation injected: {prof['sal_' + lang] in user}")
    assert not leftover and keep in user

cfg = dict(cfg, language="zh")
s, b = A.demo_email(cfg, prof)
print("demo zh:", s, "| starts with salutation:", b.startswith(prof["sal_zh"]))

zh_body = """尊敬的Hu老师：

您好！冒昧来信打扰，深感抱歉。

我是示例大学计算机科学与技术专业本科生王小明，预计2028年6月毕业，已通过英语C1考试。我认真阅读了您的简介，对您在计算机图形学与几何处理方向的研究很感兴趣。

我参与过图像目标检测研究，负责数据集标注与训练流程；也参与过校园智能配送系统项目，积累了一些算法训练与系统集成的经验，并具备Python、C/C++、SQL和Linux的扎实基础。

虽然我目前在计算机图形学的理论基础尚处于起步阶段，但我对这一领域抱有浓厚的兴趣。我相信我扎实的编程基础、项目经验和学习能力，能让我在入学前补齐理论短板，并全心投入到您的研究团队中。这也是我诚恳希望在硕士阶段跟随您学习的原因。

请问您2027年秋季是否招收硕士研究生？如您方便，我非常希望能有机会与您进行10–15分钟的线上或线下交流，请教需要提前准备的知识和文献。若您今年名额已满，也恳请您给予建议，我将不胜感激。

随信附上我的个人简历，供您参考；若您能在百忙之中抽空查看，我将感激不尽。感谢您的时间。

此致
敬礼！

王小明
示例大学 计算机科学与技术
邮箱：xiaoming.wang@example.com"""

rules = A.PROMPTS["validation"]["zh"]
problems = A.validate("zh", prof, "2027年秋季硕士申请咨询：计算机图形学", zh_body, "王小明")
print(f"zh letter: {len(A.CJK.findall(zh_body))} chars, limits {rules['min_chars']}-{rules['max_chars']} -> {problems or 'passes'}")
assert not problems

# a too-short letter must be rejected
short = zh_body[:300]
print("short letter rejected:", bool(A.validate("zh", prof, "主题", short, "王小明")))

# a banned phrase must be rejected
bad = zh_body.replace("我认真阅读了您的简介", "久仰大名，我认真阅读了您的简介")
print("banned phrase rejected:", any("久仰" in p for p in A.validate("zh", prof, "主题", bad, "王小明")))

print("\nOK: shared prompts and rules work in the local edition")

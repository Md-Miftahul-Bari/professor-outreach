"""Point app.py at site/prompts.json so the local and hosted editions share one letter format."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
app = ROOT / "app.py"
src = app.read_text(encoding="utf-8")

NEW_BUILD = '''def build_prompt(cfg: dict, p: dict) -> tuple[str, str]:
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


'''

NEW_VALIDATE = '''def validate(lang: str, p: dict, subject: str, body: str, sender_name: str,
             subject_locked: bool = False) -> list[str]:
    """Format checks driven by the shared rules in site/prompts.json."""
    rules = PROMPTS["validation"][lang]
    problems: list[str] = []
    squashed = body.replace(":", "：").replace(" ", "").replace("\\u3000", "")

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


'''

# 1. load the shared prompt file right after ROOT is defined
anchor = 'CJK = re.compile(r"[\\u4e00-\\u9fff]")'
assert anchor in src
src = src.replace(
    anchor,
    anchor + '\n\n# Prompts and validation rules live in site/prompts.json, shared with the hosted edition.\n'
           'PROMPTS = json.loads((ROOT / "site" / "prompts.json").read_text(encoding="utf-8"))',
    1,
)

# 2. drop the hard-coded prompt constants
start = src.index("SYSTEM_ZH = ")
end = src.index("# ---------------------------------------------------------------- server messages")
src = src[:start] + src[end:]

# 3. swap build_prompt
start = src.index("def build_prompt(cfg: dict, p: dict)")
end = src.index("def render_subject(")
src = src[:start] + NEW_BUILD + src[end:]

# 4. swap validate
start = src.index("def validate(lang: str")
end = src.index("def call_model(cfg: dict, system: str, user: str)")
src = src[:start] + NEW_VALIDATE + src[end:]

# 5. unused import guard
if "import json" not in src.split("\n\n")[0] and "import json" in src:
    pass

app.write_text(src, encoding="utf-8")
print("patched app.py")
print("PROMPTS loaded:", "PROMPTS = json.loads" in src)
print("old constants gone:", "SYSTEM_ZH" not in src and "BANNED_EN" not in src)
print("lines:", src.count("\n"))

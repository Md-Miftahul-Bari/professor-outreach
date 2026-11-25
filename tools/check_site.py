"""Consistency check for the hosted edition: ids, i18n keys, markup balance."""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
site = Path(__file__).resolve().parents[1] / "site"
html_path, js_path = site / "index.html", site / "app.js"
html = html_path.read_text(encoding="utf-8")
js = js_path.read_text(encoding="utf-8")
css = (site / "app.css").read_text(encoding="utf-8")

fail = []
ids = re.findall(r'id="([^"]+)"', html)
dupes = {i for i in ids if ids.count(i) > 1}
js_ids = set(re.findall(r'\$\("#([A-Za-z0-9_]+)"\)', js)) | set(re.findall(r'val\("([A-Za-z0-9_]+)"\)', js))
missing = sorted(js_ids - set(ids))
if missing:
    fail.append(f"js references missing ids: {missing}")
if dupes:
    fail.append(f"duplicate ids: {sorted(dupes)}")

html_keys = set(re.findall(r'data-i18n="([^"]+)"', html))


def block(name):
    start = js.index(f"  {name}: {{")
    depth, i = 0, start
    while i < len(js):
        if js[i] == "{":
            depth += 1
        elif js[i] == "}":
            depth -= 1
            if depth == 0:
                return js[start:i]
        i += 1
    raise ValueError(name)


KEY = re.compile(r'(?<![A-Za-z0-9_"\'#])([a-z_]+):\s*"')
zh_keys = set(KEY.findall(block("zh")))
en_keys = set(KEY.findall(block("en")))
if zh_keys != en_keys:
    fail.append(f"zh/en mismatch: {sorted(zh_keys ^ en_keys)}")
if html_keys - zh_keys:
    fail.append(f"html keys missing from i18n: {sorted(html_keys - zh_keys)}")
state_keys = {f"state_{s}" for s in ("idle", "starting", "connecting", "running", "paused", "done", "stopped", "error")}
if not state_keys <= zh_keys:
    fail.append(f"missing state keys: {sorted(state_keys - zh_keys)}")
used = set(re.findall(r'\bt\("([a-z_]+)"\)', js))
if used - zh_keys:
    fail.append(f"js t() keys missing: {sorted(used - zh_keys)}")


class Chk(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.err = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.VOID:
            return
        if not self.stack:
            self.err.append(f"stray </{tag}>")
        elif self.stack[-1] != tag:
            self.err.append(f"</{tag}> closes <{self.stack[-1]}>")
            while self.stack and self.stack.pop() != tag:
                pass
        else:
            self.stack.pop()


c = Chk()
c.feed(html)
if c.stack:
    c.err.append(f"unclosed {c.stack}")
if css.count("{") != css.count("}"):
    c.err.append("css braces unbalanced")
if c.err:
    fail.append("markup: " + "; ".join(c.err))

print(f"ids: {len(ids)} | i18n keys: {len(zh_keys)} per language | bound in html: {len(html_keys)}")
for f in fail:
    print("FAIL:", f)
if not fail:
    print("\nOK: hosted page, script and styles agree")
sys.exit(1 if fail else 0)

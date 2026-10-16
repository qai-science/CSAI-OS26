#!/usr/bin/env python3
"""Inline src/ into a single offline index.html."""
import pathlib
root = pathlib.Path(__file__).parent
src = root / "src"
import json
css = (src / "style.css").read_text()
real = {p.stem: p.read_text() for p in sorted((root / "real_outputs").glob("*.txt"))} if (root / "real_outputs").exists() else {}
js = "const REAL_OUTPUTS = " + json.dumps(real).replace("</", "<\\/") + ";\n" + "\n".join((src / f).read_text() for f in ["engine.js", "s1s2.js", "s3s4.js", "s5s6.js", "s7s8.js", "exercises.js"]) + "\nboot();\n"
html = (src / "shell.html").read_text().replace("/*__CSS__*/", css).replace("/*__JS__*/", js)
(root / "index.html").write_text(html)
print(f"index.html: {len(html)/1024:.0f} KB, real outputs inlined: {sorted(real) or 'none yet'}")

d = "/home/claude/scripts/painel/"
css = open(d + "style.css", encoding="utf-8").read()
data = open("/home/claude/out/painel/data.js", encoding="utf-8").read()
eng = open(d + "engine.js", encoding="utf-8").read()
ui = open(d + "ui.js", encoding="utf-8").read()
imp = open(d + "import.js", encoding="utf-8").read()
html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gestão da Manutenção</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<div id="app"></div>
<div id="tip" role="tooltip"></div>
<script>
{data}
{eng}
{ui}
{imp}
</script>
</body>
</html>
"""
open("/home/claude/out/painel/index.html", "w", encoding="utf-8").write(html)
print(len(html) // 1024, "KB")

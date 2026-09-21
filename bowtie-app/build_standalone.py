#!/usr/bin/env python3
"""Genera bowtie-app/standalone/Visualizador-BowTie.html: un único archivo HTML
con todo el CSS, JS e íconos (base64) embebidos, para poder abrirlo con doble
clic sin depender de un servidor. Se regenera cada vez que se corre este script."""
import base64
import mimetypes
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE, 'standalone')
OUT_FILE = os.path.join(OUT_DIR, 'Visualizador-BowTie.html')

os.makedirs(OUT_DIR, exist_ok=True)

with open(os.path.join(BASE, 'index.html'), encoding='utf-8') as f:
    html = f.read()

# 1) CSS inline
with open(os.path.join(BASE, 'css', 'styles.css'), encoding='utf-8') as f:
    css = f.read()
html = html.replace(
    '<link rel="stylesheet" href="css/styles.css" />',
    f'<style>\n{css}\n</style>'
)

# 2) Íconos -> data URI (mapa nombre de archivo -> data URI)
icon_dir = os.path.join(BASE, 'assets', 'icons')
icon_data_uri = {}
for name in os.listdir(icon_dir):
    if not name.endswith('.png'):
        continue
    abs_path = os.path.join(icon_dir, name)
    mime = mimetypes.guess_type(abs_path)[0] or 'image/png'
    with open(abs_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('ascii')
    icon_data_uri[name] = f'data:{mime};base64,{b64}'

# 2a) Referencias directas en el HTML (<img src="assets/icons/x.png">)
for name, data_uri in icon_data_uri.items():
    html = html.replace(f'assets/icons/{name}', data_uri)

# 2b) Referencias dinámicas en cytoscapeStyles.js (`${ICONS}nombre.png`, con
# ICONS = 'assets/icons/'): se reemplaza la constante por un mapa de data URIs.
cyto_styles_path = os.path.join(BASE, 'js', 'diagram', 'cytoscapeStyles.js')
with open(cyto_styles_path, encoding='utf-8') as f:
    cyto_styles_src = f.read()

icon_map_js = ',\n  '.join(f'{name!r}: {uri!r}' for name, uri in icon_data_uri.items())
cyto_styles_src = cyto_styles_src.replace(
    "const ICONS = 'assets/icons/';",
    f"const ICON_DATA_URIS = {{\n  {icon_map_js}\n}};\n"
    "const ICONS = { concat: (name) => ICON_DATA_URIS[name] };"
)
# `${ICONS}nombre.png` -> `${ICONS.concat('nombre.png')}`
cyto_styles_src = re.sub(
    r'\$\{ICONS\}([\w.]+\.png)',
    lambda m: "${ICONS.concat('" + m.group(1) + "')}",
    cyto_styles_src
)

# 3) Scripts inline (en orden, tal como aparecen en index.html)
script_srcs = re.findall(r'<script src="([^"]+)"></script>', html)
for src in script_srcs:
    if src.endswith('cytoscapeStyles.js'):
        code = cyto_styles_src
    else:
        with open(os.path.join(BASE, src), encoding='utf-8') as f:
            code = f.read()
    html = html.replace(
        f'<script src="{src}"></script>',
        f'<script>\n{code}\n</script>'
    )

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'Generado: {OUT_FILE} ({os.path.getsize(OUT_FILE) / 1024:.0f} KB)')

#!/usr/bin/env python3
"""Monta a demonstração em um único HTML: head + Tailwind compilado + scripts."""
import subprocess, pathlib, sys
D=pathlib.Path(__file__).parent; S=D/'src'
parts=['engine.js','data-vac.js','ui-base.js','ui-shell.js','ui-escalas.js','ui-pessoas.js','ui-clinico.js','ui-servicos.js','ui-org.js','ui-ops.js','ui-manual.js']
js='\n'.join((S/p).read_text() for p in parts)
body='<script>\n(function(){\n'+js+'\n})();\n</script>\n'
head=(S/'head.html').read_text()
tmp=D/'.build'; tmp.mkdir(exist_ok=True)
(tmp/'content.html').write_text(head+body)
(tmp/'in.css').write_text('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n')
cfg=r"""const c=n=>`rgb(var(--c-${n}) / <alpha-value>)`;
module.exports={content:['%s'],theme:{extend:{
 colors:Object.fromEntries(['bg','panel','panel2','line','ink','soft','faint','navy','onnavy','lime','onlime','teal','tealsoft','sky','skyink','amber','amberbg','danger','dangerbg','cobalt','cobaltdeep','mint','p1','p2','p3','p4','p5','p6','onp'].map(k=>[k,c(k)])),
 fontFamily:{sans:['Manrope','system-ui','sans-serif']}}}};"""%(tmp/'content.html')
(tmp/'tw.cjs').write_text(cfg)
subprocess.run(['npx','tailwindcss','-c',str(tmp/'tw.cjs'),'-i',str(tmp/'in.css'),'-o',str(tmp/'tw.css'),'--minify'],cwd=D.parent,check=True,capture_output=True)
css=(tmp/'tw.css').read_text()
page=head.replace('/*TAILWIND*/','<style>'+css+'</style>')+body
(D/'medlink-demo.html').write_text(page)
full='<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
i=page.index('<div id="root">')
full+=page[:i]+'</head>\n<body>\n'+page[i:]+'</body>\n</html>\n'
(D.parent/'docs'/'index.html').write_text(full); (D.parent/'public'/'demo.html').write_text(full)
print('ok', len(page))

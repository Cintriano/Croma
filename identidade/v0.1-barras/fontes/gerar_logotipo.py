"""Gera o logotipo CR▭MA em curvas (SVG) a partir da Archivo (OFL), wght 800, wdth 125.

Uso: python gerar_logotipo.py <caminho da Archivo[wdth,wght].ttf>
A fonte vem de github.com/google/fonts (ofl/archivo). Saída em ../logos/.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FOSFORO, SINAL = '#F2F2F0', '#0B0B0C'
BARRAS = ['#C0C0C0', '#C0C000', '#00C0C0', '#00C000', '#C000C0', '#C00000', '#0000C0']

fonte = instantiateVariableFont(TTFont(sys.argv[1]), {'wght': 800, 'wdth': 125})
gs, cmap = fonte.getGlyphSet(), fonte.getBestCmap()
upm = fonte['head'].unitsPerEm
cap = fonte['OS/2'].sCapHeight
track = 0.01 * upm            # letter-spacing 0.01em, como nas pranchas
vao = 0.091 * upm             # espaço entre as letras e a moldura

def letra(ch, x):
    nome = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[nome].draw(TransformPen(pen, (1, 0, 0, -1, x, cap)))   # baseline em y = cap
    return pen.getCommands(), gs[nome].width

def logotipo(tinta, barras, moldura):
    partes, x = [], 0.0
    for ch in 'CR':
        d, w = letra(ch, x); partes.append(d); x += w + track
    x += vao - track
    s = cap / 102.0                                   # moldura com a altura das maiúsculas
    simb = (f'<g transform="translate({x:.1f} 0) scale({s:.4f})">'
            f'<rect x="6" y="6" width="160" height="90" fill="none" stroke="{moldura}" stroke-width="12"/>')
    xs = [12, 33.4, 54.9, 76.3, 97.7, 119.1, 140.6]; ws = [21.6] * 6 + [19.4]
    if len(set(barras)) == 1:   # mono: uma faixa só, sem emendas entre as barras
        simb += f'<rect x="12" y="72" width="148" height="18" fill="{barras[0]}"/>'
    else:
        for i in range(7):
            simb += f'<rect x="{xs[i]}" y="72" width="{ws[i]}" height="18" fill="{barras[i]}"/>'
    simb += '</g>'
    x += 172 * s + vao
    for ch in 'MA':
        d, w = letra(ch, x); partes.append(d); x += w + track
    largura = x - track
    # caixa real: as letras redondas passam um pouco da altura das maiúsculas e da linha de base
    b = BoundsPen(gs)
    for ch in 'CRMA':
        gs[cmap[ord(ch)]].draw(b)
    xmin, ymin, _, ymax = b.bounds
    caixa = (xmin, cap - ymax, largura - xmin, ymax - ymin)
    return caixa, f'<path d="{" ".join(partes)}" fill="{tinta}"/>' + simb

def salva(nome, tinta, barras, moldura, titulo):
    (x0, y0, w, h), corpo = logotipo(tinta, barras, moldura)
    y0, h = min(y0, 0), max(h, cap)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {w:.0f} {h:.0f}" role="img" '
           f'aria-label="Croma"><title>{titulo}</title>{corpo}</svg>\n')
    Path(__file__).resolve().parent.parent.joinpath('logos', nome).write_text(svg, encoding='utf-8')
    print(nome, round(w), 'x', round(h))

salva('croma-logotipo.svg', FOSFORO, BARRAS, FOSFORO, 'Croma — logotipo (fundo escuro)')
salva('croma-logotipo-fundo-claro.svg', SINAL, BARRAS, SINAL, 'Croma — logotipo (fundo claro)')
salva('croma-logotipo-mono-claro.svg', FOSFORO, [FOSFORO] * 7, FOSFORO, 'Croma — logotipo mono claro')
salva('croma-logotipo-mono-escuro.svg', SINAL, [SINAL] * 7, SINAL, 'Croma — logotipo mono escuro')

"""Exporta os ícones do app Croma (v0.1) em PNG/ICO para mobile, desktop, TV e web.

Desenho: moldura 16:9 (traço Fósforo) preenchida pelas 7 barras, sobre o fundo Sinal.
Abaixo de 48 px usa a versão simplificada: moldura + uma faixa ciano.
Uso: python gerar_icones_app.py   (saída em ../logos/app/)
"""
from pathlib import Path
from PIL import Image, ImageDraw

SINAL, FOSFORO = (11, 11, 12), (242, 242, 240)
BARRAS = [(192, 192, 192), (192, 192, 0), (0, 192, 192), (0, 192, 0), (192, 0, 192), (192, 0, 0), (0, 0, 192)]
CIANO = (0, 192, 192)
SS = 4  # superamostragem
OUT = Path(__file__).resolve().parent.parent / 'logos' / 'app'


def simbolo(d, cx, cy, largura, cor=FOSFORO, simples=False, mono=None):
    """Desenha a moldura 172×102 com centro (cx, cy) e a largura dada (px já em superamostragem)."""
    k = largura / 172.0
    x0, y0 = cx - 86 * k, cy - 51 * k
    R = lambda a, b, c, e: (x0 + a * k, y0 + b * k, x0 + c * k, y0 + e * k)
    d.rectangle(R(0, 0, 172, 102), fill=cor if mono is None else mono)
    d.rectangle(R(12, 12, 160, 90), fill=SINAL if mono is None else (0, 0, 0, 0))
    if mono is not None:
        d.rectangle(R(12, 64, 160, 90), fill=mono)
    elif simples:
        d.rectangle(R(12, 62, 160, 90), fill=CIANO)
    else:
        xs = [12 + i * (148 / 7) for i in range(8)]
        for i in range(7):
            d.rectangle(R(xs[i], 12, xs[i + 1], 90), fill=BARRAS[i])


def icone(tam, raio=0.0, escala=0.70, simples=None, fundo=SINAL, transparente=False, mono=None):
    S = tam * SS
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if not transparente:
        if raio:
            d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * raio), fill=fundo)
        else:
            d.rectangle((0, 0, S, S), fill=fundo)
    if simples is None:
        simples = tam < 48
    simbolo(d, S / 2, S / 2, S * escala, simples=simples, mono=mono)
    return im.resize((tam, tam), Image.LANCZOS)


def tile(w, h):
    S = (w * 2, h * 2)
    im = Image.new('RGB', S, SINAL)
    d = ImageDraw.Draw(im)
    simbolo(d, S[0] / 2, S[1] * 0.46, S[0] * 0.30)
    return im.resize((w, h), Image.LANCZOS)


def salva(im, caminho):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    im.save(caminho)
    return caminho.relative_to(OUT)


def main():
    feitos = []
    # Mobile: iOS e lojas usam o quadrado cheio (o sistema aplica a máscara)
    for t in (1024, 512, 192, 180, 120):
        feitos.append(salva(icone(t), OUT / 'mobile' / f'icone-{t}.png'))
    # Android adaptativo: primeiro plano dentro da zona segura de 66%, fundo separado, monocromático
    feitos.append(salva(icone(432, escala=0.46, transparente=True), OUT / 'mobile' / 'android-primeiro-plano-432.png'))
    feitos.append(salva(Image.new('RGB', (432, 432), SINAL), OUT / 'mobile' / 'android-fundo-432.png'))
    feitos.append(salva(icone(432, escala=0.46, transparente=True, mono=(255, 255, 255)), OUT / 'mobile' / 'android-monocromatico-432.png'))
    # Desktop (Windows): quadrado com cantos de 17%, .ico com vários tamanhos
    grandes = {t: icone(t, raio=0.17, escala=0.72) for t in (256, 128, 64, 48)}
    pequenos = {t: icone(t, raio=0.0, escala=0.92, simples=True, transparente=True) for t in (32, 24, 16)}
    for t, im in {**grandes, **pequenos}.items():
        feitos.append(salva(im, OUT / 'desktop' / f'icone-{t}.png'))
    ico = OUT / 'desktop' / 'croma.ico'
    grandes[256].save(ico, sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)],
                      append_images=[grandes[128], grandes[64], grandes[48], pequenos[32], pequenos[24], pequenos[16]])
    feitos.append(ico.relative_to(OUT))
    # TV (Tizen): ícone 512 e tile 16:9
    feitos.append(salva(icone(512, escala=0.72), OUT / 'tv' / 'icone-tizen-512.png'))
    feitos.append(salva(tile(1920, 1080), OUT / 'tv' / 'tile-1920x1080.png'))
    feitos.append(salva(tile(960, 540), OUT / 'tv' / 'tile-960x540.png'))
    # Web: favicon e PWA
    fav = OUT / 'web' / 'favicon.ico'
    fav.parent.mkdir(parents=True, exist_ok=True)
    icone(48, escala=0.92, simples=True, transparente=True).save(fav, sizes=[(48, 48), (32, 32), (16, 16)])
    feitos.append(fav.relative_to(OUT))
    for t in (192, 512):
        feitos.append(salva(icone(t), OUT / 'web' / f'pwa-{t}.png'))
    feitos.append(salva(icone(512, escala=0.50), OUT / 'web' / 'pwa-mascaravel-512.png'))
    for f in feitos:
        print(f)


if __name__ == '__main__':
    main()

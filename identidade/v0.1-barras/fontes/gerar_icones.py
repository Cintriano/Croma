"""Gera os ícones das bibliotecas do Croma v0.1 em logos/icones/.

Grade de 24 × 24, traço de 2 px, pontas e cantos retos (linguagem da v0.1).
Cada ícone tem um elemento de acento na cor da barra da sua biblioteca.
Saída: <nome>.svg (traço claro + acento), <nome>-mono.svg (tudo em currentColor).
Uso: python gerar_icones.py
"""
from pathlib import Path

TRACO = '#F2F2F0'

# nome: (título, cor do acento, λ, desenho com {s} = cor do traço e {a} = cor do acento)
ICONES = {
    'inicio': ('Início', '#C0C0C0', 'todas', '''
  <path d="M2.5 11.5L12 3.5l9.5 8" fill="none" stroke="{s}" stroke-width="2" stroke-linecap="square"/>
  <path d="M5 10v11h14V10" fill="none" stroke="{s}" stroke-width="2" stroke-linecap="square"/>
  <rect x="10" y="14" width="4" height="7" fill="{a}"/>'''),
    'filmes': ('Filmes', '#C0C000', '580 nm', '''
  <rect x="3" y="4" width="18" height="5" fill="{a}"/>
  <path d="M8.5 4L6.5 9M13.5 4l-2 5M18.5 4l-2 5" stroke="#0B0B0C" stroke-width="1.6"/>
  <rect x="3" y="11" width="18" height="9" fill="none" stroke="{s}" stroke-width="2"/>'''),
    'series': ('Séries', '#00C0C0', '490 nm', '''
  <path d="M7 4h14v9" fill="none" stroke="{s}" stroke-width="2" stroke-linecap="square"/>
  <rect x="3" y="8" width="14" height="10" fill="none" stroke="{s}" stroke-width="2"/>
  <rect x="4" y="14" width="12" height="3" fill="{a}"/>
  <path d="M7 21h6" stroke="{s}" stroke-width="2" stroke-linecap="square"/>'''),
    'musica': ('Música', '#00C000', '530 nm', '''
  <path d="M9.5 17.5V5.5l10.5-2.5v12" fill="none" stroke="{s}" stroke-width="2" stroke-linecap="square"/>
  <rect x="3.5" y="15.5" width="6" height="5" fill="{a}"/>
  <rect x="14" y="13" width="6" height="5" fill="{a}"/>'''),
    'fotos': ('Fotos', '#C000C0', 'não espectral', '''
  <rect x="3" y="5" width="18" height="14" fill="none" stroke="{s}" stroke-width="2"/>
  <path d="M4 18l5-6 4 4 2.5-2.5L20 18" fill="none" stroke="{s}" stroke-width="2"/>
  <rect x="14.5" y="7.5" width="3.5" height="3.5" fill="{a}"/>'''),
    'tv-ao-vivo': ('TV ao vivo', '#C00000', '650 nm', '''
  <path d="M7.5 3l4.5 4.5L16.5 3" fill="none" stroke="{s}" stroke-width="2" stroke-linecap="square"/>
  <rect x="3" y="8" width="18" height="13" fill="none" stroke="{s}" stroke-width="2"/>
  <rect x="15" y="11" width="3" height="3" fill="{a}"/>'''),
    'livros': ('Livros', '#3B3BFF', '460 nm', '''
  <rect x="3" y="4" width="4" height="17" fill="none" stroke="{s}" stroke-width="2"/>
  <rect x="9" y="4" width="4" height="17" fill="{a}" stroke="{s}" stroke-width="2"/>
  <path d="M15 6.2l3.4-.9 3.9 14.6-3.4.9z" fill="none" stroke="{s}" stroke-width="2"/>'''),
    # Utilitário (não é biblioteca): aba "Mais" do mobile. Sem acento de cor.
    'mais': ('Mais', '#F2F2F0', '—', '''
  <rect x="3" y="10" width="4" height="4" fill="{s}"/>
  <rect x="10" y="10" width="4" height="4" fill="{s}"/>
  <rect x="17" y="10" width="4" height="4" fill="{s}"/>'''),
}


def svg(nome, mono=False):
    titulo, acento, _, corpo = ICONES[nome]
    s = 'currentColor' if mono else TRACO
    a = 'currentColor' if mono else acento
    corpo = corpo.format(s=s, a=a)
    if mono:  # no mono, os riscos escuros da claquete viram recortes transparentes
        corpo = corpo.replace('stroke="#0B0B0C"', 'stroke="#0B0B0C" stroke-opacity="0"')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" '
            f'role="img" aria-label="{titulo}"><title>Croma — {titulo}</title>{corpo}\n</svg>\n')


def main():
    pasta = Path(__file__).resolve().parent.parent / 'logos' / 'icones'
    pasta.mkdir(parents=True, exist_ok=True)
    for nome in ICONES:
        (pasta / f'{nome}.svg').write_text(svg(nome), encoding='utf-8')
        (pasta / f'{nome}-mono.svg').write_text(svg(nome, mono=True), encoding='utf-8')
    print(f'{len(ICONES) * 2} arquivos em {pasta}')


if __name__ == '__main__':
    main()

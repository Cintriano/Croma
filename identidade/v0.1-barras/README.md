# Croma — Identidade visual v0.1 "Barras"

- **Data:** 04/11/2026
- **Status:** **oficial** desde 05/11/2026. O manual completo está em [`MANUAL.md`](MANUAL.md).
- **Canvas original:** https://claude.ai/artifact/AUKTY2yvnHh4ZYk1c7qpLi (privado)

Esta é a identidade visual oficial do Croma. Ela nasceu como exploração antes da CAPRA, e o usuário decidiu adotá-la do jeito que está (veja "Relação com a CAPRA", no fim).

## Conceito

O Croma reúne todo tipo de mídia. A identidade parte de três ideias:

1. **Barras de cor das TVs antigas.** O padrão de teste que servia para regular brilho, contraste e saturação. Cada barra vira um tipo de mídia.
2. **A moldura da National Geographic, deitada.** No lugar do retângulo vertical de revista, uma moldura horizontal 16:9, como uma tela de TV.
3. **O nome "croma".** Remete a luz, foto, cor e espectro, como numa espectrometria. Por isso cada cor carrega o seu comprimento de onda (λ).

## Pranchas

### 01 — Logo e símbolo

![Logo e símbolo](imagens/01-logo-e-simbolo.png)

- **Logotipo:** "CROMA" em Archivo Expandida 800. O "O" é substituído pela moldura 16:9 com as barras de cor na base.
- **Símbolo:** a moldura sozinha.
- **Ícone desktop:** moldura preenchida pelas barras, como uma tela de teste.
- **Tile Tizen (16:9):** o símbolo com o nome embaixo.
- **Monocromático:** moldura e faixa em uma cor só.

### 02 — Cores e tipografia

![Cores e tipografia](imagens/02-cores-e-tipografia.png)

**Barras = tipos de mídia** (valores do padrão de teste em 75%):

| Barra | HEX | Mídia | λ |
|---|---|---|---|
| Branco | `#C0C0C0` | Início | todas |
| Amarelo | `#C0C000` | Filmes | 580 nm |
| Ciano | `#00C0C0` | Séries | 490 nm |
| Verde | `#00C000` | Música | 530 nm |
| Magenta | `#C000C0` | Fotos | não espectral |
| Vermelho | `#C00000` | TV ao vivo | 650 nm |
| Azul | `#0000C0` | Livros | 460 nm |

O azul `#0000C0` quase some sobre o fundo escuro quando aparece pequeno. Na prancha 04, a barra de progresso dos livros usa `#3B3BFF`.

**Neutros:**

| Nome | HEX |
|---|---|
| Sinal | `#0B0B0C` |
| Grafite | `#17181A` |
| Linha | `#2A2B2E` |
| Névoa | `#A3A3A0` |
| Fósforo | `#F2F2F0` |

**Espectro:** uma faixa de 380 a 700 nm com linhas de absorção escuras. É a base para carregamento, progresso e barra de tempo do player.

**Tipografia:**

| Uso | Fonte |
|---|---|
| Títulos | Archivo Expandida (`font-stretch: 125%`), 800 |
| Interface | Archivo 400 / 600 |
| Dados técnicos | IBM Plex Mono 500 |

### 03 — Tela de calibração (TV)

![Tela de calibração](imagens/03-tela-de-calibracao.png)

- Padrão de barras clássico: barras de 75%, faixa invertida, −I / branco / +Q e PLUGE (`#090909`, `#131313`, `#1D1D1D`).
- Um painel na forma da moldura Croma guia três etapas: **Brilho** (PLUGE), **Contraste** (quadrado branco) e **Cor** (modo só-azul).
- A ideia é ser uma função de verdade, em Ajustes › Imagem.
- No canvas, a prancha tem ajustes para trocar a etapa e ocultar o painel.

### 04 — Início na TV

![Início na TV](imagens/04-inicio-na-tv.png)

- **Navegação:** cada seção tem a barra da sua cor.
- **Destaque:** fica dentro da moldura 16:9, com a faixa de barras na base.
- **Foco do controle remoto:** a própria moldura, uma borda branca grossa no item em foco.
- **"Continuar":** mistura tipos de mídia. O progresso de cada item aparece na cor do seu tipo.

### 05 — Descanso de tela (TV) · 05/11/2026

![Descanso de tela, com o rastro da trajetória](imagens/05-descanso-de-tela.png)

![Canto em cheio](imagens/06-descanso-canto.png)

- **Ideia:** o descanso clássico das TVs e dos aparelhos de DVD. Fundo preto e só o símbolo (a moldura com as barras, 240 × 142 px, sem o nome) atravessando a tela e batendo nas bordas.
- **Cor a cada batida:** a moldura passa para a cor da próxima barra: branco, amarelo, ciano, verde, magenta, vermelho e azul (`#3B3BFF`, para não sumir no preto). A faixa de barras dentro dela não muda.
- **Canto em cheio:** quando o símbolo bate em duas bordas no mesmo quadro, a moldura se enche com as barras (vira o ícone do app) por 2,4 s e aparece "CANTO EM CHEIO" embaixo. Um contador discreto no canto guarda batidas e cantos.
- **Trajetória aleatória:** a posição e a direção iniciais são sorteadas. A cada batida, o ângulo de saída varia ±12°, sempre entre 25° e 65°, para nunca ficar quase reto. Assim o caminho não se repete e o canto em cheio fica raro de verdade.
- **Ajustes da prancha:** `velocidade` (Lenta, Normal, Rápida) e `rastro` (mostra a trajetória, só para documentação).
- **Parâmetros de URL** (para gerar imagens): `?rastro=1`, `?simular=60` (adianta 60 s de movimento), `?canto=1` (símbolo parado no canto), `?x=` e `?y=` (posição inicial fixa), `?velocidade=Rápida`.

### 06 — Sem sinal (TV) · 05/11/2026

![Sem sinal, servidor fora do ar](imagens/07-sem-sinal-servidor.png)

![Sem sinal, TV ao vivo](imagens/08-sem-sinal-tv.png)

- **Fundo:** estática de TV analógica, em movimento. São 8 quadros de ruído gerados uma vez (960×540, ampliados) e sorteados a 30 qps com deslocamento vertical. Cada linha tem um viés de brilho próprio, que cria as listras horizontais.
- **Camadas:** linhas de varredura, uma faixa clara rolando de cima para baixo (sincronismo vertical perdido) e bordas escurecidas, como um tubo.
- **Painel:** o mesmo da tela de calibração. "SEM SINAL", explicação, barra de espera com contagem de 15 s e os botões "Tentar agora" (em foco) e uma segunda ação.
- **Dois usos** (ajuste `modo`):
  - **Servidor:** o app não alcança o servidor Croma. Segunda ação: "Trocar servidor".
  - **TV ao vivo:** o canal não transmite. A etiqueta vem na cor da TV ao vivo (vermelho, λ 650 nm). Segunda ação: "Guia de canais".
- Com `prefers-reduced-motion`, a faixa rolante some e a estática cai para 2,5 qps.

### 07 — Galeria de filmes (TV) · 05/11/2026

![Galeria de filmes](imagens/09-galeria-de-filmes.png)

- **Cabeçalho:** a seção ativa ganha a barra grossa (6 px) na cor dela; as outras ficam com um fio de 2 px. Embaixo, o rótulo `λ 580 nm · 412 FILMES · 38 NÃO VISTOS` com o quadrado amarelo e o título "Filmes".
- **Filtros:** Todos, Não vistos, Favoritos, 4K · HDR, Gêneros e A–Z. O filtro ativo fica em fundo claro. "Ordenar" fica em mono, à direita.
- **Grade:** 7 pôsteres 2:3 (216 × 324 px) por linha, ocupando exatamente a área segura de 1728 px.
- **Pôster:** a arte real ocupa o cartão inteiro, sem texto por cima. Ano, duração e qualidade ficam na legenda, embaixo.
- **Estados:**
  - **Visto:** quadrado amarelo com ✓, título apagado.
  - **Em andamento:** barra amarela na base do pôster.
  - **Foco:** borda branca de 8 px e legenda (duração e qualidade) acesa.

### 08 — Galeria de séries (TV) · 05/11/2026

![Galeria de séries](imagens/10-galeria-de-series.png)

- **Diferença dos filmes:** séries usam cartões 16:9 (a moldura de TV), não pôsteres.
- **Série em foco no topo:** informações à esquerda, backdrop na moldura 16:9 com a faixa de barras à direita.
- **Fita de episódios:** um segmento por episódio, agrupado por temporada.
  - Ciano cheio: visto.
  - Meio cheio com borda branca: em andamento.
  - Cinza: não visto.
  - Só o contorno ciano: episódio novo.
- Embaixo da fita: "Próximo: T2 E06 · O mapa em branco" e a contagem de vistos.
- **"Em andamento":** cartões 320 × 180 com a barra de progresso da série inteira (episódios vistos ÷ total), a etiqueta ciano de episódios novos (`+2`) e, na legenda, o próximo episódio e a contagem.

### 09 — Player (TV) · 05/11/2026

![Player](imagens/11-player.png)

![Player buscando](imagens/12-player-busca.png)

- **Topo:** tipo e ano, título, hora atual e "termina às".
- **Linha do tempo em espectro:** a barra vai do violeta (380 nm) ao vermelho (700 nm). A parte assistida fica acesa e o resto, apagado. Os capítulos são linhas escuras, como as linhas de absorção de um espectro. A cabeça de leitura é um traço branco.
- **Busca** (ajuste `buscando`): a barra engrossa, a cabeça vai para o ponto escolhido e aparece a miniatura do quadro numa moldura 16:9 com a faixa de barras, além do tempo e do capítulo.
- **Controles:** capítulo anterior, −10 s, pausar, +30 s e próximo capítulo à esquerda; legendas, áudio, capítulos e ajustes de imagem à direita. O foco é o mesmo das outras telas: fundo claro e contorno branco.
- **Informações técnicas no centro:** 2160p, HDR10, Atmos 5.1 e "Reprodução direta" em verde (quando há transcodificação, isso muda de cor).

### 10 — Ícones, plataformas, desktop e mobile · 05/11/2026

![Ícones das bibliotecas](imagens/13-icones-das-bibliotecas.png)
![Plataformas](imagens/14-plataformas.png)
![Desktop](imagens/15-desktop.png)
![Mobile](imagens/16-mobile.png)

O detalhamento destas pranchas está no [`MANUAL.md`](MANUAL.md), seções 5 e 10.

### 11 — Música · 05/11/2026

![Álbum na TV](imagens/17-musica-album.png)
![Tocando agora na TV](imagens/18-musica-tocando-agora.png)
![Música no mobile](imagens/19-musica-mobile.png)

- **Álbum (TV):** capa 1:1 na moldura com a faixa de barras, lista de faixas com a faixa atual em destaque (número verde e equalizador) e "Playlists Croma" embaixo da capa.
- **Tocando agora (TV):** título grande, analisador de espectro em blocos e a linha do tempo em espectro.
  - O analisador tem 40 colunas por 14 blocos.
  - O som é pintado pelo comprimento de onda: graves em vermelho (700 nm), agudos em violeta (380 nm).
  - O bloco branco marca o pico.
  - A animação é feita em JS e respeita `prefers-reduced-motion`.
- **Mobile:** biblioteca (recentes, playlists e mini player), álbum e tocando agora com um analisador compacto.
- **Galeria (TV):** "Adicionados recentemente" (7 álbuns, foco em Hot Space), "Artistas" e "Playlists Croma".

![Galeria de música](imagens/20-musica-galeria.png)

- **Capa de artista:** com foto, usa a foto. Sem foto, monta um mosaico com até 2 capas de álbuns dele, separadas por um fio Fósforo de 4 px. Com 1 álbum só, usa a capa. Uma etiqueta mono indica a origem: FOTO, MOSAICO ou CAPA.
- **Artista (TV):** Queen, com o mosaico na moldura, "Mais tocadas", os álbuns que estão na biblioteca e quantos faltam no servidor.

![Artista](imagens/21-musica-artista.png)

- **Playlists Croma:** a capa é gerada. São 7 barras com cores tiradas de uma faixa do espectro (por exemplo, "Graves" é 590–700 nm), com o nome numa placa escura.

### 12 — Telas que completam o produto · 05/11/2026

O detalhamento de cada uma está no [`MANUAL.md`](MANUAL.md).

| Grupo | Telas | Imagens |
|---|---|---|
| TV ao vivo | guia de canais e canal ao vivo | 22, 23 |
| Fotos | galeria por mês (grade justificada) e visualizador | 24, 25 |
| Livros | galeria com a **capa gerada** (regra para itens sem arte) e leitor | 26, 27 |
| Detalhes | filme (Blade Runner 2049) e episódio (Dark T2 E06) | 28, 29 |
| Entrada | abertura animada, perfis e conexão com o servidor | 30, 31, 32 |
| Busca e ajustes | busca com teclado na tela e ajustes (Imagem, com a calibração) | 33, 34 |
| Estados | carregando, vazio, avisos rápidos e busca sem resultados | 35 |
| Player | legendas e áudio, próximo episódio e pular abertura, carregando e convertendo | 36, 37, 38 |
| Arquivos | logotipo em curvas e ícones do app por plataforma | 39 |

![Guia de canais](imagens/22-tv-ao-vivo-guia.png)
![Canal ao vivo](imagens/23-tv-ao-vivo-canal.png)
![Fotos](imagens/24-fotos-galeria.png)
![Visualizador](imagens/25-fotos-visualizador.png)
![Livros](imagens/26-livros-galeria.png)
![Leitor](imagens/27-livros-leitor.png)
![Detalhe do filme](imagens/28-detalhe-filme.png)
![Detalhe do episódio](imagens/29-detalhe-episodio.png)
![Abertura](imagens/30-abertura.png)
![Perfis](imagens/31-perfis.png)
![Servidor](imagens/32-servidor.png)
![Busca](imagens/33-busca.png)
![Ajustes](imagens/34-ajustes.png)
![Estados](imagens/35-estados.png)
![Legendas e áudio](imagens/36-player-menus.png)
![Próximo episódio](imagens/37-proximo-episodio.png)
![Player carregando](imagens/38-player-carregando.png)
![Arquivos oficiais](imagens/39-arquivos-oficiais.png)

## Imagens de exemplo · 05/11/2026

As pranchas de Início, Filmes, Séries, Player, Desktop e Mobile usam pôsteres reais da pasta `CintraLand/Posters` do usuário. As cópias estão reduzidas em `midia/` (2,7 MB):

| Pasta | Conteúdo |
|---|---|
| `midia/filmes/` | 14 pôsteres verticais (480 × 720) e 2 horizontais: Blade Runner 2049 (player) e Duna (destaque) |
| `midia/series/` | Dark, Ruptura, Andor, Arcane e Chernobyl (vertical + horizontal) e os pôsteres das 3 temporadas de Dark |
| `midia/musica/` | 11 capas de álbum e single: Pink Floyd, Daft Punk, Fleetwood Mac, Adele, Queen (2), Avicii (2), Calvin Harris (2), Seu Jorge. Mais a foto do Coldplay. As capas novas foram colocadas pelo usuário e renomeadas no padrão `artista-album-ano.jpg` |

- **Dark** é a série em foco porque as temporadas dela têm 10, 8 e 8 episódios, o mesmo número da fita de episódios.
- As imagens são de terceiros: servem só como referência visual neste projeto pessoal e não fazem parte da marca.

## Arquivos

| Pasta | Conteúdo |
|---|---|
| `imagens/` | PNG de cada prancha (1600×1000 e 1920×1080) |
| `logos/` | logotipo em curvas (`croma-logotipo*.svg`, 4 versões), `croma-simbolo.svg`, `croma-simbolo-mono.svg`, `croma-icone-app.svg` |
| `logos/icones/` | ícones das bibliotecas (cor e mono) |
| `logos/app/` | ícones do app em PNG e ICO para mobile, desktop, TV e web |
| `fontes/` | Código das pranchas (`*.dc.html`), `canvas.json`, `support.js` e os geradores (`gerar_*.py`) |

O `support.js` é um runtime mínimo: com ele, cada `.dc.html` abre direto no navegador. Foi assim que as imagens foram geradas, com o Edge em modo headless.

O logotipo está em curvas em `logos/croma-logotipo*.svg`, gerado por `fontes/gerar_logotipo.py`. Os ícones do app estão em `logos/app/`, gerados por `fontes/gerar_icones_app.py`.

## Relação com a CAPRA

A v0.1 conflita com as regras de marca expressiva da CAPRA: cores saturadas, cantos vivos, Archivo e Plex Mono, foco em borda branca e nenhum sinal CAPRA. Em 05/11/2026, o usuário decidiu adotá-la como identidade oficial **do jeito que está**. A v0.2 fica arquivada como referência.

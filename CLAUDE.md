# CLAUDE.md — Croma

Responda sempre em português do Brasil.

## O que é

O **Croma** é a versão pessoal do Jellyfin do usuário: um servidor de mídia que reúne filmes, séries, música, fotos, TV ao vivo e livros. É para uso pessoal, com identidade visual própria.

- **Plataformas iniciais:** desktop (Windows) e TV Samsung **QN90B** (2022, Tizen 6.5, Chromium 85). Android, Android TV e outras ficam para depois.
- **Visão geral, versões e mapa do código:** `CROMA.md`. Leia esse arquivo antes de mexer nos repositórios.

## Arquitetura

O desktop e o Tizen rodam a **mesma interface web**. A identidade inteira mora no fork do `jellyfin-web`:

```
repos/croma-web (fork jellyfin-web, release-12.z / v12.4)
   ├─ build → servidor serve via --webdir → croma-desktop (Qt WebEngine + mpv; carrega a UI do servidor)
   └─ build → croma-tizen empacota o dist/ no .wgt
```

| Pasta | Origem (remote `upstream`) | Branch de trabalho |
|---|---|---|
| `repos/croma-web` | jellyfin/jellyfin-web, `release-12.z` | `croma` |
| `repos/croma-tizen` | jellyfin/jellyfin-tizen, `master` | `croma` |
| `repos/croma-desktop` | jellyfin/jellyfin-desktop, `master` | `croma` |
| `repos/jellyfin-server` | jellyfin/jellyfin, tag `v12.4` | Só referência; o servidor roda com o binário oficial |

- **Versões casadas:** a versão do web precisa bater com a do servidor (v12.4).
- **Base do web:** use o `jellyfin-web`, não o `jellyfin-vue`. Só o `jellyfin-web` tem layout de TV (`.layout-tv`, `layoutManager.tv`) e a integração com o Tizen.
- **Licença:** o código é GPL, e o nome e o logo "Jellyfin" não podem ser usados no produto.
- **Máquina:** o .NET SDK não está instalado. Node 24, git, Edge e Chrome estão.

## Identidade visual oficial: v0.1 "Barras"

**Decisão do usuário (05/11/2026):** a identidade oficial do Croma é a **v0.1 "Barras", como está**. O manual é a fonte da verdade: `identidade/v0.1-barras/MANUAL.md`. Confira toda proposta visual contra ele.

Resumo das regras:
- **Logotipo:** "CR▭MA", em que o "O" é a moldura 16:9 com a faixa de 7 barras. Arquivos em curvas em `identidade/v0.1-barras/logos/`.
- **Formas:** cantos vivos em tudo, e a moldura grossa emoldura imagens. A única curva é a máscara de ícone do sistema.
- **Cores:**
  - **neutros:** Sinal `#0B0B0C` (fundo), Grafite `#17181A`, Linha `#2A2B2E`, Cinza médio `#8A8B8E`, Névoa `#A3A3A0`, Fósforo `#F2F2F0`;
  - **barras de 75%, uma por biblioteca:** Início `#C0C0C0`, Filmes `#C0C000`, Séries `#00C0C0`, Música `#00C000`, Fotos `#C000C0`, TV ao vivo `#C00000`, Livros `#0000C0` (use `#3B3BFF` em elementos pequenos).
  - A cor da biblioteca só aparece em sinais pequenos. O foco é sempre Fósforo.
- **Tipografia:** Archivo Expandida 800 em títulos, Archivo na interface, IBM Plex Mono em dados, tempos e rótulos (estes em caixa alta).
- **TV:** escala 2×, margem segura de 96 px nas laterais e 54 px em cima e embaixo, foco com borda Fósforo de 8 px.
- **Itens sem arte** usam a "capa gerada", descrita no manual.

**Relação com a CAPRA:** o Croma deixou de seguir as regras de marca expressiva da CAPRA (maluma, paleta pastel, Inter e endosso). A v0.2 (`identidade/v0.2-capra/`) fica arquivada como referência. O repositório da CAPRA (https://github.com/Cintriano/Capra) continua sendo do usuário. Não o altere sem pedido.

**Conceitos do usuário:**
- barras de cor das TVs antigas;
- moldura da National Geographic, mas horizontal, como uma tela de TV;
- "croma" como luz e espectro (espectrometria, comprimentos de onda).

## Estado atual

| Item | Situação | Onde |
|---|---|---|
| Repositórios clonados e alinhados na v12.4 | Feito | `repos/` |
| Identidade v0.1 "Barras" | **Oficial** (05/11/2026): manual, logotipo em curvas, ícones do app e pranchas | `identidade/v0.1-barras/` |
| Identidade v0.2 (CAPRA, direções A, B e C) | Arquivada | `identidade/v0.2-capra/` |
| Coleções | Adiado; o usuário vai detalhar como quer que funcionem | — |

**Próximo passo:** implementar a v0.1 no `croma-web`, no `croma-tizen` e no `croma-desktop`.

**Canvas de design:** https://claude.ai/artifact/AUKTY2yvnHh4ZYk1c7qpLi (tipo Design; páginas "v0.1 Barras" e "v0.2 Direções CAPRA"; arquivos em `project/` e `project/v02/`).
- Antes de publicar nele, leia o `project/canvas.json`.
- Use caminhos longos (`C:\Users\<usuário>\...`), porque o caminho curto (como `DANILO~1.GAM` ou `CINTRA~1`) é bloqueado. O projeto roda em duas máquinas (`danilo.gama` e `CintraMan`).

## Organização da pasta

Este repositório (`Cintriano/Croma`) começou como o **Croma v1**, um app próprio de fotos (Fastify + React/Vite). O projeto agora é refeito por completo sobre o Jellyfin (Croma v2).

| Caminho | O que é |
|---|---|
| `CLAUDE.md`, `CROMA.md`, `identidade/` | **Croma v2**, versionados aqui |
| `repos/` | Forks do Jellyfin, cada um com git próprio. Ficam no `.gitignore` (veja abaixo) |
| `web/`, `server/`, `tests/`, `package.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`, `README.md`, `DOCUMENTACAO.md`, `PLANO_IMPLEMENTACAO.md` | **Croma v1 (legado)**. Serve de referência para as tags e o editor de tags (M3, M12 e M13), que precisam ser levados para o v2 |
| `Capra/` | Material da CAPRA, fora do git |

**Legado intocado até o pull:** a outra máquina tem a biblioteca de Músicas do v1 ainda sem push. Não mova, renomeie ou edite os arquivos do v1 antes desse pull, para não gerar conflito. Depois do pull, o v1 vai para `legado/`.

### Restaurar `repos/` em outra máquina

Os links, os commits de base e os comandos de clonagem estão em `CROMA.md`, na seção "Clonar os repositórios". Quando a branch `croma` ganhar commits, publique os forks no GitHub (`Cintriano/croma-web` etc.) para não depender de uma máquina só.

## Convenções

- A documentação de identidade fica em `identidade/<versão>/` com:
  - `README.md` (descrição completa com imagens);
  - `MANUAL.md` (só na versão oficial, a v0.1: regras e componentes);
  - `logos/` (logotipo, símbolo, ícones e `app/`);
  - `midia/` (pôsteres e capas de exemplo, de terceiros);
  - `imagens/` (PNG);
  - `fontes/` ou `direcoes/` (código das pranchas `.dc.html` + `support.js`).
- **Para renderizar uma prancha em PNG**, abra o `.dc.html` (com o `support.js` na mesma pasta) no Edge headless. Use `--window-size=1920,1080` nas pranchas de TV e `1600,1000` nas demais:

  ```
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --hide-scrollbars --window-size=1600,1000 --virtual-time-budget=8000 --screenshot=<saida.png> file:///<arquivo>.dc.html
  ```

- **Não altere o repositório CAPRA** sem pedido explícito.
- **Arquivos gerados por script:** não edite à mão. Mude o script e rode de novo. Todos ficam em `identidade/v0.1-barras/fontes/`:
  - `gerar_icones.py`: ícones das bibliotecas;
  - `gerar_logotipo.py`: logotipo; precisa da fonte variável Archivo do google/fonts;
  - `gerar_icones_app.py`: ícones do app.
- **Git:** os forks têm o original como `upstream` e a branch `croma`. Só faça commit ou push quando o usuário pedir.

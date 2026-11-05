# Croma — Plano da identidade v0.2 (marca expressiva CAPRA)

- **Data:** 04/11/2026
- **Status:** **arquivado** (05/11/2026). O usuário adotou a v0.1 "Barras" como identidade oficial; este plano fica como referência.
- **Base:** v0.1 "Barras" (`../v0.1-barras/README.md`)
- **Regras:** Manual CAPRA v1.6, `09-marcas-expressivas.md` (proposta v0.1) e "Identidade Visual para Apps de TV" (repositório Cintriano/Capra)

O Croma é o primeiro caso de **marca expressiva** da CAPRA. A v0.2 mantém os conceitos da v0.1 (TV antiga, moldura 16:9, espectro) e os reescreve na linguagem da CAPRA. Pelo `09`, o que funcionar no Croma vira regra; o que não funcionar sai antes de entrar no manual.

---

## 1. Ficha de conceito (rascunho)

```markdown
# Croma — Ficha de conceito

- **Status:** em criação
- **Área:** plataforma (Cyan)
- **Neutro:** preto (#121416)
- **Logo filha:** CR (já registrada; continua como reserva)

## Produto
- **O que faz (uma frase):** reúne filmes, séries, música, fotos, TV e livros num só lugar, na TV e no desktop.
- **Para quem:** uso pessoal e de quem divide a mesma biblioteca em casa.
- **Por que precisa de marca expressiva:** o conceito é visual (mídia, imagem, luz) e é um produto central, de vida longa.

## Conceito
- **Metáfora:** a tela de tubo que acende. Um ponto de luz no centro se abre na imagem, e a imagem se separa em cores.
- **Transmitir:** luz, acolhimento, sala de cinema em casa.
- **Evitar:** nostalgia kitsch, glitch/VHS, estética "gamer".

## Vínculo com a CAPRA
- **Sinais usados:** núcleo (o ponto de luz da tela de tubo), movimento a partir do centro (a TV acendendo) e ponto orbital (o LED da TV).
- **Cores da paleta:** Text, Gold, Cyan, Mint, Lilac e Peach nas barras; Cyan como acento da interface.
- **Como a linguagem maluma aparece:** tela de tubo com cantos amplos e laterais levemente abauladas; barras com pontas arredondadas.

## Movimento
- **Personalidade da animação:** a TV acendendo. O núcleo surge, se estica numa linha horizontal, a tela se abre e as barras acendem. Tudo desacelera ao chegar e termina parado.
```

---

## 2. Tradução de cada elemento da v0.1

| Elemento v0.1 | Problema na CAPRA | Versão v0.2 proposta |
|---|---|---|
| Moldura 16:9 de canto vivo | Takete | **Tela de tubo**: retângulo 16:9 com cantos amplos (raio de cerca de 18% da altura) e laterais levemente curvas. Continua sendo a moldura horizontal. |
| Barras saturadas de 75% | Fora da paleta, neon | **Barras pastel** na ordem do padrão de teste: Text `#E8ECEE` → Gold `#D6C58F` → Cyan `#8FB8C5` → Mint `#9DBBAA` → Lilac `#B3A6C9` → Peach `#D7AFA3`. São 6 barras; o azul não tem equivalente na paleta. |
| Nenhum sinal CAPRA | Obrigatório (pelo menos 2) | **Núcleo:** ponto de luz no centro da tela. **Ponto orbital:** "LED" fora da moldura, no canto inferior. **Movimento do centro:** a entrada é a TV acendendo. |
| Fundo `#0B0B0C` | Fora do neutro | `#121416` (Void) |
| Archivo Expandida / IBM Plex Mono | Interface CAPRA usa Inter / JetBrains Mono | Interface em **Inter**. JetBrains Mono só no desktop, para dados técnicos (na TV, o guia não usa mono). Logotipo: decisão 3. |
| Rótulos em caixa alta | Manual pede caixa de frase | Caixa de frase em tudo |
| Foco: borda branca grossa | Guia TV: anel no acento + escala | Anel Cyan de 4 px, com respiro de 4 px na cor do fundo, escala 1,1 nos cartões e 1,05 nos botões, sem sombra. O raio do anel acompanha o da tela de tubo, que é o vínculo sutil com o símbolo. |
| Espectro contínuo (carregamento) | Gradiente de muitas cores e "faixa de brilho" são vetados | **Carregamento orbital** da CAPRA (ponto Cyan em volta do núcleo). O espectro fica nos detalhes: os λ na tela Sobre e na calibração, e as **marcas de capítulo** na barra do player como "linhas de absorção". |
| Tela de calibração | Cores fora da paleta | **Exceção funcional:** o padrão de teste usa as cores reais, senão a calibração não funciona. O painel por cima segue a CAPRA (Inter, `surfaceElevated`, `radius-lg`, foco Cyan). |
| Sem endosso | Obrigatório | "por CAPRA" na tela Sobre e no rodapé da tela de login, com o arquivo do logotipo CAPRA. |

---

## 3. Direções para explorar

O processo do `09` pede de duas a três direções a partir do mesmo conceito:

- **A — Tela de tubo.** A moldura com cantos amplos, uma faixa de barras pastel na base, o núcleo no centro e o LED (ponto orbital) fora da moldura. É a evolução direta da v0.1.
- **B — Prisma na tela.** O núcleo no centro da tela emite arcos parciais concêntricos, um por cor, como uma órbita insinuada. É a luz se separando em espectro, dentro da tela. É a mais "CAPRA" das três.
- **C — Barras em órbita.** As barras pastel se curvam num arco parcial em volta do núcleo, como um transferidor de cores. A tela de tubo aparece só no ícone de app. É a mais abstrata.

Cada direção passa pelos **testes do `09`**:
- **Parentesco:** ao lado do logo CAPRA e de duas logos filhas, com os nomes cobertos.
- **Tamanhos:** 16, 32, 64 e 1024 px, sobre preto.
- **Contraste:** pelo menos 3:1 nos elementos essenciais.

---

## 4. Interface (tokens para o `croma-web`)

| Token CAPRA | Valor | Onde entra no jellyfin-web |
|---|---|---|
| `background` | `#121416` | `$background-default` em `src/themes/_base/_palette.scss` |
| `surface` / `surfaceElevated` | `#181B1E` / `#202428` | `$background-paper`, cartões, diálogos |
| `border` / `borderStrong` | `#2A3035` / `#68737A` | divisórias / campos e botões secundários |
| `textPrimary` / `textSecondary` | `#E8ECEE` / `#AAB4B9` | `$text-primary` / `$text-secondary` |
| `accent` (plataforma) | `#8FB8C5` | `$primary-main` (foco, botão primário, progresso) |
| `onAccent` | `#121416` | `$primary-contrastText` |
| `danger` | `#E8877F` | `$error-main` |
| Raios | 8 / 12 / 16 px (TV: 16 / 24 / 32) | componentes MUI e `.layout-tv` |
| Movimento | 100 / 200 / 300 ms, `cubic-bezier(0.2, 0, 0, 1)` | transições de foco e de tela |

**Escala de texto na TV (px de CSS):**

| Nível | Tamanho | Peso |
|---|---|---|
| Display | 80/96 | 700 |
| H1 | 56/72 | 700 |
| H2 | 40/56 | 700 |
| Body | 28/44 | 400 |
| Rótulo | 28/40 | 500 |
| Caption | 24/32 | 400 |

**Margem segura na TV:** 96 px nas laterais e 54 px em cima e embaixo.

---

## 5. Entregas da marca

Este é o conjunto exigido pelo `09` para marcas expressivas:

- [ ] `croma-icone-app.svg` + PNG 1024/512/192/180 (fundo `#121416`, sem transparência)
- [ ] `croma-icone-reduzido.svg` (abaixo de 32 px: só a tela e o núcleo, sem barras)
- [ ] `croma-favicon.svg` + PNG 48/32/16
- [ ] `croma-marca.svg` (sem fundo, só sobre preto)
- [ ] `croma-entrada.svg` (até 800 ms: núcleo → linha → tela abre → barras acendem; respeita movimento reduzido)
- [ ] Logotipo e assinatura no app (marca + "Croma")
- [ ] Assinatura com endosso ("por CAPRA")
- [ ] Ícone e tile do Tizen (conferir tamanhos exigidos no `config.xml` / Seller Office)
- [ ] Ícone do desktop (`.ico` no Windows)
- [ ] `ficha.md` final

---

## 6. Fases

| # | Fase | Resultado |
|---|---|---|
| 1 | **Decisões em aberto** (seção 7) ✅ | Respostas registradas neste arquivo |
| 2 | **Direções A, B e C** no canvas, já com paleta e regras CAPRA ✅ (desenhadas em 04/11/2026; escolha pendente) | Uma direção escolhida |
| 3 | **Refinamento do símbolo** + testes de parentesco, tamanho e contraste | Símbolo aprovado |
| 4 | **Pranchas de interface:** início na TV, detalhe do item, player, calibração, desktop | Telas de referência |
| 5 | **Arquivos finais** (seção 5) | Pasta `capra-marcas-expressivas/croma/` no repositório da CAPRA |
| 6 | **Implementação** no `croma-web` (tema `croma`, logos), `croma-tizen` (`config.xml`, ícone) e `croma-desktop` (nome, ícone) | Croma rodando na TV e no desktop |

---

## 7. Decisões

**Tomadas em 04/11/2026:**

- **Cor por tipo de mídia:** opção **(b)**, exceção pequena. Cada mídia tem uma cor da paleta só em indicadores pequenos (ponto de tipo, barra de progresso). Foco e botões continuam sempre em Cyan.
- **Logotipo:** opção **(b)**, desenhado, com o "o" como tela de tubo, dentro da linguagem maluma.
- **Nome oficial:** **Croma**.

**Ainda em aberto:** a composição das 6 barras (item 2) e a luz de galáxia (item 5).

Opções consideradas:

1. **Cor por tipo de mídia.**
   - **(a)** Seguir o manual: foco e navegação em Cyan, e o tipo de mídia indicado só por ícone.
   - **(b)** Propor uma exceção: cada tipo de mídia ganha uma cor da paleta, só em indicadores pequenos (ponto de tipo e barra de progresso). Foco e botões continuam em Cyan. Isso seria documentado como regra nova no `09`.
2. **Barras: quais 6 cores?** Text, Gold, Cyan, Mint, Lilac, Peach (proposta acima), ou outra composição.
3. **Logotipo.**
   - **(a)** "Croma" em Inter SemiBold, como manda a Parte 9.
   - **(b)** Logotipo desenhado, com o "o" como tela de tubo. O `09` permite desenho próprio se seguir a maluma.
4. **Nome.** O `09` usa "Chroma" e o `registro.csv` usa "Croma". É preciso unificar e marcar `marca expressiva` em `observacoes`.
5. **Luz de galáxia** (halo atrás da marca). O `09` deixa em aberto; a proposta é não usar.

---

## 8. O que muda no repositório CAPRA (quando aprovado)

- `09-marcas-expressivas.md`: o exemplo "Chroma" vira "Croma", com a ficha e a direção escolhida.
- Registrar a regra de "vários acentos na marca" (as barras), se aprovada, e a decisão sobre cor por tipo de mídia.
- Registrar a exceção funcional da tela de calibração.
- `registro.csv`: `observacoes` = `marca expressiva`.

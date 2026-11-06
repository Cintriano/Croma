# Croma

Versão pessoal do Jellyfin com identidade visual própria. Foco inicial: **Desktop** e **TV Samsung QN90B (Tizen 6.5)**.

## Base de versões

| Pasta | Origem (remote `upstream`) | Base | Commit | Branch de trabalho |
|---|---|---|---|---|
| `repos/croma-web` | https://github.com/jellyfin/jellyfin-web | `release-12.z` (v12.4) | `0a580ce8d` | `croma` |
| `repos/croma-tizen` | https://github.com/jellyfin/jellyfin-tizen | `master` | `31408c1` | `croma` |
| `repos/croma-desktop` | https://github.com/jellyfin/jellyfin-desktop | `master` | `51807f8` | `croma` |
| `repos/jellyfin-server` | https://github.com/jellyfin/jellyfin | tag `v12.4` | `83d0d0e7f` | só referência (sem fork) |

Regra: a versão do web **sempre** casa com a do servidor. Para atualizar: `git fetch upstream` + rebase da `croma`.

### Clonar os repositórios

A pasta `repos/` fica fora do git (`.gitignore`). Em uma máquina nova, rode na raiz do projeto:

```
git clone --filter=blob:none -o upstream https://github.com/jellyfin/jellyfin-web.git     repos/croma-web
git clone --filter=blob:none -o upstream https://github.com/jellyfin/jellyfin-tizen.git   repos/croma-tizen
git clone --filter=blob:none -o upstream https://github.com/jellyfin/jellyfin-desktop.git repos/croma-desktop
git clone --filter=blob:none -o upstream https://github.com/jellyfin/jellyfin.git         repos/jellyfin-server

git -C repos/croma-web     switch -c croma 0a580ce8d
git -C repos/croma-tizen   switch -c croma 31408c1
git -C repos/croma-desktop switch -c croma 51807f8
git -C repos/jellyfin-server config core.longpaths true
git -C repos/jellyfin-server checkout v12.4
```

- O `--filter=blob:none` baixa o conteúdo dos arquivos sob demanda, o que deixa o clone bem mais leve.
- Os commits acima são a base em que o projeto foi alinhado. Enquanto a branch `croma` não tiver commits próprios, esses comandos recriam o mesmo estado.
- Quando a branch `croma` ganhar commits, publique os forks no GitHub do usuário. A partir daí, clone de lá.

### Servidor local

O servidor roda com o binário oficial portátil, sem instalador e sem compilar.

1. Baixe `jellyfin_12.4-amd64.zip`, de 199 MB, em https://repo.jellyfin.org/?path=/server/windows/latest-stable/amd64. O MD5 é `d390761b996d08b7bc24e5201c61b72b`. Se o servidor principal estiver lento, use um espelho da lista `?mirrorlist`.
2. Extraia o zip em `servidor/`, que fica fora do git. O resultado é `servidor/jellyfin/jellyfin.exe`.
3. Gere o build da interface em `repos/croma-web`: `npm ci`, depois `npm run build:production`.
4. Rode `scripts/iniciar-servidor.ps1` e abra http://localhost:8096. O banco, a configuração, o cache e os logs ficam em `servidor/dados/`.

O servidor lê o `dist/` direto do disco. Depois de um novo build, basta recarregar a página, sem reiniciar o servidor.

### Outros repositórios de referência

| Repositório | Para quê |
|---|---|
| https://github.com/jellyfin/jellyfin-androidtv | App de Android TV (fase futura) |
| https://github.com/jellyfin/jellyfin-android | App de Android (fase futura) |
| https://github.com/jellyfin/jellyfin-vue | Cliente web alternativo (não usado: não tem layout de TV) |
| https://github.com/jellyfin/jellyfin-ffmpeg | FFmpeg usado pelo servidor |
| https://github.com/jellyfin/jellyfin-kodi | Integração com o Kodi |
| https://github.com/jellyfin/jellyfin.org | Site e documentação oficial |
| https://github.com/awesome-jellyfin/awesome-jellyfin | Lista de plugins, temas e clientes da comunidade |

## Arquitetura

```
croma-web (fork do jellyfin-web)  ← toda a identidade visual mora aqui
   ├─ build → servidor serve via --webdir → Desktop (carrega a UI do servidor) + navegador
   └─ build → croma-tizen empacota o dist/ → .wgt na TV
```

## Mapa do croma-web (onde mexer)

- **Paleta base:** `src/themes/_base/_palette.scss` (cor primária hoje `#00a4dc`), `src/themes/_base/theme.ts`
- **Registro de temas (MUI):** `src/themes/index.ts`; tema padrão em `src/config.json` → `themes[].default`
- **Tema Croma:** criar `src/themes/croma/{index.ts,theme.scss}`, registrar em `index.ts` e `config.json`
- **Logos:** vêm do pacote `@jellyfin/ux-web`; referências em `src/styles/site.scss`, `src/themes/_base/_theme.scss`,
  `src/apps/modern/components/drawers/DrawerHeaderLink.tsx`, `src/components/toolbar/ServerButton.tsx`,
  `src/plugins/logoScreensaver/plugin.js`
- **Nome do app:** `src/index.html` (`<title>`, `application-name`), `src/manifest.json`, strings em `src/strings/`
- **Layouts:** `src/apps/modern` (React, desktop) e `src/apps/legacy` (controllers antigos, inclusive vários usados no modo TV)
- **Modo TV:** classe `.layout-tv` (CSS) + `layoutManager.tv` (JS). Testar toda mudança visual nesse modo

## Mapa das cascas

- **Tizen:** `config.xml` (nome, ids `AprZAARz4r.Jellyfin`, `widget id`), `icon.png`
- **Desktop:** `CMakeModules/NameConfiguration.cmake`, `resources/images`, `native/find-webclient.*` (tela de conexão),
  `bundle/win/JellyfinDesktop.iss.in` (instalador Windows)

## Pendências

- [x] Instalar o servidor Jellyfin v12.4 oficial: versão portátil em `servidor/`, fora do git (veja "Servidor local")
- [x] Tema "Croma" e marca no `croma-web` (paleta, fontes, cantos vivos, foco, logos, nome e ícones): commit `e5f1c1a4c` na branch `croma`, **só local**
- [ ] Publicar os forks no GitHub (`Cintriano/croma-web` etc.). Sem isso, os commits da branch `croma` existem só na máquina CintraMan, e os comandos de clonagem acima recriam apenas a base
- [ ] Tizen Studio + certificado Samsung + Developer Mode na TV
- [x] Identidade visual: v0.1 "Barras" definida como oficial (05/11/2026)
- [ ] Implementar a v0.1 no `croma-web` (tema, logos, ícones e telas), no `croma-tizen` (ícone e tile) e no `croma-desktop` (ícone `.ico`)
- [x] Detalhar a dinâmica das coleções (especificada em 05/11/2026; veja "Coleções" abaixo)
- [ ] Implementar coleções por biblioteca e modo de exibição
- [ ] Definir o formato estruturado das bibliotecas caseiras (o usuário está desenvolvendo)

## Coleções (especificação, 05/11/2026)

No Jellyfin, as coleções são globais: moram na biblioteca virtual "Coleções". No Croma, cada coleção pertence a uma biblioteca.

- **Posse:** cada coleção tem uma biblioteca dona, gravada como tag reservada no `BoxSet` (`croma-bib-<idDaBiblioteca>`). A coleção é criada dentro da biblioteca e só aparece nela.
- **Só itens da própria biblioteca:** uma coleção de Filmes não aceita séries. "Adicionar à coleção" lista só as coleções da biblioteca do item.
- **Sem tela global:** a biblioteca "Coleções" (`/boxsets`) sai do Início e do menu. Toda biblioteca tem a aba "Coleções", inclusive Vídeos e Clipes.
- **Dois controles de exibição, pôster (vertical) ou miniatura (horizontal):**
  1. **Por biblioteca:** vale para a aba "Coleções" daquela biblioteca. Todos os cartões de coleção têm o mesmo formato.
  2. **Por coleção:** vale para os itens dentro dela. Todos os itens têm o mesmo formato. Fica gravado como tag no `BoxSet` (`croma-exibir-miniatura`; sem a tag, é pôster).
  - Nunca há formatos misturados na mesma tela. O padrão é pôster.
  - A configuração fica no servidor, não no `localStorage`, para valer igual no desktop e na TV.
  - Miniatura sem arte horizontal (Thumb) usa o fundo (Backdrop) e, sem nenhum dos dois, a capa gerada.
- **Tags reservadas:** as que começam com `croma-` não aparecem nas telas de tags.
- **Migração:** um script atribui dono às coleções que já existem, pela maioria do conteúdo, e conserta coleções órfãs quando uma biblioteca é recriada.
- **Onde mexer no `croma-web`:**
  - `libraryRoutes.ts`: abas e rota `/boxsets`;
  - `useFetchItems.ts`: consulta da aba Coleções;
  - `components/collectionEditor`: criar coleção e adicionar itens;
  - `itemDetails/index.js`, em `renderCollectionItemType`: formato dos itens.

## Bibliotecas caseiras (Vídeos e Fotos)

As bibliotecas de arquivos caseiros, de vídeos ou de fotos, têm dois tipos de varredura:

1. **Genérica:** a varredura padrão do Jellyfin, sem estrutura obrigatória.
2. **Estruturada (Croma):** segue uma estrutura de pastas com níveis, como as pastas `Nivel_1..3` do v1 em `legado/`. **O formato está em desenvolvimento pelo usuário** e será adicionado depois.

A varredura roda no servidor (C#). Por isso, o modo estruturado deve ser um **plugin do Jellyfin**, com resolvedor de itens e leitor de metadados, o que exige instalar o .NET SDK. Até lá, a biblioteca usa o modo genérico.

## Identidade visual

A identidade oficial é a **v0.1 "Barras"**, decidida em 05/11/2026. O manual está em `identidade/v0.1-barras/MANUAL.md`. Os arquivos prontos para uso ficam em `identidade/v0.1-barras/logos/` (logotipo, símbolo, ícones das bibliotecas e `app/` com os ícones de cada plataforma).

| Versão | Pasta | Status |
|---|---|---|
| v0.1 "Barras" | `identidade/v0.1-barras/` | **Oficial** |
| v0.2 "CAPRA" | `identidade/v0.2-capra/` | Arquivada (referência) |

Canvas com todas as pranchas: https://claude.ai/artifact/AUKTY2yvnHh4ZYk1c7qpLi (páginas "v0.1 Barras" e "v0.2 Direções CAPRA").

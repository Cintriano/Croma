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

- [ ] Instalar o servidor Jellyfin v12.4 oficial (binário; não precisa compilar)
- [ ] Tizen Studio + certificado Samsung + Developer Mode na TV
- [x] Identidade visual: v0.1 "Barras" definida como oficial (05/11/2026)
- [ ] Implementar a v0.1 no `croma-web` (tema, logos, ícones e telas), no `croma-tizen` (ícone e tile) e no `croma-desktop` (ícone `.ico`)
- [ ] Detalhar a dinâmica das coleções (adiado a pedido do usuário)

## Identidade visual

A identidade oficial é a **v0.1 "Barras"**, decidida em 05/11/2026. O manual está em `identidade/v0.1-barras/MANUAL.md`. Os arquivos prontos para uso ficam em `identidade/v0.1-barras/logos/` (logotipo, símbolo, ícones das bibliotecas e `app/` com os ícones de cada plataforma).

| Versão | Pasta | Status |
|---|---|---|
| v0.1 "Barras" | `identidade/v0.1-barras/` | **Oficial** |
| v0.2 "CAPRA" | `identidade/v0.2-capra/` | Arquivada (referência) |

Canvas com todas as pranchas: https://claude.ai/artifact/AUKTY2yvnHh4ZYk1c7qpLi (páginas "v0.1 Barras" e "v0.2 Direções CAPRA").

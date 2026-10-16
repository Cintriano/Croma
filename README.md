# Croma — Central de Mídia Local

Central de mídia pessoal que organiza as fotos guardadas nos discos da máquina e as mostra em três interfaces: **desktop**, **celular** e **TV** (Samsung QN90B, pelo navegador Tizen). Tudo roda na rede de casa, sem nuvem, login nem busca online. O conteúdo, os metadados e o cache ficam na própria máquina.

A primeira fase cobre a biblioteca de **Fotos**. Músicas aparece só como prévia "Em breve", com dados de exemplo. Filmes, Séries e Vídeos estão previstos para as próximas fases.

- [`DOCUMENTACAO.md`](DOCUMENTACAO.md): o que o site deve fazer (telas, regras, identidade visual).
- [`PLANO_IMPLEMENTACAO.md`](PLANO_IMPLEMENTACAO.md): como é construído (módulos, contratos, testes e situação atual).

## Requisitos

| Requisito | Versão | Para quê |
| --- | --- | --- |
| Node.js | 22.13 ou mais novo (testado no 24) | Servidor e build; o banco usa o SQLite nativo do Node (`node:sqlite`) |
| npm | o que vem com o Node | Instalar as dependências |
| Git | qualquer versão recente | Clonar o repositório |
| Chromium do Playwright | baixado com `npx playwright install chromium` | Só para os testes ponta a ponta |

- **Sistema:** desenvolvido e testado no Windows 11. Deve funcionar em Linux e macOS, mas sem testes nessas plataformas.
- **Nada para compilar:** as dependências nativas (sharp) já vêm pré-compiladas, e não há banco externo para instalar.
- **Navegadores:** Chrome, Edge ou Firefox atuais no desktop e no celular; na TV, o navegador próprio da Samsung (Tizen).
- **Rede:** a máquina, o celular e a TV na mesma rede local. Libere a porta do servidor (8080 por padrão) no firewall do Windows para acessar de outros aparelhos.
- **Disco:** espaço para o cache de imagens, em torno de 3 versões JPEG pequenas por foto, na pasta `dados/cache`.

As dependências do projeto estão no `package.json`; `npm install` instala todas.

## Como rodar

```bash
npm install
npm run build:web   # compila o front-end em dist/web
npm run servidor    # sobe a API e o site em http://localhost:8080
```

Para usar, abra http://localhost:8080 e vá em **Configurações → Bibliotecas → Nova biblioteca**. Escolha o caminho da pasta de fotos (ex.: `F:\Fotos`); a prévia mostra os álbuns e os avisos antes de salvar. Na mesma rede, o celular acessa pelo IP da máquina (ex.: `http://192.168.0.10:8080`) e a TV por `http://<ip>:8080/tv`.

### Desenvolvimento do front-end

Com recarga automática, em dois terminais:

```bash
npm run servidor    # API na porta 8080
npm run web         # Vite em http://localhost:5173, repassando /api para a 8080
```

### Configuração

Variáveis de ambiente opcionais:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORTA` | `8080` | Porta do servidor |
| `CAMINHO_BANCO` | `dados/central-midia.sqlite` | Arquivo do banco (`:memory:` para um banco temporário) |
| `CAMINHO_CACHE` | `dados/cache` | Versões redimensionadas das fotos |

A pasta `dados/` fica fora do Git. Apagar o banco não perde nada: as tags e os metadados estão nos JSON das pastas e voltam na próxima varredura.

## Testes

| Comando | O que roda |
| --- | --- |
| `npm test` | Todos os testes unitários e de integração (Vitest) |
| `npm run test:servidor` | Só o servidor (M0–M7) |
| `npm run test:web` | Só o front-end (M8–M17) |
| `npx vitest run m07` | Um módulo só, pelo número |
| `npm run test:e2e` | Fluxos no navegador: desktop, celular e TV (Playwright) |
| `npm run typecheck` | Verificação de tipos |

Antes do primeiro `test:e2e`, baixe o navegador uma vez com `npx playwright install chromium`. Os testes ponta a ponta criam uma biblioteca de fotos temporária e sobem o servidor com banco em memória, sem tocar nos seus dados.

## Como as fotos são organizadas no disco

Cada subpasta do caminho escolhido vira um álbum. Dentro dele, as fotos ficam separadas por nível, e a pasta `metadados` guarda os JSON:

```
F:\Fotos\
  Viagem Nordeste\
    metadados\
      colecao.json    ← título, tags, descrição, oculto e outros campos do álbum
      fotos.json      ← tags de cada foto (criado na primeira tag)
    Nivel_1\          ← fotos de nível 1 (★1)
    Nivel_2\
    Nivel_3\
    solta.jpg         ← fotos na raiz entram sem nível
```

- **Formatos aceitos:** jpg, jpeg, png e webp. Outras subpastas (ex.: `Extras`, `Nivel_4`) são ignoradas e geram um aviso na varredura.
- **Fotos nunca são alteradas.** O sistema só escreve no `colecao.json` e no `fotos.json`, e sempre por gravação atômica: grava um temporário e depois troca o arquivo.
- **Foto movida ou renomeada fora do sistema:** a varredura reencontra as tags dela pelo nome e tamanho, ou pelo tamanho e data EXIF. Se não achar, a entrada fica guardada como órfã e gera um aviso.

## O que já funciona

- **Biblioteca:**
  - Grade de álbuns e pesquisa por tags, de álbuns ou de fotos. Na pesquisa de fotos, cada foto herda as tags do álbum.
  - Modos **Todas** e **Qualquer** tag, com a pesquisa guardada na URL.
  - **Mostrar ocultos** e edição de tags em massa.
- **Álbum:**
  - Cabeçalho com contagem por nível, filtro e ordenação (nível, data, nome).
  - Botões **Aleatório** e **Slides** (em sequência ou aleatório).
  - Painel **⚙** para título, ano, descrição, tags e ocultar o álbum.
- **Visualizador:**
  - Foto em tela cheia, com URL própria (`/album/12/viagem-nordeste/foto/731`).
  - Navegação por ← →, botões ou deslizar o dedo; fecha com Esc, Voltar ou clique fora.
  - Painel ⓘ com EXIF e as tags da foto: as próprias são editáveis e as herdadas do álbum aparecem separadas.
- **Escolha de tags:** a lista das tags existentes abre ao focar o campo, com as mais usadas e todas de A a Z. Ela avisa quando o texto parece uma tag existente digitada errado (ex.: `famila` → `família`).
- **Celular:** barra inferior, sem configurações nem ⚙, tags só para leitura.
- **TV:** em `/tv/...`, tudo por setas, OK e Voltar.
  - Aceita os códigos do controle Samsung.
  - O foco volta ao card de onde você saiu.
  - A pesquisa usa uma grade de tags, sem campos de texto e sem zoom no visualizador.
- **Cache de imagens:** versões de 300, 600 e 1200 px, geradas sob demanda e já na orientação do EXIF.

As pendências (validação na TV real, artes próprias dos álbuns e outras simplificações) estão em "Situação atual", no plano.

## Tecnologia

| Camada | Escolha |
| --- | --- |
| Servidor | Node.js + Fastify, executado com `tsx` |
| Banco | SQLite nativo (`node:sqlite`), com migrações |
| Imagens | sharp (redimensionar, orientar) e exifr (EXIF) |
| Front-end | React + React Router, compilado com Vite |
| Testes | Vitest + Testing Library; Playwright para os fluxos no navegador |

## Estrutura

```
server/src/
  app.ts, principal.ts, config.ts   ← montagem do servidor e configuração
  db/          ← banco, migrações e repositório
  fotos/       ← varredura, níveis e sincronização com o banco
  metadados/   ← colecao.json, fotos.json, tags e gravação atômica
  imagens/     ← EXIF e cache de versões redimensionadas
  busca/       ← pesquisa por tags (funções puras)
  rotas/       ← rotas HTTP sob /api
web/src/
  paginas/     ← Início, Biblioteca, Álbum, Configurações, Músicas
  componentes/ ← visualizador, slides, TagPicker, cards, filtros...
  logica/      ← regras sem interface (ordenação, slides, pesquisa, rotas)
  tv/          ← navegação por controle remoto e telas da TV
  tema/        ← paleta Brasa Neon e estilos
tests/
  servidor/    ← M0–M7
  web/         ← M8–M17
  e2e/         ← fluxos completos no navegador
  ajuda/       ← gerador de bibliotecas de fotos de teste
```

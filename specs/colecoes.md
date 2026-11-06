# Coleções por biblioteca (especificação, 05/11/2026)

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


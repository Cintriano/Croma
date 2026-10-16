import { chaveBusca } from '../metadados/tags';

// Funções puras de pesquisa por tags. A comparação usa a chave de busca (sem maiúsculas e acentos).

export type ModoBusca = 'todas' | 'qualquer';

export interface FotoBusca {
  id: number;
  nivel: number | null;
  tags: string[];
}

export interface AlbumBusca<F extends FotoBusca = FotoBusca> {
  id: number;
  titulo: string;
  tags: string[];
  oculto: boolean;
  fotos: F[];
}

export interface FiltroTags {
  tags: string[];
  modo: ModoBusca;
}

export type FotoEncontrada<F extends FotoBusca = FotoBusca> = F & {
  albumId: number;
  albumTitulo: string;
  proprias: string[];
  herdadas: string[];
};

export interface ContagemTag {
  tag: string;
  albuns: number;
  fotos: number;
  usos: number;
}

// As tags do álbum valem para a foto na leitura; uma tag repetida fica só como própria.
export function tagsEfetivas(proprias: string[], doAlbum: string[]): { proprias: string[]; herdadas: string[] } {
  const chaves = new Set(proprias.map(chaveBusca));
  return { proprias: [...proprias], herdadas: doAlbum.filter((tag) => !chaves.has(chaveBusca(tag))) };
}

export function filtrarAlbuns<A extends { tags: string[]; oculto: boolean }>(albuns: A[], filtro: FiltroTags & { incluirOcultos?: boolean }): A[] {
  const combina = criarCombinador(filtro);
  return albuns.filter((album) => (filtro.incluirOcultos || !album.oculto) && combina(album.tags));
}

export function buscarFotos<F extends FotoBusca>(
  albuns: AlbumBusca<F>[],
  filtro: FiltroTags & { nivel?: number | null },
): FotoEncontrada<F>[] {
  const combina = criarCombinador(filtro);
  const encontradas: FotoEncontrada<F>[] = [];
  for (const album of albuns) {
    if (album.oculto) continue;
    for (const foto of album.fotos) {
      if (filtro.nivel !== undefined && filtro.nivel !== null && foto.nivel !== filtro.nivel) continue;
      if (!combina([...foto.tags, ...album.tags])) continue;
      encontradas.push({ ...foto, albumId: album.id, albumTitulo: album.titulo, ...tagsEfetivas(foto.tags, album.tags) });
    }
  }
  return encontradas;
}

// Lista de tags existentes (sem os ocultos), da mais usada para a menos usada e, no empate, de A a Z.
export function contarTags(albuns: AlbumBusca<any>[]): ContagemTag[] {
  const porChave = new Map<string, ContagemTag>();
  const contar = (tag: string, campo: 'albuns' | 'fotos') => {
    const chave = chaveBusca(tag);
    const item = porChave.get(chave) ?? { tag, albuns: 0, fotos: 0, usos: 0 };
    item[campo]++;
    item.usos++;
    porChave.set(chave, item);
  };

  for (const album of albuns) {
    if (album.oculto) continue;
    for (const tag of semRepetir(album.tags)) contar(tag, 'albuns');
    for (const foto of album.fotos as FotoBusca[]) {
      for (const tag of semRepetir(foto.tags)) contar(tag, 'fotos');
    }
  }
  return [...porChave.values()].sort((a, b) => b.usos - a.usos || a.tag.localeCompare(b.tag, 'pt-BR'));
}

// Primeira forma de cada tag, ignorando variações de maiúsculas e acentos.
function semRepetir(tags: string[]): string[] {
  const vistas = new Map<string, string>();
  for (const tag of tags) if (!vistas.has(chaveBusca(tag))) vistas.set(chaveBusca(tag), tag);
  return [...vistas.values()];
}

function criarCombinador({ tags, modo }: FiltroTags): (tagsDoItem: string[]) => boolean {
  const procuradas = [...new Set(tags.map(chaveBusca).filter(Boolean))];
  if (procuradas.length === 0) return () => true;
  return (tagsDoItem) => {
    const chaves = new Set(tagsDoItem.map(chaveBusca));
    return modo === 'todas' ? procuradas.every((t) => chaves.has(t)) : procuradas.some((t) => chaves.has(t));
  };
}

// M6 — Busca: álbuns por tags, fotos com herança das tags do álbum, contagem de tags e ocultos.
import { describe, expect, it } from 'vitest';
import {
  buscarFotos,
  contarTags,
  filtrarAlbuns,
  tagsEfetivas,
  type AlbumBusca,
} from '../../server/src/busca/tags';

const ALBUNS: AlbumBusca[] = [
  {
    id: 1,
    titulo: 'Viagem Nordeste',
    tags: ['praia', 'família', 'nordeste'],
    oculto: false,
    fotos: [
      { id: 11, nivel: 1, tags: ['mar', 'pôr do sol'] },
      { id: 12, nivel: 2, tags: [] },
      { id: 13, nivel: 3, tags: ['mar'] },
    ],
  },
  {
    id: 2,
    titulo: 'Aniversário 2025',
    tags: ['família', 'festa'],
    oculto: false,
    fotos: [
      { id: 21, nivel: 1, tags: ['bolo'] },
      { id: 22, nivel: 2, tags: ['mar'] },
    ],
  },
  {
    id: 3,
    titulo: 'Neve',
    tags: ['neve', 'família'],
    oculto: true,
    fotos: [{ id: 31, nivel: 1, tags: ['mar'] }],
  },
];

const ids = (lista: { id: number }[]) => lista.map((x) => x.id);

describe('M6 · tags efetivas de uma foto', () => {
  it('separa próprias e herdadas do álbum', () => {
    expect(tagsEfetivas(['mar'], ['praia', 'família'])).toEqual({ proprias: ['mar'], herdadas: ['praia', 'família'] });
  });

  it('tag repetida aparece só uma vez, como própria', () => {
    expect(tagsEfetivas(['praia', 'mar'], ['praia', 'família'])).toEqual({ proprias: ['praia', 'mar'], herdadas: ['família'] });
  });
});

describe('M6 · pesquisa de álbuns', () => {
  it('modo todas exige todas as tags', () => {
    expect(ids(filtrarAlbuns(ALBUNS, { tags: ['família', 'praia'], modo: 'todas' }))).toEqual([1]);
  });

  it('modo qualquer aceita pelo menos uma', () => {
    expect(ids(filtrarAlbuns(ALBUNS, { tags: ['praia', 'festa'], modo: 'qualquer' }))).toEqual([1, 2]);
  });

  it('ignora maiúsculas e acentos', () => {
    expect(ids(filtrarAlbuns(ALBUNS, { tags: ['FAMILIA'], modo: 'todas' }))).toEqual([1, 2]);
  });

  it('sem tags retorna todos os visíveis', () => {
    expect(ids(filtrarAlbuns(ALBUNS, { tags: [], modo: 'todas' }))).toEqual([1, 2]);
  });

  it('álbuns ocultos ficam de fora, a menos que pedidos', () => {
    expect(ids(filtrarAlbuns(ALBUNS, { tags: ['neve'], modo: 'todas' }))).toEqual([]);
    expect(ids(filtrarAlbuns(ALBUNS, { tags: ['neve'], modo: 'todas', incluirOcultos: true }))).toEqual([3]);
  });

  it('não considera tags das fotos ao procurar álbuns', () => {
    expect(ids(filtrarAlbuns(ALBUNS, { tags: ['bolo'], modo: 'todas' }))).toEqual([]);
  });
});

describe('M6 · pesquisa de fotos com herança', () => {
  it('foto com tag própria + tag herdada do álbum é encontrada no modo todas', () => {
    expect(ids(buscarFotos(ALBUNS, { tags: ['mar', 'nordeste'], modo: 'todas' }))).toEqual([11, 13]);
  });

  it('tag só do álbum encontra todas as fotos do álbum', () => {
    expect(ids(buscarFotos(ALBUNS, { tags: ['festa'], modo: 'todas' }))).toEqual([21, 22]);
  });

  it('modo qualquer junta resultados de próprias e herdadas', () => {
    expect(ids(buscarFotos(ALBUNS, { tags: ['bolo', 'nordeste'], modo: 'qualquer' }))).toEqual([11, 12, 13, 21]);
  });

  it('fotos de álbum oculto nunca aparecem', () => {
    expect(ids(buscarFotos(ALBUNS, { tags: ['mar'], modo: 'todas' }))).toEqual([11, 13, 22]);
  });

  it('cada resultado informa o álbum de origem e as tags separadas', () => {
    const [foto] = buscarFotos(ALBUNS, { tags: ['bolo'], modo: 'todas' });
    expect(foto).toMatchObject({ id: 21, albumId: 2, albumTitulo: 'Aniversário 2025', proprias: ['bolo'], herdadas: ['família', 'festa'] });
  });

  it('filtro por nível combina com as tags', () => {
    expect(ids(buscarFotos(ALBUNS, { tags: ['mar'], modo: 'todas', nivel: 3 }))).toEqual([13]);
  });
});

describe('M6 · contagem de tags (lista para selecionar)', () => {
  it('conta álbuns e fotos por tag, sem os ocultos', () => {
    const contagem = contarTags(ALBUNS);
    expect(contagem.find((t) => t.tag === 'família')).toEqual({ tag: 'família', albuns: 2, fotos: 0, usos: 2 });
    expect(contagem.find((t) => t.tag === 'mar')).toEqual({ tag: 'mar', albuns: 0, fotos: 3, usos: 3 });
    expect(contagem.some((t) => t.tag === 'neve')).toBe(false);
  });

  it('ordena por uso (maior primeiro) e depois alfabeticamente', () => {
    const tags = contarTags(ALBUNS).map((t) => t.tag);
    expect(tags.slice(0, 2)).toEqual(['mar', 'família']);
    const umUso = tags.slice(2);
    expect(umUso).toEqual([...umUso].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  });
});

// M4 — Banco e índice: salvar varredura, ids estáveis, contagens, tags, ocultos e indisponíveis.
import { beforeEach, describe, expect, it } from 'vitest';
import { abrirBanco, type Banco } from '../../server/src/db/banco';
import {
  criarBiblioteca,
  listarAlbuns,
  listarBibliotecas,
  listarFotosDoAlbum,
  obterAlbum,
  salvarVarredura,
} from '../../server/src/db/repositorio';
import type { AlbumVarrido, ResultadoVarredura } from '../../server/src/fotos/varredura';

function albumVarrido(nome: string, extra: Partial<AlbumVarrido> = {}): AlbumVarrido {
  return {
    nome,
    caminho: `F:/Fotos/${nome}`,
    titulo: nome,
    colecao: { titulo: nome, tags: [], oculto: false },
    fotosJson: { versao: 1, fotos: {} },
    fotosJsonAlterado: false,
    fotos: [
      { caminhoRelativo: 'Nivel_1/a.jpg', nivel: 1, tamanho: 10, modificadoEm: 1, exif: null },
      { caminhoRelativo: 'Nivel_2/b.jpg', nivel: 2, tamanho: 20, modificadoEm: 1, exif: null },
      { caminhoRelativo: 'solta.jpg', nivel: null, tamanho: 30, modificadoEm: 1, exif: null },
    ],
    contagem: { total: 3, nivel1: 1, nivel2: 1, nivel3: 0, semNivel: 1 },
    ...extra,
  };
}

const resultado = (...albuns: AlbumVarrido[]): ResultadoVarredura => ({
  albuns,
  avisos: [],
  alteracoes: { novas: [], alteradas: [], removidas: [] },
});

describe('M4 · bibliotecas', () => {
  it('cria e lista bibliotecas de fotos', () => {
    const db = abrirBanco(':memory:');
    const criada = criarBiblioteca(db, { nome: 'Fotos da família', tipo: 'fotos', caminho: 'F:/Fotos' });
    expect(criada.id).toBeTypeOf('number');
    expect(listarBibliotecas(db)).toEqual([expect.objectContaining({ nome: 'Fotos da família', tipo: 'fotos', caminho: 'F:/Fotos' })]);
  });

  it('permite mais de uma biblioteca de fotos', () => {
    const db = abrirBanco(':memory:');
    criarBiblioteca(db, { nome: 'A', tipo: 'fotos', caminho: 'F:/A' });
    criarBiblioteca(db, { nome: 'B', tipo: 'fotos', caminho: 'F:/B' });
    expect(listarBibliotecas(db)).toHaveLength(2);
  });
});

describe('M4 · salvar varredura', () => {
  let db: Banco;
  let bibliotecaId: number;
  beforeEach(() => {
    db = abrirBanco(':memory:');
    bibliotecaId = criarBiblioteca(db, { nome: 'Fotos', tipo: 'fotos', caminho: 'F:/Fotos' }).id;
  });

  it('grava álbuns com contagem por nível', () => {
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia')));
    const [album] = listarAlbuns(db, bibliotecaId);
    expect(obterAlbum(db, album.id)?.contagem).toEqual({ total: 3, nivel1: 1, nivel2: 1, nivel3: 0, semNivel: 1 });
  });

  it('mantém os ids de álbuns e fotos entre varreduras', () => {
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia')));
    const antes = listarAlbuns(db, bibliotecaId)[0];
    const fotosAntes = listarFotosDoAlbum(db, antes.id).map((f) => f.id);
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia')));
    const depois = listarAlbuns(db, bibliotecaId)[0];
    expect(depois.id).toBe(antes.id);
    expect(listarFotosDoAlbum(db, depois.id).map((f) => f.id)).toEqual(fotosAntes);
  });

  it('álbum que sumiu do disco fica indisponível, sem ser apagado', () => {
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia'), albumVarrido('Neve')));
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia')));
    const neve = listarAlbuns(db, bibliotecaId, { incluirIndisponiveis: true }).find((a) => a.nome === 'Neve');
    expect(neve?.disponivel).toBe(false);
    expect(listarAlbuns(db, bibliotecaId).map((a) => a.nome)).toEqual(['Praia']);
  });

  it('álbum que volta ao disco fica disponível de novo com o mesmo id', () => {
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Neve')));
    const id = listarAlbuns(db, bibliotecaId)[0].id;
    salvarVarredura(db, bibliotecaId, resultado());
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Neve')));
    expect(listarAlbuns(db, bibliotecaId)[0]).toMatchObject({ id, disponivel: true });
  });

  it('álbum oculto só aparece com incluirOcultos', () => {
    salvarVarredura(db, bibliotecaId, resultado(
      albumVarrido('Praia'),
      albumVarrido('Neve', { colecao: { titulo: 'Neve', tags: [], oculto: true } }),
    ));
    expect(listarAlbuns(db, bibliotecaId).map((a) => a.nome)).toEqual(['Praia']);
    expect(listarAlbuns(db, bibliotecaId, { incluirOcultos: true }).map((a) => a.nome)).toEqual(['Neve', 'Praia']);
  });

  it('indexa tags do álbum e tags de cada foto', () => {
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia', {
      colecao: { titulo: 'Praia', tags: ['mar', 'família'], oculto: false },
      fotosJson: { versao: 1, fotos: { 'Nivel_1/a.jpg': { tags: ['pôr do sol'], tamanho: 10 } } },
    })));
    const album = listarAlbuns(db, bibliotecaId)[0];
    expect(obterAlbum(db, album.id)?.tags).toEqual(['mar', 'família']);
    const foto = listarFotosDoAlbum(db, album.id).find((f) => f.caminhoRelativo === 'Nivel_1/a.jpg');
    expect(foto?.tags).toEqual(['pôr do sol']);
  });

  it('remove do índice as tags que saíram do JSON', () => {
    const comTag = albumVarrido('Praia', { colecao: { titulo: 'Praia', tags: ['mar'], oculto: false } });
    salvarVarredura(db, bibliotecaId, resultado(comTag));
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia')));
    expect(obterAlbum(db, listarAlbuns(db, bibliotecaId)[0].id)?.tags).toEqual([]);
  });

  it('foto removida do disco sai da contagem', () => {
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia')));
    const menor = albumVarrido('Praia');
    menor.fotos = menor.fotos.slice(0, 1);
    menor.contagem = { total: 1, nivel1: 1, nivel2: 0, nivel3: 0, semNivel: 0 };
    salvarVarredura(db, bibliotecaId, resultado(menor));
    const album = listarAlbuns(db, bibliotecaId)[0];
    expect(obterAlbum(db, album.id)?.contagem.total).toBe(1);
    expect(listarFotosDoAlbum(db, album.id)).toHaveLength(1);
  });

  it('fotos do álbum vêm na ordem de nível e nome, com as sem nível no fim', () => {
    salvarVarredura(db, bibliotecaId, resultado(albumVarrido('Praia')));
    const fotos = listarFotosDoAlbum(db, listarAlbuns(db, bibliotecaId)[0].id);
    expect(fotos.map((f) => f.caminhoRelativo)).toEqual(['Nivel_1/a.jpg', 'Nivel_2/b.jpg', 'solta.jpg']);
  });
});

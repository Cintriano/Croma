import path from 'node:path';
import type { AlbumVarrido, ContagemNiveis, ResultadoVarredura, VarreduraAnterior } from '../fotos/varredura';
import type { Colecao } from '../metadados/colecao';
import { chaveBusca } from '../metadados/tags';
import { compararNomes } from '../ordenacao';
import { emTransacao, type Banco } from './banco';

export type TipoBiblioteca = 'fotos';

export interface Biblioteca {
  id: number;
  nome: string;
  tipo: TipoBiblioteca;
  caminho: string;
  criadaEm: number;
  /** Álbuns visíveis e disponíveis. */
  totalColecoes: number;
}

export interface Album {
  id: number;
  bibliotecaId: number;
  /** Nome da pasta. */
  nome: string;
  caminho: string;
  titulo: string;
  colecao: Colecao | null;
  oculto: boolean;
  disponivel: boolean;
  contagem: ContagemNiveis;
  tags: string[];
}

export interface Foto {
  id: number;
  albumId: number;
  caminhoRelativo: string;
  /** Nome do arquivo, sem a pasta de nível. */
  nome: string;
  nivel: 1 | 2 | 3 | null;
  tamanho: number;
  modificadoEm: number;
  camera: string | null;
  orientacao: number | null;
  dataCaptura: string | null;
  /** Tags próprias da foto (do fotos.json), sem as herdadas do álbum. */
  tags: string[];
}

export interface OpcoesListarAlbuns {
  incluirOcultos?: boolean;
  incluirIndisponiveis?: boolean;
}

// ── Bibliotecas ────────────────────────────────────────────────────────────

export function criarBiblioteca(db: Banco, dados: { nome: string; tipo: TipoBiblioteca; caminho: string }): Biblioteca {
  const { id } = db
    .prepare('INSERT INTO bibliotecas (nome, tipo, caminho, criada_em) VALUES (?, ?, ?, ?) RETURNING id')
    .get(dados.nome, dados.tipo, dados.caminho, Date.now()) as { id: number };
  return obterBiblioteca(db, id)!;
}

export function listarBibliotecas(db: Banco): Biblioteca[] {
  return (db.prepare(`${SELECT_BIBLIOTECA} ORDER BY b.id`).all() as any[]).map(linhaParaBiblioteca);
}

export function obterBiblioteca(db: Banco, id: number): Biblioteca | undefined {
  const linha = db.prepare(`${SELECT_BIBLIOTECA} WHERE b.id = ?`).get(id);
  return linha ? linhaParaBiblioteca(linha) : undefined;
}

const SELECT_BIBLIOTECA = `
  SELECT b.*, (SELECT COUNT(*) FROM albuns a WHERE a.biblioteca_id = b.id AND a.oculto = 0 AND a.disponivel = 1) AS total_colecoes
  FROM bibliotecas b`;

function linhaParaBiblioteca(linha: any): Biblioteca {
  return {
    id: linha.id,
    nome: linha.nome,
    tipo: linha.tipo,
    caminho: linha.caminho,
    criadaEm: linha.criada_em,
    totalColecoes: linha.total_colecoes,
  };
}

// ── Varredura ──────────────────────────────────────────────────────────────

// Grava o resultado de uma varredura completa da biblioteca.
// Álbuns e fotos são casados pelo nome da pasta e pelo caminho relativo, para manter os ids.
// Álbuns que não vieram ficam indisponíveis (não são apagados); fotos que não vieram são removidas.
export function salvarVarredura(db: Banco, bibliotecaId: number, resultado: ResultadoVarredura): void {
  emTransacao(db, () => {
    const vistos = new Set<number>();
    for (const album of resultado.albuns) vistos.add(salvarAlbum(db, bibliotecaId, album));

    const marcar = db.prepare('UPDATE albuns SET disponivel = 0 WHERE id = ?');
    for (const { id } of db.prepare('SELECT id FROM albuns WHERE biblioteca_id = ?').all(bibliotecaId) as { id: number }[]) {
      if (!vistos.has(id)) marcar.run(id);
    }
  });
}

function salvarAlbum(db: Banco, bibliotecaId: number, album: AlbumVarrido): number {
  const c = album.contagem;
  const { id } = db
    .prepare(
      `INSERT INTO albuns (biblioteca_id, nome, caminho, titulo, colecao, oculto, disponivel, total, nivel1, nivel2, nivel3, sem_nivel)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
       ON CONFLICT (biblioteca_id, nome) DO UPDATE SET
         caminho = excluded.caminho, titulo = excluded.titulo, colecao = excluded.colecao, oculto = excluded.oculto,
         disponivel = 1, total = excluded.total, nivel1 = excluded.nivel1, nivel2 = excluded.nivel2,
         nivel3 = excluded.nivel3, sem_nivel = excluded.sem_nivel
       RETURNING id`,
    )
    .get(
      bibliotecaId, album.nome, album.caminho, album.titulo, JSON.stringify(album.colecao),
      album.colecao?.oculto === true ? 1 : 0, c.total, c.nivel1, c.nivel2, c.nivel3, c.semNivel,
    ) as { id: number };

  substituirTagsAlbum(db, id, album.colecao?.tags ?? []);
  salvarFotos(db, id, album);
  return id;
}

export function substituirTagsAlbum(db: Banco, albumId: number, tags: string[]): void {
  db.prepare('DELETE FROM album_tags WHERE album_id = ?').run(albumId);
  const inserir = db.prepare('INSERT OR IGNORE INTO album_tags (album_id, tag, chave, posicao) VALUES (?, ?, ?, ?)');
  tags.forEach((tag, posicao) => inserir.run(albumId, tag, chaveBusca(tag), posicao));
}

function salvarFotos(db: Banco, albumId: number, album: AlbumVarrido): void {
  const existentes = new Map<string, number>();
  for (const linha of db.prepare('SELECT id, caminho_relativo FROM fotos WHERE album_id = ?').all(albumId) as any[]) {
    existentes.set(linha.caminho_relativo, linha.id);
  }

  const inserir = db.prepare(
    `INSERT INTO fotos (album_id, caminho_relativo, nivel, tamanho, modificado_em, camera, orientacao, data_captura)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  );
  const atualizar = db.prepare(
    'UPDATE fotos SET nivel = ?, tamanho = ?, modificado_em = ?, camera = ?, orientacao = ?, data_captura = ? WHERE id = ?',
  );

  const idPorCaminho = new Map<string, number>();
  for (const foto of album.fotos) {
    const exif = foto.exif;
    const campos = [foto.nivel, foto.tamanho, foto.modificadoEm, exif?.camera ?? null, exif?.orientacao ?? null, exif?.dataCaptura ?? null] as const;
    const atual = existentes.get(foto.caminhoRelativo);
    if (atual !== undefined) {
      atualizar.run(...campos, atual);
      idPorCaminho.set(foto.caminhoRelativo, atual);
      existentes.delete(foto.caminhoRelativo);
    } else {
      const { id } = inserir.get(albumId, foto.caminhoRelativo, ...campos) as { id: number };
      idPorCaminho.set(foto.caminhoRelativo, id);
    }
  }

  const remover = db.prepare('DELETE FROM fotos WHERE id = ?');
  for (const id of existentes.values()) remover.run(id);

  // O fotos.json é a fonte de verdade: o índice de tags das fotos é refeito a partir dele.
  db.prepare('DELETE FROM foto_tags WHERE foto_id IN (SELECT id FROM fotos WHERE album_id = ?)').run(albumId);
  for (const [caminho, entrada] of Object.entries(album.fotosJson.fotos)) {
    const fotoId = idPorCaminho.get(caminho);
    if (fotoId !== undefined) substituirTagsFoto(db, fotoId, entrada.tags);
  }
}

export function substituirTagsFoto(db: Banco, fotoId: number, tags: string[]): void {
  db.prepare('DELETE FROM foto_tags WHERE foto_id = ?').run(fotoId);
  const inserir = db.prepare('INSERT OR IGNORE INTO foto_tags (foto_id, tag, chave, posicao) VALUES (?, ?, ?, ?)');
  tags.forEach((tag, posicao) => inserir.run(fotoId, tag, chaveBusca(tag), posicao));
}

// ── Álbuns ─────────────────────────────────────────────────────────────────

export function listarAlbuns(db: Banco, bibliotecaId: number, opcoes: OpcoesListarAlbuns = {}): Album[] {
  const condicoes = ['biblioteca_id = ?'];
  if (!opcoes.incluirOcultos) condicoes.push('oculto = 0');
  if (!opcoes.incluirIndisponiveis) condicoes.push('disponivel = 1');
  const linhas = db.prepare(`SELECT * FROM albuns WHERE ${condicoes.join(' AND ')}`).all(bibliotecaId) as any[];

  const tags = tagsPorAlbum(db, bibliotecaId);
  return linhas.map((linha) => linhaParaAlbum(linha, tags.get(linha.id) ?? [])).sort((a, b) => compararNomes(a.nome, b.nome));
}

export function obterAlbum(db: Banco, id: number): Album | undefined {
  const linha = db.prepare('SELECT * FROM albuns WHERE id = ?').get(id);
  if (!linha) return undefined;
  const tags = (db.prepare('SELECT tag FROM album_tags WHERE album_id = ? ORDER BY posicao').all(id) as any[]).map((t) => t.tag);
  return linhaParaAlbum(linha, tags);
}

function tagsPorAlbum(db: Banco, bibliotecaId: number): Map<number, string[]> {
  const linhas = db
    .prepare(
      `SELECT t.album_id, t.tag FROM album_tags t JOIN albuns a ON a.id = t.album_id
       WHERE a.biblioteca_id = ? ORDER BY t.album_id, t.posicao`,
    )
    .all(bibliotecaId) as any[];
  return agrupar(linhas, 'album_id');
}

function linhaParaAlbum(linha: any, tags: string[]): Album {
  return {
    id: linha.id,
    bibliotecaId: linha.biblioteca_id,
    nome: linha.nome,
    caminho: linha.caminho,
    titulo: linha.titulo,
    colecao: JSON.parse(linha.colecao),
    oculto: linha.oculto === 1,
    disponivel: linha.disponivel === 1,
    contagem: { total: linha.total, nivel1: linha.nivel1, nivel2: linha.nivel2, nivel3: linha.nivel3, semNivel: linha.sem_nivel },
    tags,
  };
}

// ── Fotos ──────────────────────────────────────────────────────────────────

// Fotos do álbum em ordem de nível (1, 2, 3 e as sem nível no fim) e, dentro do nível, por nome.
export function listarFotosDoAlbum(db: Banco, albumId: number): Foto[] {
  const linhas = db.prepare('SELECT * FROM fotos WHERE album_id = ?').all(albumId) as any[];
  const tags = agrupar(
    db
      .prepare(
        `SELECT t.foto_id, t.tag FROM foto_tags t JOIN fotos f ON f.id = t.foto_id
         WHERE f.album_id = ? ORDER BY t.foto_id, t.posicao`,
      )
      .all(albumId) as any[],
    'foto_id',
  );
  return linhas.map((linha) => linhaParaFoto(linha, tags.get(linha.id) ?? [])).sort(compararFotos);
}

export function obterFoto(db: Banco, id: number): Foto | undefined {
  const linha = db.prepare('SELECT * FROM fotos WHERE id = ?').get(id);
  if (!linha) return undefined;
  const tags = (db.prepare('SELECT tag FROM foto_tags WHERE foto_id = ? ORDER BY posicao').all(id) as any[]).map((t) => t.tag);
  return linhaParaFoto(linha, tags);
}

// Estado guardado da última varredura, para a próxima ser incremental (reaproveitar EXIF, reencontrar fotos).
export function varreduraAnterior(db: Banco, bibliotecaId: number): VarreduraAnterior {
  const albuns = db.prepare('SELECT id, nome FROM albuns WHERE biblioteca_id = ?').all(bibliotecaId) as any[];
  const fotos = db.prepare('SELECT * FROM fotos WHERE album_id IN (SELECT id FROM albuns WHERE biblioteca_id = ?)').all(bibliotecaId) as any[];
  const porAlbum = new Map<number, VarreduraAnterior['albuns'][number]['fotos']>();
  for (const f of fotos) {
    const lista = porAlbum.get(f.album_id) ?? [];
    lista.push({
      caminhoRelativo: f.caminho_relativo,
      nivel: f.nivel,
      tamanho: f.tamanho,
      modificadoEm: f.modificado_em,
      exif: { camera: f.camera, orientacao: f.orientacao, dataCaptura: f.data_captura },
    });
    porAlbum.set(f.album_id, lista);
  }
  return { albuns: albuns.map((a) => ({ nome: a.nome, fotos: porAlbum.get(a.id) ?? [] })) };
}

// Atualiza o álbum no banco depois de uma edição do colecao.json, sem esperar a próxima varredura.
export function atualizarColecaoDoAlbum(db: Banco, albumId: number, colecao: Colecao): void {
  const album = obterAlbum(db, albumId);
  if (!album) return;
  const titulo = typeof colecao.titulo === 'string' && colecao.titulo.trim() ? colecao.titulo.trim() : album.nome;
  emTransacao(db, () => {
    db.prepare('UPDATE albuns SET titulo = ?, colecao = ?, oculto = ? WHERE id = ?').run(titulo, JSON.stringify(colecao), colecao.oculto ? 1 : 0, albumId);
    substituirTagsAlbum(db, albumId, colecao.tags);
  });
}

function compararFotos(a: Foto, b: Foto): number {
  return (a.nivel ?? 4) - (b.nivel ?? 4) || compararNomes(a.caminhoRelativo, b.caminhoRelativo);
}

function linhaParaFoto(linha: any, tags: string[]): Foto {
  return {
    id: linha.id,
    albumId: linha.album_id,
    caminhoRelativo: linha.caminho_relativo,
    nome: path.posix.basename(linha.caminho_relativo),
    nivel: linha.nivel,
    tamanho: linha.tamanho,
    modificadoEm: linha.modificado_em,
    camera: linha.camera,
    orientacao: linha.orientacao,
    dataCaptura: linha.data_captura,
    tags,
  };
}

function agrupar(linhas: any[], campo: string): Map<number, string[]> {
  const mapa = new Map<number, string[]>();
  for (const linha of linhas) {
    const lista = mapa.get(linha[campo]);
    if (lista) lista.push(linha.tag);
    else mapa.set(linha[campo], [linha.tag]);
  }
  return mapa;
}

// M7 — API: rotas sobre uma biblioteca real em pasta temporária, banco em memória.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { construirApp } from '../../server/src/app';
import { criarBibliotecaPadrao, criarJpeg, criarPastaTemp, type BibliotecaFixture } from '../ajuda/fixtures';

type App = Awaited<ReturnType<typeof construirApp>>;

let app: App;
let biblioteca: BibliotecaFixture;
let bibliotecaId: number;
const albumId = async (nome: string, incluirOcultos = false) => {
  const r = await app.inject(`/api/libraries/${bibliotecaId}/collections${incluirOcultos ? '?incluirOcultos=true' : ''}`);
  return r.json().colecoes.find((c: any) => c.nome === nome)?.id as number;
};
const lerJson = async (...partes: string[]) => JSON.parse(await readFile(path.join(biblioteca.raiz, ...partes), 'utf8'));

beforeAll(async () => {
  biblioteca = await criarBibliotecaPadrao();
  app = await construirApp({ caminhoBanco: ':memory:', caminhoCache: await criarPastaTemp('cache-') });
  const r = await app.inject({ method: 'POST', url: '/api/libraries', payload: { nome: 'Fotos', tipo: 'fotos', caminho: biblioteca.raiz } });
  expect(r.statusCode).toBe(201);
  bibliotecaId = r.json().id;
});
afterAll(async () => {
  await app.close();
  await biblioteca.limpar();
});

describe('M7 · criação da biblioteca', () => {
  it('prévia lista os álbuns que serão criados', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/libraries/previa', payload: { caminho: biblioteca.raiz } });
    expect(r.statusCode).toBe(200);
    expect(r.json().albuns).toHaveLength(4);
  });

  it('caminho inexistente responde 400', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/libraries', payload: { nome: 'X', tipo: 'fotos', caminho: 'Z:/nao/existe' } });
    expect(r.statusCode).toBe(400);
    expect(r.json().codigo).toBe('caminho-invalido');
  });

  it('tipo desconhecido responde 400', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/libraries', payload: { nome: 'X', tipo: 'livros', caminho: biblioteca.raiz } });
    expect(r.statusCode).toBe(400);
  });

  it('a biblioteca criada já vem varrida', async () => {
    const r = await app.inject('/api/libraries');
    expect(r.json().bibliotecas).toEqual([expect.objectContaining({ id: bibliotecaId, nome: 'Fotos', tipo: 'fotos', totalColecoes: 3 })]);
  });
});

describe('M7 · navegador de pastas', () => {
  it('lista só subpastas do caminho', async () => {
    const r = await app.inject(`/api/fs?path=${encodeURIComponent(path.join(biblioteca.raiz, 'Viagem Nordeste'))}`);
    expect(r.statusCode).toBe(200);
    const nomes = r.json().pastas.map((p: any) => p.nome).sort();
    expect(nomes).toEqual(['Extras', 'Nivel_1', 'Nivel_2', 'Nivel_3', 'Nivel_4', 'metadados']);
  });

  it('sem path lista as unidades de disco', async () => {
    const r = await app.inject('/api/fs');
    expect(r.statusCode).toBe(200);
    expect(r.json().pastas.length).toBeGreaterThan(0);
  });
});

describe('M7 · álbuns', () => {
  it('lista os álbuns visíveis com contagem por nível', async () => {
    const r = await app.inject(`/api/libraries/${bibliotecaId}/collections`);
    const colecoes = r.json().colecoes;
    expect(colecoes.map((c: any) => c.nome)).toEqual(['Aniversario 2025', 'Sem Metadados', 'Viagem Nordeste']);
    expect(colecoes.find((c: any) => c.nome === 'Viagem Nordeste').contagem).toEqual({ total: 5, nivel1: 2, nivel2: 1, nivel3: 1, semNivel: 1 });
  });

  it('álbum oculto só aparece com incluirOcultos=true', async () => {
    const r = await app.inject(`/api/libraries/${bibliotecaId}/collections?incluirOcultos=true`);
    expect(r.json().colecoes.find((c: any) => c.nome === 'Neve')).toMatchObject({ oculto: true });
  });

  it('link direto para álbum oculto responde 404, exceto com incluirOcultos', async () => {
    const id = await albumId('Neve', true);
    expect((await app.inject(`/api/collections/${id}`)).statusCode).toBe(404);
    const r = await app.inject(`/api/collections/${id}?incluirOcultos=true`);
    expect(r.statusCode).toBe(200);
    expect(r.json().oculto).toBe(true);
  });

  it('fotos do álbum trazem nível e tags próprias', async () => {
    const r = await app.inject(`/api/collections/${await albumId('Viagem Nordeste')}/photos`);
    const foto = r.json().fotos.find((f: any) => f.caminhoRelativo === 'Nivel_1/IMG_0001.jpg');
    expect(foto).toMatchObject({ nivel: 1, tags: ['mar', 'pôr do sol'] });
  });
});

describe('M7 · pesquisa por tags', () => {
  it('álbuns por tag, sem diferença de acento', async () => {
    const r = await app.inject(`/api/libraries/${bibliotecaId}/collections?tags=familia&modo=todas`);
    expect(r.json().colecoes.map((c: any) => c.nome)).toEqual(['Aniversario 2025', 'Viagem Nordeste']);
  });

  it('fotos com herança das tags do álbum', async () => {
    const r = await app.inject(`/api/libraries/${bibliotecaId}/photos?tags=mar,nordeste&modo=todas`);
    expect(r.json().fotos.map((f: any) => f.caminhoRelativo)).toEqual(['Nivel_1/IMG_0001.jpg']);
  });

  it('lista de tags existentes com contagens, sem os ocultos', async () => {
    const tags = (await app.inject(`/api/libraries/${bibliotecaId}/tags`)).json().tags;
    expect(tags.find((t: any) => t.tag === 'família')).toMatchObject({ albuns: 2 });
    expect(tags.find((t: any) => t.tag === 'bolo')).toMatchObject({ fotos: 1 });
    expect(tags.some((t: any) => t.tag === 'neve')).toBe(false);
  });

  it('modo inválido responde 400', async () => {
    expect((await app.inject(`/api/libraries/${bibliotecaId}/photos?tags=mar&modo=talvez`)).statusCode).toBe(400);
  });
});

describe('M7 · edição', () => {
  it('PUT oculto grava no colecao.json e tira o álbum da lista', async () => {
    const id = await albumId('Aniversario 2025');
    const r = await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { oculto: true } });
    expect(r.statusCode).toBe(200);
    expect((await lerJson('Aniversario 2025', 'metadados', 'colecao.json')).oculto).toBe(true);
    expect(await albumId('Aniversario 2025')).toBeUndefined();
    await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { oculto: false } });
    expect(await albumId('Aniversario 2025')).toBe(id);
  });

  it('PUT preserva campos desconhecidos do JSON', async () => {
    const id = await albumId('Viagem Nordeste');
    await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { titulo: 'Viagem NE' } });
    expect(await lerJson('Viagem Nordeste', 'metadados', 'colecao.json')).toMatchObject({ titulo: 'Viagem NE', descricao: 'Férias de julho' });
  });

  it('PUT em álbum sem metadados cria o colecao.json', async () => {
    const id = await albumId('Sem Metadados');
    await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { tags: ['Teste'] } });
    expect((await lerJson('Sem Metadados', 'metadados', 'colecao.json')).tags).toEqual(['teste']);
  });

  it('PUT artes grava o caminho da foto no colecao.json e o álbum passa a usá-la', async () => {
    const id = await albumId('Viagem Nordeste');
    const fotos = (await app.inject(`/api/collections/${id}/photos`)).json().fotos as any[];
    const outra = fotos[fotos.length - 1];
    const r = await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { artes: { poster: outra.id, capa: outra.id, miniatura: fotos[0].id } } });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ posterFotoId: outra.id, capaFotoId: outra.id, miniaturaFotoId: fotos[0].id });
    expect(await lerJson('Viagem Nordeste', 'metadados', 'colecao.json')).toMatchObject({ poster: outra.caminhoRelativo, capa: outra.caminhoRelativo, descricao: 'Férias de julho' });
    expect((await app.inject(`/api/collections/${id}`)).json().posterFotoId).toBe(outra.id);
  });

  it('PUT artes com null volta ao automático (primeira foto)', async () => {
    const id = await albumId('Viagem Nordeste');
    const fotos = (await app.inject(`/api/collections/${id}/photos`)).json().fotos as any[];
    const r = await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { artes: { poster: null } } });
    expect(r.json().posterFotoId).toBe(fotos[0].id);
    expect((await lerJson('Viagem Nordeste', 'metadados', 'colecao.json')).poster).toBeNull();
  });

  it('PUT artes recusa foto de outro álbum e arte desconhecida', async () => {
    const id = await albumId('Viagem Nordeste');
    const outro = await albumId('Aniversario 2025', true);
    const deOutro = (await app.inject(`/api/collections/${outro}/photos?incluirOcultos=true`)).json().fotos[0];
    const a = await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { artes: { poster: deOutro.id } } });
    expect(a.statusCode).toBe(400);
    expect(a.json().codigo).toBe('arte-invalida');
    const b = await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { artes: { fundo: 1 } } });
    expect(b.statusCode).toBe(400);
  });

  it('PATCH de tags em massa adiciona e remove em vários álbuns', async () => {
    const ids = [await albumId('Viagem Nordeste'), await albumId('Sem Metadados')];
    const r = await app.inject({ method: 'PATCH', url: '/api/collections/tags', payload: { colecoes: ids, adicionar: ['verão'], remover: ['teste'] } });
    expect(r.json()).toEqual({ alteradas: ids, falhas: [] });
    expect((await lerJson('Viagem Nordeste', 'metadados', 'colecao.json')).tags).toContain('verão');
    expect((await lerJson('Sem Metadados', 'metadados', 'colecao.json')).tags).toEqual(['verão']);
  });

  it('PATCH em massa salva o que der e lista as falhas', async () => {
    const somenteLeitura = path.join(biblioteca.raiz, 'Viagem Nordeste', 'metadados', 'colecao.json');
    await chmod(somenteLeitura, 0o444);
    const ids = [await albumId('Viagem Nordeste'), await albumId('Sem Metadados')];
    const r = await app.inject({ method: 'PATCH', url: '/api/collections/tags', payload: { colecoes: ids, adicionar: ['inverno'], remover: [] } });
    await chmod(somenteLeitura, 0o666);
    expect(r.json().alteradas).toEqual([ids[1]]);
    expect(r.json().falhas).toEqual([expect.objectContaining({ id: ids[0] })]);
  });

  it('PATCH de tags de fotos grava no fotos.json do álbum', async () => {
    const fotos = (await app.inject(`/api/collections/${await albumId('Viagem Nordeste')}/photos`)).json().fotos;
    const alvo = fotos.filter((f: any) => f.nivel === 2 || f.nivel === 3).map((f: any) => f.id);
    const r = await app.inject({ method: 'PATCH', url: '/api/photos/tags', payload: { fotos: alvo, adicionar: ['Coqueiro'], remover: [] } });
    expect(r.json().falhas).toEqual([]);
    const json = await lerJson('Viagem Nordeste', 'metadados', 'fotos.json');
    expect(json.fotos['Nivel_2/IMG_0042.jpg'].tags).toEqual(['coqueiro']);
    expect(json.fotos['Nivel_3/IMG_0107.jpg'].tags).toEqual(['coqueiro']);
  });
});

describe('M7 · arquivos', () => {
  it('entrega a foto original com suporte a Range', async () => {
    const [foto] = (await app.inject(`/api/collections/${await albumId('Viagem Nordeste')}/photos`)).json().fotos;
    const r = await app.inject({ url: `/api/items/${foto.id}/file`, headers: { range: 'bytes=0-9' } });
    expect(r.statusCode).toBe(206);
    expect(r.headers['content-range']).toMatch(/^bytes 0-9\/\d+$/);
    expect(r.rawPayload.length).toBe(10);
  });

  it('entrega versão redimensionada do cache', async () => {
    const [foto] = (await app.inject(`/api/collections/${await albumId('Viagem Nordeste')}/photos`)).json().fotos;
    const r = await app.inject(`/api/photos/${foto.id}/imagem?w=300`);
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toBe('image/jpeg');
    expect((await sharp(r.rawPayload).metadata()).width).toBeLessThanOrEqual(300);
  });

  it('largura fora da lista responde 400', async () => {
    const [foto] = (await app.inject(`/api/collections/${await albumId('Viagem Nordeste')}/photos`)).json().fotos;
    expect((await app.inject(`/api/photos/${foto.id}/imagem?w=777`)).statusCode).toBe(400);
  });
});

describe('M7 · nova varredura', () => {
  it('POST /api/scan encontra fotos novas e grava correções do fotos.json', async () => {
    await criarJpeg(path.join(biblioteca.raiz, 'Viagem Nordeste', 'Nivel_3', 'IMG_0200.jpg'));
    const r = await app.inject({ method: 'POST', url: '/api/scan', payload: { bibliotecaId } });
    expect(r.statusCode).toBe(200);
    const album = (await app.inject(`/api/collections/${await albumId('Viagem Nordeste')}`)).json();
    expect(album.contagem.nivel3).toBe(2);
  });

  it('o resultado da varredura informa avisos', async () => {
    await writeFile(path.join(biblioteca.raiz, 'Sem Metadados', 'metadados', 'colecao.json'), '{ quebrado');
    const r = await app.inject({ method: 'POST', url: '/api/scan', payload: { bibliotecaId } });
    expect(r.json().avisos.some((a: any) => a.tipo === 'json-invalido')).toBe(true);
  });
});

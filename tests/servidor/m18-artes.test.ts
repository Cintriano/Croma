// M18 — Artes do álbum: poster, capa e miniatura acompanham a foto quando ela muda de pasta.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdir, readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { construirApp } from '../../server/src/app';
import { reapontarArtes } from '../../server/src/metadados/colecao';
import { criarBibliotecaFotos, criarPastaTemp, type BibliotecaFixture } from '../ajuda/fixtures';

describe('M18 · reapontarArtes', () => {
  const colecao = { tags: [], oculto: false, poster: 'Nivel_1/A.jpg', capa: 'Nivel_1/B.jpg', miniatura: null };

  it('reaponta para a única foto com o mesmo nome', () => {
    expect(reapontarArtes(colecao, ['Nivel_2/A.jpg', 'Nivel_1/B.jpg'])).toEqual({ poster: 'Nivel_2/A.jpg' });
  });

  it('não mexe quando há mais de um candidato ou nenhum', () => {
    expect(reapontarArtes(colecao, ['Nivel_2/A.jpg', 'Nivel_3/A.jpg', 'Nivel_1/B.jpg'])).toEqual({});
    expect(reapontarArtes(colecao, ['Nivel_1/C.jpg', 'Nivel_1/B.jpg'])).toEqual({});
  });
});

describe('M18 · varredura com foto movida', () => {
  let app: Awaited<ReturnType<typeof construirApp>>;
  let biblioteca: BibliotecaFixture;
  let bibliotecaId: number;

  beforeAll(async () => {
    biblioteca = await criarBibliotecaFotos([{ nome: 'Album', colecao: { titulo: 'Album', tags: [] }, fotos: { Nivel_1: ['A.jpg', 'P.jpg'] } }]);
    app = await construirApp({ caminhoBanco: ':memory:', caminhoCache: await criarPastaTemp('cache-') });
    bibliotecaId = (await app.inject({ method: 'POST', url: '/api/libraries', payload: { nome: 'F', tipo: 'fotos', caminho: biblioteca.raiz } })).json().id;
  });
  afterAll(async () => {
    await app.close();
    await biblioteca.limpar();
  });

  it('o poster segue a foto movida para outro nível', async () => {
    const id = (await app.inject(`/api/libraries/${bibliotecaId}/collections`)).json().colecoes[0].id;
    const p = (await app.inject(`/api/collections/${id}/photos`)).json().fotos.find((f: any) => f.nome === 'P.jpg');
    await app.inject({ method: 'PUT', url: `/api/collections/${id}`, payload: { artes: { poster: p.id } } });

    await mkdir(path.join(biblioteca.raiz, 'Album', 'Nivel_2'));
    await rename(path.join(biblioteca.raiz, 'Album', 'Nivel_1', 'P.jpg'), path.join(biblioteca.raiz, 'Album', 'Nivel_2', 'P.jpg'));
    await app.inject({ method: 'POST', url: '/api/scan', payload: { bibliotecaId } });

    const json = JSON.parse(await readFile(path.join(biblioteca.raiz, 'Album', 'metadados', 'colecao.json'), 'utf8'));
    expect(json.poster).toBe('Nivel_2/P.jpg');
    const movida = (await app.inject(`/api/collections/${id}/photos`)).json().fotos.find((f: any) => f.nome === 'P.jpg');
    expect((await app.inject(`/api/collections/${id}`)).json().posterFotoId).toBe(movida.id);
  });
});

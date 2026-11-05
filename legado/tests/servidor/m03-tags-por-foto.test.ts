// M3 — Tags por foto: leitura, aplicação, gravação e reconciliação do fotos.json.
import { beforeEach, describe, expect, it } from 'vitest';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  aplicarTagsFotos,
  gravarFotosJson,
  lerFotosJson,
  reconciliarFotosJson,
  type FotosJson,
} from '../../server/src/metadados/fotosJson';
import { criarPastaTemp } from '../ajuda/fixtures';

const existe = (arquivo: string) => access(arquivo).then(() => true, () => false);

describe('M3 · leitura e gravação', () => {
  let pastaAlbum: string;
  const arquivo = () => path.join(pastaAlbum, 'metadados', 'fotos.json');
  beforeEach(async () => {
    pastaAlbum = path.join(await criarPastaTemp(), 'Album');
    await mkdir(pastaAlbum);
  });

  it('sem arquivo retorna estrutura vazia', async () => {
    expect(await lerFotosJson(pastaAlbum)).toEqual({ fotosJson: { versao: 1, fotos: {} }, aviso: null });
  });

  it('normaliza tags na leitura', async () => {
    await mkdir(path.dirname(arquivo()));
    await writeFile(arquivo(), JSON.stringify({ versao: 1, fotos: { 'Nivel_1/a.jpg': { tags: ['Mar', 'mar '], tamanho: 10 } } }));
    const { fotosJson } = await lerFotosJson(pastaAlbum);
    expect(fotosJson.fotos['Nivel_1/a.jpg'].tags).toEqual(['mar']);
  });

  it('JSON inválido gera aviso e não apaga o arquivo', async () => {
    await mkdir(path.dirname(arquivo()));
    await writeFile(arquivo(), '{ quebrado');
    const { fotosJson, aviso } = await lerFotosJson(pastaAlbum);
    expect(aviso?.tipo).toBe('json-invalido');
    expect(fotosJson.fotos).toEqual({});
    expect(await readFile(arquivo(), 'utf8')).toBe('{ quebrado');
  });

  it('não cria o arquivo enquanto nenhuma foto tem tag', async () => {
    await gravarFotosJson(pastaAlbum, { versao: 1, fotos: {} });
    expect(await existe(arquivo())).toBe(false);
  });

  it('cria o arquivo na primeira tag', async () => {
    await gravarFotosJson(pastaAlbum, { versao: 1, fotos: { 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 } } });
    const salvo = JSON.parse(await readFile(arquivo(), 'utf8'));
    expect(salvo.fotos['Nivel_1/a.jpg']).toEqual({ tags: ['mar'], tamanho: 10 });
  });

  it('se o arquivo já existe e fica vazio, ele é mantido com fotos vazio', async () => {
    await gravarFotosJson(pastaAlbum, { versao: 1, fotos: { 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 } } });
    await gravarFotosJson(pastaAlbum, { versao: 1, fotos: {} });
    expect(JSON.parse(await readFile(arquivo(), 'utf8'))).toEqual({ versao: 1, fotos: {} });
  });
});

describe('M3 · aplicar tags em uma ou várias fotos', () => {
  const base: FotosJson = {
    versao: 1,
    fotos: {
      'Nivel_1/a.jpg': { tags: ['mar', 'sol'], tamanho: 10 },
      'Nivel_1/b.jpg': { tags: ['mar'], tamanho: 20 },
    },
  };

  it('adiciona a várias fotos, criando entradas novas com o tamanho', () => {
    const novo = aplicarTagsFotos(base, {
      fotos: [{ caminhoRelativo: 'Nivel_1/a.jpg', tamanho: 10 }, { caminhoRelativo: 'Nivel_2/c.jpg', tamanho: 30 }],
      adicionar: ['Praia'],
      remover: [],
    });
    expect(novo.fotos['Nivel_1/a.jpg'].tags).toEqual(['mar', 'sol', 'praia']);
    expect(novo.fotos['Nivel_2/c.jpg']).toEqual({ tags: ['praia'], tamanho: 30 });
  });

  it('remove de várias fotos e apaga a entrada que fica sem tags', () => {
    const novo = aplicarTagsFotos(base, {
      fotos: [{ caminhoRelativo: 'Nivel_1/a.jpg', tamanho: 10 }, { caminhoRelativo: 'Nivel_1/b.jpg', tamanho: 20 }],
      adicionar: [],
      remover: ['MAR'],
    });
    expect(novo.fotos['Nivel_1/a.jpg'].tags).toEqual(['sol']);
    expect(novo.fotos).not.toHaveProperty('Nivel_1/b.jpg');
  });

  it('não altera o objeto original', () => {
    const copia = structuredClone(base);
    aplicarTagsFotos(base, { fotos: [{ caminhoRelativo: 'Nivel_1/a.jpg', tamanho: 10 }], adicionar: ['x'], remover: [] });
    expect(base).toEqual(copia);
  });
});

describe('M3 · reconciliação com os arquivos do disco', () => {
  const json = (fotos: FotosJson['fotos']): FotosJson => ({ versao: 1, fotos });

  it('entrada que bate com um arquivo fica como está', () => {
    const r = reconciliarFotosJson(json({ 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 } }), [
      { caminhoRelativo: 'Nivel_1/a.jpg', tamanho: 10, dataCaptura: null },
    ]);
    expect(r).toEqual({ fotosJson: json({ 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 } }), corrigidas: [], orfas: [] });
  });

  it('foto movida de nível com mesmo nome e tamanho é reapontada', () => {
    const r = reconciliarFotosJson(json({ 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 } }), [
      { caminhoRelativo: 'Nivel_3/a.jpg', tamanho: 10, dataCaptura: null },
    ]);
    expect(r.fotosJson.fotos).toEqual({ 'Nivel_3/a.jpg': { tags: ['mar'], tamanho: 10 } });
    expect(r.corrigidas).toEqual([{ de: 'Nivel_1/a.jpg', para: 'Nivel_3/a.jpg' }]);
  });

  it('foto renomeada é reencontrada por tamanho e data de captura', () => {
    const data = '2025-07-14T10:00:00.000Z';
    const r = reconciliarFotosJson(json({ 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 } }), [
      { caminhoRelativo: 'Nivel_1/praia.jpg', tamanho: 10, dataCaptura: data },
    ], { datasAnteriores: { 'Nivel_1/a.jpg': data } });
    expect(r.corrigidas).toEqual([{ de: 'Nivel_1/a.jpg', para: 'Nivel_1/praia.jpg' }]);
  });

  it('com dois candidatos possíveis, não adivinha: vira órfã', () => {
    const r = reconciliarFotosJson(json({ 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 } }), [
      { caminhoRelativo: 'Nivel_2/a.jpg', tamanho: 10, dataCaptura: null },
      { caminhoRelativo: 'Nivel_3/a.jpg', tamanho: 10, dataCaptura: null },
    ]);
    expect(r.orfas).toEqual(['Nivel_1/a.jpg']);
    expect(r.corrigidas).toEqual([]);
  });

  it('órfã continua no JSON (não é apagada)', () => {
    const r = reconciliarFotosJson(json({ 'Nivel_1/sumiu.jpg': { tags: ['mar'], tamanho: 10 } }), []);
    expect(r.orfas).toEqual(['Nivel_1/sumiu.jpg']);
    expect(r.fotosJson.fotos).toHaveProperty('Nivel_1/sumiu.jpg');
  });

  it('não reaponta para um arquivo que já tem entrada própria', () => {
    const r = reconciliarFotosJson(
      json({ 'Nivel_1/a.jpg': { tags: ['mar'], tamanho: 10 }, 'Nivel_2/a.jpg': { tags: ['sol'], tamanho: 10 } }),
      [{ caminhoRelativo: 'Nivel_2/a.jpg', tamanho: 10, dataCaptura: null }],
    );
    expect(r.orfas).toEqual(['Nivel_1/a.jpg']);
    expect(r.fotosJson.fotos['Nivel_2/a.jpg'].tags).toEqual(['sol']);
  });
});

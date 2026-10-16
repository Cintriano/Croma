// M5 — Cache de imagens: versões 300/600/1200, sem ampliar, respeitando orientação e sem tocar no original.
import { beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { gerarVersoes, LARGURAS_PADRAO } from '../../server/src/imagens/cache';
import { criarJpeg, criarPastaTemp } from '../ajuda/fixtures';

const hash = async (arquivo: string) => createHash('sha256').update(await readFile(arquivo)).digest('hex');

describe('M5 · cache de imagens', () => {
  let pasta: string;
  let cache: string;
  beforeEach(async () => {
    pasta = await criarPastaTemp();
    cache = path.join(pasta, 'cache');
  });

  it('larguras padrão são 300, 600 e 1200', () => {
    expect(LARGURAS_PADRAO).toEqual([300, 600, 1200]);
  });

  it('gera uma versão JPEG por largura, mantendo a proporção', async () => {
    const original = path.join(pasta, 'grande.jpg');
    await criarJpeg(original, { largura: 2000, altura: 1000 });
    const { versoes } = await gerarVersoes(original, cache, 'foto-1');
    expect(Object.keys(versoes).map(Number)).toEqual([300, 600, 1200]);
    const meta = await sharp(versoes[600]).metadata();
    expect(meta).toMatchObject({ format: 'jpeg', width: 600, height: 300 });
    expect(path.basename(versoes[600])).toBe('foto-1-600.jpg');
  });

  it('não amplia fotos menores que a largura pedida', async () => {
    const original = path.join(pasta, 'pequena.jpg');
    await criarJpeg(original, { largura: 400, altura: 300 });
    const { versoes } = await gerarVersoes(original, cache, 'foto-2');
    expect((await sharp(versoes[1200]).metadata()).width).toBe(400);
  });

  it('aplica a orientação do EXIF (foto deitada vira em pé)', async () => {
    const original = path.join(pasta, 'girada.jpg');
    await criarJpeg(original, { largura: 800, altura: 400, orientacao: 6 });
    const { versoes } = await gerarVersoes(original, cache, 'foto-3');
    const meta = await sharp(versoes[300]).metadata();
    expect(meta.width).toBe(300);
    expect(meta.height).toBe(600);
  });

  it('nunca altera o arquivo original', async () => {
    const original = path.join(pasta, 'original.jpg');
    await criarJpeg(original, { largura: 1500, altura: 1000 });
    const antes = await hash(original);
    await gerarVersoes(original, cache, 'foto-4');
    expect(await hash(original)).toBe(antes);
  });

  it('segunda chamada reaproveita o cache', async () => {
    const original = path.join(pasta, 'reuso.jpg');
    await criarJpeg(original, { largura: 1500, altura: 1000 });
    expect((await gerarVersoes(original, cache, 'foto-5')).geradas).toBe(3);
    expect((await gerarVersoes(original, cache, 'foto-5')).geradas).toBe(0);
  });

  it('original corrompido gera erro claro', async () => {
    const original = path.join(pasta, 'quebrada.jpg');
    await (await import('node:fs/promises')).writeFile(original, 'não é jpeg');
    await expect(gerarVersoes(original, cache, 'foto-6')).rejects.toMatchObject({ codigo: 'imagem-invalida' });
  });
});

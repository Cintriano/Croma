// Garante que os próprios utilitários de teste funcionam antes de qualquer módulo existir.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { criarBibliotecaPadrao, criarJpeg, criarPastaTemp, type BibliotecaFixture } from './fixtures';

describe('fixtures de teste', () => {
  let biblioteca: BibliotecaFixture;

  beforeAll(async () => {
    biblioteca = await criarBibliotecaPadrao();
  });
  afterAll(() => biblioteca.limpar());

  it('cria uma subpasta por álbum', async () => {
    const pastas = (await readdir(biblioteca.raiz)).sort();
    expect(pastas).toEqual(['Aniversario 2025', 'Neve', 'Sem Metadados', 'Viagem Nordeste']);
  });

  it('grava colecao.json e fotos.json com tamanho real', async () => {
    const pasta = path.join(biblioteca.raiz, 'Viagem Nordeste', 'metadados');
    const colecao = JSON.parse(await readFile(path.join(pasta, 'colecao.json'), 'utf8'));
    const fotos = JSON.parse(await readFile(path.join(pasta, 'fotos.json'), 'utf8'));
    expect(colecao.tags).toContain('praia');
    expect(fotos.fotos['Nivel_1/IMG_0001.jpg'].tamanho).toBeGreaterThan(0);
  });

  it('gera JPEG com câmera e orientação no EXIF', async () => {
    const pasta = await criarPastaTemp();
    const arquivo = path.join(pasta, 'foto.jpg');
    await criarJpeg(arquivo, { camera: { marca: 'Canon', modelo: 'Canon EOS R6' }, orientacao: 6 });
    const meta = await sharp(arquivo).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.orientation).toBe(6);
    expect(meta.exif).toBeDefined();
  });
});

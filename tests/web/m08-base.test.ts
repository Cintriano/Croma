// M8 — Front-end base: tokens da paleta Brasa Neon e rotas (URLs) do site.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { caminhoAlbum, caminhoBiblioteca, caminhoFoto, slug } from '../../web/src/logica/rotas';

describe('M8 · tokens da paleta Brasa Neon', () => {
  const css = readFileSync(path.resolve('web/src/tema/tokens.css'), 'utf8');

  it.each([
    ['--fundo', '#0C0809'],
    ['--superficie', '#17100F'],
    ['--superficie-alta', '#231816'],
    ['--borda', '#3A2622'],
    ['--texto', '#F7EEE8'],
    ['--texto-suave', '#BFA79B'],
    ['--texto-apagado', '#7D665C'],
    ['--neon-laranja', '#FF6B1A'],
    ['--neon-magenta', '#FF2E7E'],
    ['--neon-ambar', '#FFB627'],
    ['--neon-vermelho', '#FF3B3B'],
    ['--neon-verde', '#3DFF9A'],
  ])('define %s = %s', (token, cor) => {
    expect(css).toMatch(new RegExp(`${token}\\s*:\\s*${cor}`, 'i'));
  });
});

describe('M8 · rotas', () => {
  it('slug tira acentos, espaços e maiúsculas', () => {
    expect(slug('Viagem Nordeste')).toBe('viagem-nordeste');
    expect(slug('Aniversário 2025')).toBe('aniversario-2025');
    expect(slug('  São João / 2024 ')).toBe('sao-joao-2024');
  });

  it('monta as URLs de biblioteca, álbum e foto', () => {
    expect(caminhoBiblioteca(3)).toBe('/biblioteca/3');
    expect(caminhoAlbum({ id: 12, titulo: 'Viagem Nordeste' })).toBe('/album/12/viagem-nordeste');
    expect(caminhoFoto({ id: 12, titulo: 'Viagem Nordeste' }, 731)).toBe('/album/12/viagem-nordeste/foto/731');
  });
});

// M8 — Front-end base: tokens CAPRA e rotas (URLs) do site.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { caminhoAlbum, caminhoBiblioteca, caminhoFoto, slug } from '../../web/src/logica/rotas';

describe('M8 · tokens CAPRA (tema Dark, acento Ciano)', () => {
  const css = readFileSync(path.resolve('web/src/tema/tokens.css'), 'utf8');

  it.each([
    ['--background', '#121416'],
    ['--surface', '#181B1E'],
    ['--surface-elevated', '#202428'],
    ['--border', '#2A3035'],
    ['--border-strong', '#68737A'],
    ['--text-primary', '#E8ECEE'],
    ['--text-secondary', '#AAB4B9'],
    ['--accent', '#8FB8C5'],
    ['--on-accent', '#121416'],
    ['--success', '#9DBBAA'],
    ['--warning', '#D6C58F'],
    ['--danger', '#E8877F'],
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

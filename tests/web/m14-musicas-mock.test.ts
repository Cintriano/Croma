// M14 — Músicas mockada: dados fixos válidos para a interface mostrar a biblioteca "Em breve".
import { describe, expect, it } from 'vitest';
import musicas from '../../web/src/mocks/musicas.json';

describe('M14 · mock de Músicas', () => {
  it('tem de 6 a 8 álbuns', () => {
    expect(musicas.albuns.length).toBeGreaterThanOrEqual(6);
    expect(musicas.albuns.length).toBeLessThanOrEqual(8);
  });

  it('cada álbum tem título, as três artes e faixas', () => {
    for (const album of musicas.albuns) {
      expect(album.titulo).toBeTruthy();
      expect(album.poster).toMatch(/\.(jpg|png|webp|svg)$/);
      expect(album.miniatura).toMatch(/\.(jpg|png|webp|svg)$/);
      expect(album.capa).toMatch(/\.(jpg|png|webp|svg)$/);
      expect(album.faixas.length).toBeGreaterThan(0);
    }
  });

  it('ids são únicos', () => {
    const ids = musicas.albuns.map((a: { id: string }) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('está marcada como em breve', () => {
    expect(musicas.emBreve).toBe(true);
  });
});

// M16 — Layout responsivo: detecção de plataforma e colunas da grade.
import { describe, expect, it } from 'vitest';
import { colunasDaGrade, detectarPlataforma } from '../../web/src/plataforma';

const UA_TIZEN = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36';
const UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

describe('M16 · plataforma', () => {
  it('largura < 768 é mobile', () => {
    expect(detectarPlataforma({ largura: 390, userAgent: UA_CHROME, caminho: '/' })).toBe('mobile');
  });

  it('768 a 1919 é desktop', () => {
    expect(detectarPlataforma({ largura: 768, userAgent: UA_CHROME, caminho: '/' })).toBe('desktop');
    expect(detectarPlataforma({ largura: 1919, userAgent: UA_CHROME, caminho: '/' })).toBe('desktop');
  });

  it('navegador Tizen é TV, qualquer que seja a largura', () => {
    expect(detectarPlataforma({ largura: 960, userAgent: UA_TIZEN, caminho: '/' })).toBe('tv');
  });

  it('endereço /tv força o modo TV', () => {
    expect(detectarPlataforma({ largura: 1440, userAgent: UA_CHROME, caminho: '/tv/biblioteca/1' })).toBe('tv');
  });

  it('monitor grande sem Tizen continua desktop', () => {
    expect(detectarPlataforma({ largura: 2560, userAgent: UA_CHROME, caminho: '/' })).toBe('desktop');
  });
});

describe('M16 · colunas da grade', () => {
  it('mobile: 3 posters ou 2 miniaturas', () => {
    expect(colunasDaGrade('mobile', 'poster', 390)).toBe(3);
    expect(colunasDaGrade('mobile', 'miniatura', 390)).toBe(2);
  });

  it('TV: 6 posters ou 4 miniaturas', () => {
    expect(colunasDaGrade('tv', 'poster', 1920)).toBe(6);
    expect(colunasDaGrade('tv', 'miniatura', 1920)).toBe(4);
  });

  it('desktop: de 5 a 8 posters e 3 a 5 miniaturas, crescendo com a largura', () => {
    const larguras = [768, 1024, 1280, 1600, 1919];
    const posters = larguras.map((l) => colunasDaGrade('desktop', 'poster', l));
    const miniaturas = larguras.map((l) => colunasDaGrade('desktop', 'miniatura', l));
    expect(Math.min(...posters)).toBe(5);
    expect(Math.max(...posters)).toBe(8);
    expect(Math.min(...miniaturas)).toBe(3);
    expect(Math.max(...miniaturas)).toBe(5);
    expect(posters).toEqual([...posters].sort((a, b) => a - b));
  });
});

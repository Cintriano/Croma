// M11 — Aleatório e Slides: sorteio, ordem aleatória sem repetição, sequência e intervalo.
import { describe, expect, it, vi } from 'vitest';
import { Apresentacao, criarOrdemAleatoria, sortearIndice } from '../../web/src/logica/slides';

/** Gerador previsível para os testes (mulberry32). */
function rngFixo(semente = 42) {
  let a = semente;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('M11 · Aleatório', () => {
  it('sorteia um índice válido', () => {
    const rng = rngFixo();
    for (let i = 0; i < 50; i++) {
      const indice = sortearIndice(10, rng);
      expect(indice).toBeGreaterThanOrEqual(0);
      expect(indice).toBeLessThan(10);
    }
  });

  it('novo sorteio nunca repete a foto atual quando há mais de uma', () => {
    const rng = rngFixo(7);
    for (let i = 0; i < 50; i++) expect(sortearIndice(3, rng, 1)).not.toBe(1);
  });

  it('com uma foto só, sorteia ela mesma', () => {
    expect(sortearIndice(1, rngFixo(), 0)).toBe(0);
  });

  it('com zero fotos retorna null', () => {
    expect(sortearIndice(0, rngFixo())).toBeNull();
  });
});

describe('M11 · ordem aleatória', () => {
  it('é uma permutação completa', () => {
    const ordem = criarOrdemAleatoria(20, rngFixo());
    expect([...ordem].sort((a, b) => a - b)).toEqual([...Array(20).keys()]);
  });

  it('é previsível com a mesma semente', () => {
    expect(criarOrdemAleatoria(10, rngFixo(1))).toEqual(criarOrdemAleatoria(10, rngFixo(1)));
  });
});

describe('M11 · apresentação', () => {
  it('sequência segue a ordem da grade e para no fim', () => {
    const a = new Apresentacao({ total: 3, modo: 'sequencia' });
    expect([a.atual, a.proxima(), a.proxima(), a.proxima()]).toEqual([0, 1, 2, null]);
  });

  it('sequência pode começar de uma foto específica', () => {
    const a = new Apresentacao({ total: 5, modo: 'sequencia', inicio: 3 });
    expect([a.atual, a.proxima()]).toEqual([3, 4]);
  });

  it('aleatório não repete até passar por todas e depois recomeça', () => {
    const a = new Apresentacao({ total: 6, modo: 'aleatorio', rng: rngFixo(3) });
    const ciclo1 = [a.atual, ...Array.from({ length: 5 }, () => a.proxima())];
    expect(new Set(ciclo1).size).toBe(6);
    const ciclo2 = Array.from({ length: 6 }, () => a.proxima());
    expect(new Set(ciclo2).size).toBe(6);
    expect(ciclo2[0]).not.toBe(ciclo1[5]);
  });

  it('anterior volta pelo histórico', () => {
    const a = new Apresentacao({ total: 6, modo: 'aleatorio', rng: rngFixo(9) });
    const primeira = a.atual;
    const segunda = a.proxima();
    a.proxima();
    expect(a.anterior()).toBe(segunda);
    expect(a.anterior()).toBe(primeira);
    expect(a.anterior()).toBe(primeira);
  });

  it('avança sozinho no intervalo e respeita a pausa', () => {
    vi.useFakeTimers();
    const aoTrocar = vi.fn();
    const a = new Apresentacao({ total: 3, modo: 'sequencia', intervaloMs: 5000, aoTrocar });
    a.iniciar();
    vi.advanceTimersByTime(5000);
    expect(aoTrocar).toHaveBeenLastCalledWith(1);
    a.pausar();
    vi.advanceTimersByTime(20000);
    expect(aoTrocar).toHaveBeenCalledTimes(1);
    a.continuar();
    vi.advanceTimersByTime(5000);
    expect(aoTrocar).toHaveBeenLastCalledWith(2);
    a.parar();
    vi.useRealTimers();
  });
});

// Fila do player de músicas: próxima, anterior, aleatório e formato do tempo.
import { describe, expect, it } from 'vitest';
import { embaralhar, formatarDuracaoTotal, formatarTempo, indiceAnterior, proximoIndice } from '../../web/src/logica/fila';

describe('fila do player', () => {
  it('próxima avança e termina no fim da fila', () => {
    expect(proximoIndice(3, 0)).toBe(1);
    expect(proximoIndice(3, 2)).toBeNull();
    expect(proximoIndice(0, 0)).toBeNull();
  });

  it('anterior volta e a primeira faixa não tem anterior', () => {
    expect(indiceAnterior(2)).toBe(1);
    expect(indiceAnterior(0)).toBeNull();
  });

  it('embaralhar mantém todas as faixas e não altera a fila original', () => {
    const fila = ['a', 'b', 'c', 'd', 'e'];
    const misturada = embaralhar(fila, () => 0.1);
    expect([...misturada].sort()).toEqual(fila);
    expect(fila).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('formata o tempo em m:ss e h:mm:ss', () => {
    expect(formatarTempo(0)).toBe('0:00');
    expect(formatarTempo(65.9)).toBe('1:05');
    expect(formatarTempo(3725)).toBe('1:02:05');
    expect(formatarTempo(NaN)).toBe('0:00');
  });
});

describe('duração total do álbum', () => {
  it('escreve em minutos e, a partir de 1 h, em horas e minutos', () => {
    expect(formatarDuracaoTotal(2700)).toBe('45 min');
    expect(formatarDuracaoTotal(3900)).toBe('1 h 05 min');
    expect(formatarDuracaoTotal(7200)).toBe('2 h 00 min');
    expect(formatarDuracaoTotal(40)).toBe('40 s');
  });

  it('sem duração conhecida não escreve nada', () => {
    expect(formatarDuracaoTotal(0)).toBe('');
    expect(formatarDuracaoTotal(NaN)).toBe('');
  });
});

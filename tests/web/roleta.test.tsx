// Roleta do Aleatório: montagem da faixa e fluxo em etapas (álbum → foto).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { montarFaixa } from '../../web/src/logica/roleta';
import { Roleta, type EtapaRoleta } from '../../web/src/componentes/Roleta';

const itens = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('montarFaixa', () => {
  it('põe o vencedor na posição indicada e deixa células depois dele', () => {
    const { celulas, indiceVencedor } = montarFaixa(itens(10), 7, () => 0.3, 40);
    expect(celulas).toHaveLength(40);
    expect(celulas[indiceVencedor]).toBe(7);
    expect(indiceVencedor).toBeLessThan(39);
  });

  it('não repete o vencedor fora da posição dele quando há outros itens', () => {
    const { celulas, indiceVencedor } = montarFaixa(itens(5), 2, Math.random, 40);
    expect(celulas.filter((c, i) => c === 2 && i !== indiceVencedor)).toHaveLength(0);
  });

  it('funciona com um único item', () => {
    const { celulas } = montarFaixa(['a'], 0);
    expect(new Set(celulas)).toEqual(new Set(['a']));
  });
});

describe('Roleta', () => {
  afterEach(() => vi.useRealTimers());

  const etapas: EtapaRoleta[] = [
    { rotulo: 'Sorteando o álbum…', itens: [{ chave: 1, fotoId: 1, legenda: 'Viagem' }, { chave: 2, fotoId: 2, legenda: 'Festa' }], vencedor: 1 },
    { rotulo: 'Sorteando a foto…', itens: [{ chave: 9, fotoId: 9, legenda: 'IMG_9.jpg' }, { chave: 8, fotoId: 8, legenda: 'IMG_8.jpg' }], vencedor: 0 },
  ];

  it('passa do álbum para a foto e só conclui ao parar na foto', () => {
    vi.useFakeTimers();
    const onConcluir = vi.fn();
    render(<Roleta etapas={etapas} onConcluir={onConcluir} onFechar={() => {}} />);
    expect(screen.getByText('Sorteando o álbum…')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(4300); });
    expect(screen.getByText('Festa')).toBeInTheDocument();
    expect(onConcluir).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1200); });
    expect(screen.getByText('Sorteando a foto…')).toBeInTheDocument();
    expect(onConcluir).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(4300); });
    expect(screen.getByText('IMG_9.jpg')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1200); });
    expect(onConcluir).toHaveBeenCalledTimes(1);
  });

  it('Esc fecha sem concluir', () => {
    const onConcluir = vi.fn();
    const onFechar = vi.fn();
    render(<Roleta etapas={etapas} onConcluir={onConcluir} onFechar={onFechar} />);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(onFechar).toHaveBeenCalledTimes(1);
    expect(onConcluir).not.toHaveBeenCalled();
  });
});

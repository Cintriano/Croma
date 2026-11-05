// Sorteio orbital do Aleatório: montagem da órbita, curva e fluxo em etapas (álbum → foto).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { anguloFinal, anguloInicial, easeEnter, montarOrbita, poseNaOrbita, VOLTAS } from '../../web/src/logica/roleta';
import { GIRO_MS, PAUSA_MS, Roleta, type EtapaRoleta } from '../../web/src/componentes/Roleta';

const itens = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('montarOrbita', () => {
  it('põe o vencedor numa das vagas', () => {
    const { celulas, indiceVencedor } = montarOrbita(itens(10), 7, () => 0.3, 8);
    expect(celulas).toHaveLength(8);
    expect(celulas[indiceVencedor]).toBe(7);
  });

  it('não repete o vencedor fora da vaga dele quando há outros itens', () => {
    const { celulas, indiceVencedor } = montarOrbita(itens(3), 2, Math.random, 8);
    expect(celulas.filter((c, i) => c === 2 && i !== indiceVencedor)).toHaveLength(0);
  });

  it('funciona com um único item', () => {
    const { celulas } = montarOrbita(['a'], 0);
    expect(new Set(celulas)).toEqual(new Set(['a']));
  });
});

describe('órbita', () => {
  it('o ângulo final leva a vaga vencedora para a frente, maior e opaca', () => {
    const pose = poseNaOrbita(anguloFinal(3, 8) + 3 * ((2 * Math.PI) / 8), 300, 90);
    expect(pose.x).toBeCloseTo(0);
    expect(pose.y).toBeCloseTo(90);
    expect(pose.escala).toBeCloseTo(1);
    expect(pose.opacidade).toBeCloseTo(1);
  });

  it('o giro parte VOLTAS antes, com o vencedor atrás do núcleo', () => {
    expect(anguloInicial(2, 8) - anguloFinal(2, 8)).toBeCloseTo(VOLTAS * 2 * Math.PI);
    const atras = poseNaOrbita(anguloInicial(2, 8) + 2 * ((2 * Math.PI) / 8), 300, 90);
    expect(atras.profundidade).toBeCloseTo(0);
  });

  it('ease-enter vai de 0 a 1 sem passar do fim (sem rebote)', () => {
    let anterior = 0;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeEnter(t);
      expect(v).toBeGreaterThanOrEqual(anterior - 1e-9);
      expect(v).toBeLessThanOrEqual(1);
      anterior = v;
    }
    expect(easeEnter(0)).toBe(0);
    expect(easeEnter(1)).toBe(1);
    expect(easeEnter(0.5)).toBeGreaterThan(0.8); // desacelera ao chegar
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

    act(() => { vi.advanceTimersByTime(GIRO_MS + 10); });
    expect(screen.getByText('Festa')).toBeInTheDocument();
    expect(onConcluir).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(PAUSA_MS + 10); });
    expect(screen.getByText('Sorteando a foto…')).toBeInTheDocument();
    expect(onConcluir).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(GIRO_MS + 10); });
    expect(screen.getByText('IMG_9.jpg')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(PAUSA_MS + 10); });
    expect(onConcluir).toHaveBeenCalledTimes(1);
  });

  it('um toque no palco para o giro na hora e outro segue sem esperar a pausa', () => {
    vi.useFakeTimers();
    const onConcluir = vi.fn();
    const { container } = render(<Roleta etapas={[etapas[1]]} onConcluir={onConcluir} onFechar={() => {}} />);
    const palco = container.querySelector('.roleta-palco')!;

    act(() => { fireEvent.click(palco); });
    expect(screen.getByText('IMG_9.jpg')).toBeInTheDocument();
    expect(container.querySelector('.orbita[data-parou="true"]')).not.toBeNull();
    expect(onConcluir).not.toHaveBeenCalled();

    act(() => { fireEvent.click(palco); });
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

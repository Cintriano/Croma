// Roleta do Aleatório: o vencedor já está sorteado, a faixa só encena o giro até ele.
import { criarOrdemAleatoria, type Rng } from './slides';

const CELULAS_APOS_VENCEDOR = 5;

/**
 * Monta a faixa que gira: `tamanho` células, com o vencedor perto do fim e as demais
 * sorteadas entre os outros itens (repetidas em ciclo quando há poucos).
 */
export function montarFaixa<T>(itens: T[], vencedor: number, rng: Rng = Math.random, tamanho = 40): { celulas: T[]; indiceVencedor: number } {
  const indiceVencedor = tamanho - 1 - CELULAS_APOS_VENCEDOR;
  const outros = criarOrdemAleatoria(itens.length, rng).filter((i) => i !== vencedor);
  const celulas = Array.from({ length: tamanho }, (_, posicao) =>
    posicao === indiceVencedor || outros.length === 0 ? itens[vencedor] : itens[outros[posicao % outros.length]],
  );
  return { celulas, indiceVencedor };
}

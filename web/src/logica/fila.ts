// Fila do player de músicas: quem toca depois, quem toca antes e a ordem aleatória.
import { criarOrdemAleatoria, type Rng } from './slides';

export interface FaixaFila {
  id: string;
  titulo: string;
  bibliotecaId: number;
  /** Nome do álbum, mostrado no player. */
  album: string;
  capaId: string | null;
}

/** Índice da faixa seguinte, ou null quando a fila terminou. */
export const proximoIndice = (total: number, indice: number): number | null => (indice + 1 < total ? indice + 1 : null);

/** Índice da faixa anterior (a primeira não tem anterior). */
export const indiceAnterior = (indice: number): number | null => (indice > 0 ? indice - 1 : null);

/** Passado mais de 3 s, "anterior" volta ao começo da faixa em vez de pular para a anterior. */
export const LIMITE_REINICIAR_S = 3;

/** Fila em ordem aleatória, sem mudar o original. */
export function embaralhar<T>(fila: T[], rng: Rng = Math.random): T[] {
  return criarOrdemAleatoria(fila.length, rng).map((i) => fila[i]);
}

/** Total de um álbum em texto corrido: "47 min", "1 h 05 min" (abaixo de 1 min, em segundos). */
export function formatarDuracaoTotal(segundos: number): string {
  const total = Math.round(segundos);
  if (!Number.isFinite(total) || total <= 0) return '';
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  if (horas > 0) return `${horas} h ${String(minutos).padStart(2, '0')} min`;
  return minutos > 0 ? `${minutos} min` : `${total} s`;
}

export function formatarTempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00';
  const total = Math.floor(segundos);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = String(total % 60).padStart(2, '0');
  return horas > 0 ? `${horas}:${String(minutos).padStart(2, '0')}:${resto}` : `${minutos}:${resto}`;
}

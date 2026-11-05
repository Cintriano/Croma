// Sorteio orbital do Aleatório: o vencedor já está sorteado, a órbita só encena o giro até ele.
// Movimento conforme a Parte 11 do manual CAPRA: gira em volta do núcleo, desacelera ao chegar (ease-enter) e termina parado.
import { criarOrdemAleatoria, type Rng } from './slides';

/** Vagas na órbita; com menos itens, os outros se repetem em ciclo. */
export const VAGAS_ORBITA = 8;
/** Voltas do giro: com 1,5 o vencedor começa atrás do núcleo e chega pela frente. */
export const VOLTAS = 1.5;

/**
 * Monta as vagas da órbita: o vencedor numa posição sorteada e as demais com outros itens
 * (sem repetir o vencedor quando há outros; repetidos em ciclo quando há poucos).
 */
export function montarOrbita<T>(itens: T[], vencedor: number, rng: Rng = Math.random, vagas = VAGAS_ORBITA): { celulas: T[]; indiceVencedor: number } {
  const indiceVencedor = Math.floor(rng() * vagas);
  const outros = criarOrdemAleatoria(itens.length, rng).filter((i) => i !== vencedor);
  let proximo = 0;
  const celulas = Array.from({ length: vagas }, (_, posicao) =>
    posicao === indiceVencedor || outros.length === 0 ? itens[vencedor] : itens[outros[proximo++ % outros.length]],
  );
  return { celulas, indiceVencedor };
}

/** Ângulo da órbita (rad) em que a vaga `indice` fica na frente, sob o ponto de acento. */
export const anguloFinal = (indice: number, vagas: number) => -indice * ((2 * Math.PI) / vagas);

/** Ângulo de partida: `VOLTAS` antes do final. */
export const anguloInicial = (indice: number, vagas: number) => anguloFinal(indice, vagas) + VOLTAS * 2 * Math.PI;

export interface Pose {
  x: number;
  y: number;
  escala: number;
  opacidade: number;
  /** 0 atrás do núcleo, 1 na frente. */
  profundidade: number;
}

/**
 * Posição de uma vaga na órbita em perspectiva (elipse de raios `rx` × `ry`, frente embaixo).
 * Atrás fica menor e mais apagada; a perspectiva é leve, sem 3D.
 */
export function poseNaOrbita(angulo: number, rx: number, ry: number): Pose {
  const profundidade = (1 + Math.cos(angulo)) / 2;
  return {
    x: rx * Math.sin(angulo),
    y: ry * Math.cos(angulo),
    escala: 0.5 + 0.5 * profundidade,
    opacidade: 0.25 + 0.75 * profundidade,
    profundidade,
  };
}

/** Curva cúbica de Bézier como no CSS (`cubic-bezier(x1, y1, x2, y2)`): recebe o tempo de 0 a 1 e devolve o progresso. */
export function curvaBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const eixo = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  const derivada = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s ** 2;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Newton para achar o parâmetro cujo x é t; bisseção quando a derivada some.
    let s = t;
    for (let i = 0; i < 8; i++) {
      const erro = eixo(x1, x2, s) - t;
      if (Math.abs(erro) < 1e-6) return eixo(y1, y2, s);
      const d = derivada(x1, x2, s);
      if (Math.abs(d) < 1e-6) break;
      s -= erro / d;
    }
    let baixo = 0;
    let alto = 1;
    s = t;
    for (let i = 0; i < 30; i++) {
      if (eixo(x1, x2, s) < t) baixo = s;
      else alto = s;
      s = (baixo + alto) / 2;
    }
    return eixo(y1, y2, s);
  };
}

/** Token `ease-enter` da CAPRA: desacelera ao chegar. */
export const easeEnter = curvaBezier(0.2, 0, 0, 1);

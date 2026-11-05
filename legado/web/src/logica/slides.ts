// Aleatório e Slides: sorteio sem repetir a foto atual e apresentação com histórico e intervalo.

export type Rng = () => number;
export type ModoSlides = 'sequencia' | 'aleatorio';

export function sortearIndice(total: number, rng: Rng = Math.random, atual?: number | null): number | null {
  if (total <= 0) return null;
  if (total === 1) return 0;
  const evitar = atual !== undefined && atual !== null && atual >= 0 && atual < total;
  const sorteado = Math.floor(rng() * (evitar ? total - 1 : total));
  return evitar && sorteado >= atual ? sorteado + 1 : sorteado;
}

// Fisher–Yates: permutação completa dos índices 0..n-1.
export function criarOrdemAleatoria(n: number, rng: Rng = Math.random): number[] {
  const ordem = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return ordem;
}

export interface OpcoesApresentacao {
  total: number;
  modo: ModoSlides;
  inicio?: number;
  intervaloMs?: number;
  rng?: Rng;
  aoTrocar?: (indice: number) => void;
}

export class Apresentacao {
  private readonly total: number;
  private readonly modo: ModoSlides;
  private readonly intervaloMs: number;
  private readonly rng: Rng;
  private readonly aoTrocar?: (indice: number) => void;

  /** Fila de índices ainda não mostrados no ciclo aleatório (ou a sequência inteira). */
  private fila: number[] = [];
  private historico: number[] = [];
  private posicao = 0;
  private relogio: ReturnType<typeof setInterval> | null = null;
  private rodando = false;

  constructor(opcoes: OpcoesApresentacao) {
    this.total = opcoes.total;
    this.modo = opcoes.modo;
    this.intervaloMs = opcoes.intervaloMs ?? 5000;
    this.rng = opcoes.rng ?? Math.random;
    this.aoTrocar = opcoes.aoTrocar;

    const inicio = opcoes.inicio !== undefined && opcoes.inicio >= 0 && opcoes.inicio < this.total ? opcoes.inicio : undefined;
    if (this.total === 0) return;
    if (this.modo === 'sequencia') {
      const primeiro = inicio ?? 0;
      this.historico = [primeiro];
      this.fila = [...Array(this.total).keys()].slice(primeiro + 1);
    } else {
      const ordem = criarOrdemAleatoria(this.total, this.rng);
      if (inicio !== undefined) {
        ordem.splice(ordem.indexOf(inicio), 1);
        ordem.unshift(inicio);
      }
      this.historico = [ordem.shift()!];
      this.fila = ordem;
    }
  }

  get atual(): number | null {
    return this.historico[this.posicao] ?? null;
  }

  get emAndamento(): boolean {
    return this.rodando;
  }

  proxima(): number | null {
    if (this.total === 0) return null;
    if (this.posicao < this.historico.length - 1) return this.historico[++this.posicao];

    if (this.fila.length === 0) {
      if (this.modo === 'sequencia') return null;
      // Novo ciclo aleatório, sem começar pela foto que terminou o anterior.
      const ordem = criarOrdemAleatoria(this.total, this.rng);
      if (this.total > 1 && ordem[0] === this.atual) [ordem[0], ordem[1]] = [ordem[1], ordem[0]];
      this.fila = ordem;
    }
    this.historico.push(this.fila.shift()!);
    this.posicao = this.historico.length - 1;
    return this.atual;
  }

  anterior(): number | null {
    if (this.posicao > 0) this.posicao--;
    return this.atual;
  }

  iniciar(): void {
    this.rodando = true;
    this.agendar();
  }

  pausar(): void {
    this.rodando = false;
    this.limpar();
  }

  continuar(): void {
    this.iniciar();
  }

  parar(): void {
    this.rodando = false;
    this.limpar();
  }

  private agendar(): void {
    this.limpar();
    this.relogio = setInterval(() => {
      const indice = this.proxima();
      if (indice === null) this.parar();
      else this.aoTrocar?.(indice);
    }, this.intervaloMs);
  }

  private limpar(): void {
    if (this.relogio !== null) clearInterval(this.relogio);
    this.relogio = null;
  }
}

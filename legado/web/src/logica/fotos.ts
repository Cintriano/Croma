import type { FotoUI, Nivel } from '../tipos';

export type FiltroDeNivel = 'todos' | Nivel | 'sem';
export type CampoOrdem = 'nivel' | 'data' | 'nome';
export interface Ordem {
  campo: CampoOrdem;
  direcao: 'asc' | 'desc';
}

export const ORDEM_PADRAO: Ordem = { campo: 'nivel', direcao: 'asc' };

const comparador = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

export function filtrarPorNivel<F extends Pick<FotoUI, 'nivel'>>(fotos: F[], filtro: FiltroDeNivel): F[] {
  if (filtro === 'todos') return [...fotos];
  if (filtro === 'sem') return fotos.filter((f) => f.nivel === null);
  return fotos.filter((f) => f.nivel === filtro);
}

// Fotos sem nível (ou sem data) ficam sempre no fim, nos dois sentidos; o desempate é pelo nome.
export function ordenarFotos<F extends FotoUI>(fotos: F[], ordem: Ordem): F[] {
  const sinal = ordem.direcao === 'asc' ? 1 : -1;
  const porNome = (a: F, b: F) => comparador.compare(a.nome, b.nome);
  const comVazioNoFim = <V,>(a: V | null, b: V | null, comparar: (x: V, y: V) => number) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return sinal * comparar(a, b);
  };

  return [...fotos].sort((a, b) => {
    switch (ordem.campo) {
      case 'nivel':
        return comVazioNoFim(a.nivel, b.nivel, (x, y) => x - y) || porNome(a, b);
      case 'data':
        return comVazioNoFim(a.dataCaptura, b.dataCaptura, (x, y) => Date.parse(x) - Date.parse(y)) || porNome(a, b);
      case 'nome':
        return sinal * porNome(a, b);
    }
  });
}

export function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

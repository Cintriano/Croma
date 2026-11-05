// Navegação da TV pelo controle: teclas → ações, foco espacial por fileiras e memória de foco por tela.

export type Acao = 'esquerda' | 'direita' | 'cima' | 'baixo' | 'ok' | 'voltar' | 'playPause';
export type Direcao = 'esquerda' | 'direita' | 'cima' | 'baixo';

export interface Retangulo {
  id: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
}

// Códigos do controle Samsung (Tizen) que chegam com key "Unidentified" ou nomes próprios.
const CODIGO_VOLTAR = 10009;
const CODIGO_PLAY_PAUSE = 10252;

const POR_TECLA: Record<string, Acao> = {
  ArrowLeft: 'esquerda',
  ArrowRight: 'direita',
  ArrowUp: 'cima',
  ArrowDown: 'baixo',
  Enter: 'ok',
  Escape: 'voltar',
  Backspace: 'voltar',
  XF86Back: 'voltar',
  MediaPlayPause: 'playPause',
  ' ': 'playPause',
};

export function acaoDaTecla(evento: { key: string; keyCode?: number }): Acao | null {
  if (evento.keyCode === CODIGO_VOLTAR) return 'voltar';
  if (evento.keyCode === CODIGO_PLAY_PAUSE) return 'playPause';
  return POR_TECLA[evento.key] ?? null;
}

const centroX = (r: Retangulo) => r.x + r.largura / 2;
const centroY = (r: Retangulo) => r.y + r.altura / 2;
const mesmaFileira = (a: Retangulo, b: Retangulo) => a.y < b.y + b.altura && b.y < a.y + a.altura;

// ← → andam na fileira e param no fim; ↑ ↓ vão para a fileira vizinha, na coluna mais próxima.
export function proximoFoco(atualId: string, direcao: Direcao, retangulos: Retangulo[]): string | null {
  const atual = retangulos.find((r) => r.id === atualId);
  if (!atual) return retangulos[0]?.id ?? null;
  const outros = retangulos.filter((r) => r.id !== atualId);

  if (direcao === 'esquerda' || direcao === 'direita') {
    const sinal = direcao === 'direita' ? 1 : -1;
    const candidatos = outros.filter((r) => mesmaFileira(r, atual) && sinal * (centroX(r) - centroX(atual)) > 0);
    candidatos.sort((a, b) => Math.abs(centroX(a) - centroX(atual)) - Math.abs(centroX(b) - centroX(atual)));
    return candidatos[0]?.id ?? null;
  }

  const sinal = direcao === 'baixo' ? 1 : -1;
  const candidatos = outros.filter((r) => !mesmaFileira(r, atual) && sinal * (centroY(r) - centroY(atual)) > 0);
  if (candidatos.length === 0) return null;
  // A fileira vizinha é a mais próxima na vertical; dentro dela, vence a coluna mais próxima.
  const maisPerto = candidatos.reduce((a, b) => (Math.abs(centroY(b) - centroY(atual)) < Math.abs(centroY(a) - centroY(atual)) ? b : a));
  const fileira = candidatos.filter((r) => mesmaFileira(r, maisPerto));
  fileira.sort((a, b) => Math.abs(centroX(a) - centroX(atual)) - Math.abs(centroX(b) - centroX(atual)));
  return fileira[0].id;
}

// Ao voltar para uma tela, o foco retorna ao elemento de onde o usuário saiu.
export class MemoriaFoco {
  private readonly porTela = new Map<string, string>();

  lembrar(tela: string, id: string): void {
    this.porTela.set(tela, id);
  }

  recuperar(tela: string): string | null {
    return this.porTela.get(tela) ?? null;
  }
}

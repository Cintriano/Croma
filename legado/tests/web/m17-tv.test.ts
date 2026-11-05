// M17 — Modo TV: teclas do controle Samsung, navegação espacial e memória de foco.
import { describe, expect, it } from 'vitest';
import { acaoDaTecla, MemoriaFoco, proximoFoco, type Retangulo } from '../../web/src/tv/navegacao';

// Duas fileiras: botões (y=0) e cards (y=200), com colunas desalinhadas de propósito.
const ELEMENTOS: Retangulo[] = [
  { id: 'slides', x: 0, y: 0, largura: 200, altura: 60 },
  { id: 'aleatorio', x: 220, y: 0, largura: 200, altura: 60 },
  { id: 'card-1', x: 0, y: 200, largura: 300, altura: 170 },
  { id: 'card-2', x: 320, y: 200, largura: 300, altura: 170 },
  { id: 'card-3', x: 640, y: 200, largura: 300, altura: 170 },
];

describe('M17 · teclas do controle', () => {
  it.each([
    [{ key: 'ArrowLeft' }, 'esquerda'],
    [{ key: 'ArrowRight' }, 'direita'],
    [{ key: 'ArrowUp' }, 'cima'],
    [{ key: 'ArrowDown' }, 'baixo'],
    [{ key: 'Enter' }, 'ok'],
    [{ key: 'Escape' }, 'voltar'],
    [{ key: 'Backspace' }, 'voltar'],
    [{ key: 'XF86Back', keyCode: 10009 }, 'voltar'],
    [{ key: 'Unidentified', keyCode: 10009 }, 'voltar'],
    [{ key: 'MediaPlayPause' }, 'playPause'],
    [{ key: 'Unidentified', keyCode: 10252 }, 'playPause'],
    [{ key: 'a' }, null],
  ])('%o → %s', (evento, acao) => {
    expect(acaoDaTecla(evento)).toBe(acao);
  });
});

describe('M17 · navegação espacial', () => {
  it('→ anda dentro da fileira', () => {
    expect(proximoFoco('card-1', 'direita', ELEMENTOS)).toBe('card-2');
  });

  it('no fim da fileira → para (não dá a volta)', () => {
    expect(proximoFoco('card-3', 'direita', ELEMENTOS)).toBeNull();
    expect(proximoFoco('card-1', 'esquerda', ELEMENTOS)).toBeNull();
  });

  it('↓ vai para a fileira de baixo, na coluna mais próxima', () => {
    expect(proximoFoco('aleatorio', 'baixo', ELEMENTOS)).toBe('card-2');
    expect(proximoFoco('slides', 'baixo', ELEMENTOS)).toBe('card-1');
  });

  it('↑ volta para a fileira de cima, na coluna mais próxima', () => {
    expect(proximoFoco('card-3', 'cima', ELEMENTOS)).toBe('aleatorio');
  });

  it('↑ na primeira fileira não sai do lugar', () => {
    expect(proximoFoco('slides', 'cima', ELEMENTOS)).toBeNull();
  });
});

describe('M17 · memória de foco', () => {
  it('lembra o foco de cada tela', () => {
    const memoria = new MemoriaFoco();
    memoria.lembrar('/biblioteca/1', 'card-7');
    memoria.lembrar('/album/3/viagem', 'foto-12');
    expect(memoria.recuperar('/biblioteca/1')).toBe('card-7');
    expect(memoria.recuperar('/album/3/viagem')).toBe('foto-12');
  });

  it('tela nunca visitada não tem foco guardado', () => {
    expect(new MemoriaFoco().recuperar('/x')).toBeNull();
  });
});
